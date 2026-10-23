using CircleHub.Api.Services.Storage;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using SkiaSharp;

namespace CircleHub.Api.Services
{
    /// <summary>
    /// Turns an uploaded image into a bounded WebP and puts it in Cloudflare R2. Re-encoding is
    /// deliberate: it strips EXIF, rejects unsupported sources, and gives every stored image
    /// the same format and cache policy.
    /// </summary>
    public class UploadService
    {
        private const long DefaultMaxImageBytes = 5 * 1024 * 1024; // 5 MB
        private const long MaxImagePixels = 40_000_000;
        private const int WebpQuality = 82;

        private readonly IWebHostEnvironment _env;
        private readonly IObjectStorage _storage;
        private readonly long _maxImageBytes;

        public UploadService(
            IWebHostEnvironment env,
            IObjectStorage storage,
            IOptions<R2Options> options)
        {
            _env = env;
            _storage = storage;
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
            output.Position = 0;

            var key = $"{folder}/{DateTime.UtcNow:yyyy/MM}/{Guid.NewGuid():N}.webp";

            if (_storage.IsConfigured)
            {
                return await _storage.UploadPublicAsync(key, output, "image/webp");
            }

            var webRoot = _env.WebRootPath
                ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var relativeFolder = key.Replace('/', Path.DirectorySeparatorChar);
            var absolute = Path.Combine(webRoot, "uploads", relativeFolder);
            var directory = Path.GetDirectoryName(absolute)
                ?? throw new InvalidOperationException("Could not resolve the upload directory.");

            Directory.CreateDirectory(directory);
            await File.WriteAllBytesAsync(absolute, output.ToArray());

            return $"/uploads/{key}";
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
