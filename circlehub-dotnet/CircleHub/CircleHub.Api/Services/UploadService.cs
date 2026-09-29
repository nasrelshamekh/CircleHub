using Microsoft.AspNetCore.Http;

namespace CircleHub.Api.Services
{
    public class UploadService
    {
        private const long MaxImageBytes = 5 * 1024 * 1024; // 5 MB

        private static readonly string[] AllowedExtensions =
            { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

        private static readonly Dictionary<string, byte[]> AllowedMagicBytes =
            new()
            {
                [".jpg"] = new byte[] { 0xFF, 0xD8, 0xFF },
                [".jpeg"] = new byte[] { 0xFF, 0xD8, 0xFF },
                [".png"] = new byte[] { 0x89, 0x50, 0x4E, 0x47 },
                [".gif"] = new byte[] { 0x47, 0x49, 0x46, 0x38 },
                [".webp"] = new byte[] { 0x52, 0x49, 0x46, 0x46 }
            };

        private readonly IWebHostEnvironment _env;

        public UploadService(IWebHostEnvironment env)
        {
            _env = env;
        }

        private async Task<string?> SaveImageAsync(IFormFile? image, string subDir)
        {
            if (image is null || image.Length == 0)
                return null;

            if (image.Length > MaxImageBytes)
                throw new ArgumentException("Image must be at most 5 MB");

            var extension = Path.GetExtension(image.FileName).ToLowerInvariant();

            if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
                throw new ArgumentException("Image must be a JPG, PNG, GIF or WebP file");

            var stream = image.OpenReadStream();
            await using (stream)
            {
                var signatureLength = AllowedMagicBytes[extension].Length;

                if (stream.Length < signatureLength)
                    throw new ArgumentException("Image file is invalid or corrupted");

                var header = new byte[signatureLength];
                await stream.ReadExactlyAsync(header);

                if (!header.SequenceEqual(AllowedMagicBytes[extension]))
                    throw new ArgumentException("Image file content does not match its type");
            }

            return await SaveAsync(image, subDir);
        }

        public Task<string?> SavePostImageAsync(IFormFile? image) =>
            SaveImageAsync(image, "posts");

        public Task<string?> SaveUserImageAsync(IFormFile? image) =>
            SaveImageAsync(image, "users");

        public Task<string?> SaveCommunityImageAsync(IFormFile? image) =>
            SaveImageAsync(image, "communities");

        public void DeletePostImage(string relative)
        {
            if (string.IsNullOrEmpty(relative))
                return;

            var absolute = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"),
                relative.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

            if (File.Exists(absolute))
                File.Delete(absolute);
        }

        private async Task<string> SaveAsync(IFormFile image, string subDir)
        {
            var webRoot = _env.WebRootPath
                ?? Path.Combine(_env.ContentRootPath, "wwwroot");

            var subPath = Path.Combine("uploads", subDir);
            var directory = Path.Combine(webRoot, subPath);

            Directory.CreateDirectory(directory);

            var fileName = $"{Guid.NewGuid():N}{Path.GetExtension(image.FileName).ToLowerInvariant()}";

            await using (var stream = new FileStream(
                Path.Combine(directory, fileName),
                FileMode.CreateNew))
            {
                await image.CopyToAsync(stream);
            }

            return $"/{subPath.Replace('\\', '/')}/{fileName}";
        }
    }
}
