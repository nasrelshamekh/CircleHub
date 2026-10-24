using CircleHub.Api.Services.Storage;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SkiaSharp;

namespace CircleHub.Api.Services
{
    /// <summary>
    /// Turns an uploaded image into a bounded WebP and puts it in Cloudflare R2 or local storage.
    /// Re-encoding is deliberate: it strips EXIF, rejects unsupported sources, and gives every stored
    /// image the same format and cache policy. If native SkiaSharp fails to load (e.g. 32-bit hosting
    /// or missing MSVC runtime), it gracefully falls back to storing verified raw JPG/PNG/WebP images.
    /// </summary>
    public class UploadService
    {
        private const long DefaultMaxImageBytes = 5 * 1024 * 1024; // 5 MB
        private const long MaxImagePixels = 40_000_000;
        private const int WebpQuality = 82;

        private readonly IWebHostEnvironment _env;
        private readonly IObjectStorage _storage;
        private readonly ILogger<UploadService> _logger;
        private readonly long _maxImageBytes;

        public UploadService(
            IWebHostEnvironment env,
            IObjectStorage storage,
            IOptions<R2Options> options,
            ILogger<UploadService> logger)
        {
            _env = env;
            _storage = storage;
            _logger = logger;
            _maxImageBytes = options.Value.MaxUploadBytes > 0
                ? options.Value.MaxUploadBytes
                : DefaultMaxImageBytes;
        }

        public Task<string?> SavePostImageAsync(IFormFile? image) =>
            SaveImageAsync(image, "posts", 1600);

        public Task<string?> SaveUserImageAsync(IFormFile? image, bool cover = false) =>
            SaveImageAsync(image, cover ? "covers" : "avatars", cover ? 1920 : 512);

        public Task<string?> SaveCommunityImageAsync(IFormFile? image, bool cover = false) =>
            SaveImageAsync(image, cover ? "community-covers" : "communities", cover ? 1920 : 512);

        /// <summary>
        /// Accepts a URL this API produced: either an R2 public URL or a legacy local
        /// <c>/uploads/...</c> path. A client cannot point an avatar at an arbitrary host.
        /// </summary>
        public bool IsOwnedImageUrl(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return true;

            if (_storage.TryGetPublicKey(url.Trim(), out _))
                return true;

            var extension = Path.GetExtension(url).ToLowerInvariant();

            return url.StartsWith("/uploads/", StringComparison.Ordinal)
                && !url.Contains("..")
                && extension is ".jpg" or ".jpeg" or ".png" or ".webp";
        }

        public async Task DeleteImageAsync(string? url, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(url))
                return;

            if (_storage.TryGetPublicKey(url.Trim(), out var key))
            {
                await _storage.DeletePublicAsync(key, cancellationToken);
                return;
            }

            if (!url.StartsWith("/uploads/", StringComparison.Ordinal))
                return;

            var webRoot = Path.GetFullPath(
                _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"));
            var relative = url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var absolute = Path.GetFullPath(Path.Combine(webRoot, relative));

            if (!absolute.StartsWith(webRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                return;

            if (File.Exists(absolute))
                File.Delete(absolute);
        }

        private async Task<string?> SaveImageAsync(
            IFormFile? image,
            string folder,
            int maxDimension)
        {
            if (image is null || image.Length == 0)
                return null;

            if (image.Length > _maxImageBytes)
                throw new ArgumentException($"Image must be at most {_maxImageBytes / (1024 * 1024)} MB");

            using var source = new MemoryStream();
            await using (var upload = image.OpenReadStream())
            {
                await upload.CopyToAsync(source);
            }

            var bytes = source.ToArray();
            byte[] outputBytes;
            string extension;
            string contentType;

            try
            {
                using var codec = SKCodec.Create(new SKMemoryStream(bytes));
                if (codec is null)
                    throw new ArgumentException("Image file is invalid or corrupted");

                var info = codec.Info;
                if (info.Width <= 0 || info.Height <= 0 ||
                    info.Width * (long)info.Height > MaxImagePixels)
                {
                    throw new ArgumentException("Image dimensions are not supported");
                }

                var format = codec.EncodedFormat;
                if (format != SKEncodedImageFormat.Jpeg &&
                    format != SKEncodedImageFormat.Png &&
                    format != SKEncodedImageFormat.Webp)
                {
                    throw new ArgumentException("Image must be a JPG, PNG or WebP file");
                }

                using var original = SKBitmap.Decode(codec)
                    ?? throw new ArgumentException("Image file is invalid or corrupted");

                using var picture = original.ColorType == SKColorType.Rgba8888 ||
                                    original.ColorType == SKColorType.Bgra8888
                    ? original
                    : original.Copy(SKColorType.Rgba8888);

                using var scaled = ScaleBitmap(picture, maxDimension);
                using var imageData = scaled.Encode(SKEncodedImageFormat.Webp, WebpQuality);
                using var output = new MemoryStream();
                imageData.SaveTo(output);
                outputBytes = output.ToArray();
                extension = "webp";
                contentType = "image/webp";
            }
            catch (ArgumentException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "SkiaSharp re-encoding failed; evaluating fallback for raw image upload");

                if (IsSupportedRawImage(bytes, out var fallbackExt, out var fallbackContentType))
                {
                    outputBytes = bytes;
                    extension = fallbackExt;
                    contentType = fallbackContentType;
                }
                else
                {
                    throw new ArgumentException("Image must be a valid JPG, PNG or WebP file");
                }
            }

            var key = $"{folder}/{DateTime.UtcNow:yyyy/MM}/{Guid.NewGuid():N}.{extension}";
            using var payloadStream = new MemoryStream(outputBytes);

            if (_storage.IsConfigured)
            {
                return await _storage.UploadPublicAsync(key, payloadStream, contentType);
            }

            var webRoot = _env.WebRootPath
                ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var relativeFolder = key.Replace('/', Path.DirectorySeparatorChar);
            var absolute = Path.Combine(webRoot, "uploads", relativeFolder);
            var directory = Path.GetDirectoryName(absolute)
                ?? throw new InvalidOperationException("Could not resolve the upload directory.");

            Directory.CreateDirectory(directory);
            await File.WriteAllBytesAsync(absolute, outputBytes);

            return $"/uploads/{key}";
        }

        private static bool IsSupportedRawImage(byte[] bytes, out string extension, out string contentType)
        {
            if (bytes.Length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF)
            {
                extension = "jpg";
                contentType = "image/jpeg";
                return true;
            }

            if (bytes.Length >= 8 &&
                bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47 &&
                bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A)
            {
                extension = "png";
                contentType = "image/png";
                return true;
            }

            if (bytes.Length >= 12 &&
                bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46 &&
                bytes[8] == 0x57 && bytes[9] == 0x45 && bytes[10] == 0x42 && bytes[11] == 0x50)
            {
                extension = "webp";
                contentType = "image/webp";
                return true;
            }

            extension = string.Empty;
            contentType = string.Empty;
            return false;
        }

        private static SKBitmap ScaleBitmap(SKBitmap source, int maxDimension)
        {
            if (source.Width <= maxDimension && source.Height <= maxDimension)
                return source.Copy();

            var ratio = Math.Min((double)maxDimension / source.Width, (double)maxDimension / source.Height);
            var width = Math.Max(1, (int)Math.Round(source.Width * ratio));
            var height = Math.Max(1, (int)Math.Round(source.Height * ratio));

            var info = new SKImageInfo(width, height, source.ColorType, source.AlphaType);
            var scaled = source.Resize(info, SKSamplingOptions.Default);
            if (scaled is null)
                throw new ArgumentException("Image file is invalid or corrupted");

            return scaled;
        }
    }
}
