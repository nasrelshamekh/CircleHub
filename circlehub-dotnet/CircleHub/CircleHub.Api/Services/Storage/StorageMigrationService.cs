using CircleHub.Api.Data;
using CircleHub.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SkiaSharp;

#pragma warning disable CS0618

namespace CircleHub.Api.Services.Storage
{
    public class StorageMigrationResult
    {
        public bool Success { get; set; }
        public int MigratedUsers { get; set; }
        public int MigratedPosts { get; set; }
        public List<string> SeededPlaceholders { get; set; } = new();
        public List<string> Messages { get; set; } = new();
    }

    public class StorageMigrationService
    {
        private readonly AppDbContext _db;
        private readonly IObjectStorage _storage;
        private readonly IWebHostEnvironment _env;
        private readonly IOptions<R2Options> _options;
        private readonly ILogger<StorageMigrationService> _logger;

        public StorageMigrationService(
            AppDbContext db,
            IObjectStorage storage,
            IWebHostEnvironment env,
            IOptions<R2Options> options,
            ILogger<StorageMigrationService> logger)
        {
            _db = db;
            _storage = storage;
            _env = env;
            _options = options;
            _logger = logger;
        }

        public async Task<StorageMigrationResult> RunMigrationAsync(CancellationToken cancellationToken = default)
        {
            var result = new StorageMigrationResult();

            try
            {
                // 1. Ensure placeholder PNGs exist on disk
                EnsurePlaceholderPngs();

                // 2. If R2 storage is configured, upload defaults/placeholders to R2
                if (_storage.IsConfigured)
                {
                    await SeedPlaceholdersToR2Async(result, cancellationToken);
                    await MigrateLegacyUploadsAsync(result, cancellationToken);
                }
                else
                {
                    result.Messages.Add("R2 storage is not configured; skipped R2 upload & migration.");
                }

                result.Success = true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Storage migration encountered an error");
                result.Success = false;
                result.Messages.Add($"Error: {ex.Message}");
            }

            return result;
        }

        public void EnsurePlaceholderPngs()
        {
            var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var defaultsDir = Path.Combine(webRoot, "defaults");
            Directory.CreateDirectory(defaultsDir);

            var avatarPngPath = Path.Combine(defaultsDir, "avatar-placeholder.png");
            if (!File.Exists(avatarPngPath))
            {
                var bytes = GenerateAvatarPlaceholderPng();
                File.WriteAllBytes(avatarPngPath, bytes);
                _logger.LogInformation("Generated avatar-placeholder.png at {Path}", avatarPngPath);
            }

            var coverPngPath = Path.Combine(defaultsDir, "cover-placeholder.png");
            if (!File.Exists(coverPngPath))
            {
                var bytes = GenerateCoverPlaceholderPng();
                File.WriteAllBytes(coverPngPath, bytes);
                _logger.LogInformation("Generated cover-placeholder.png at {Path}", coverPngPath);
            }
        }

        private async Task SeedPlaceholdersToR2Async(StorageMigrationResult result, CancellationToken cancellationToken)
        {
            var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var defaultsDir = Path.Combine(webRoot, "defaults");
            if (!Directory.Exists(defaultsDir))
                return;

            var files = Directory.GetFiles(defaultsDir);
            foreach (var file in files)
            {
                var fileName = Path.GetFileName(file);
                var key = $"defaults/{fileName}";
                var extension = Path.GetExtension(file).ToLowerInvariant();
                var contentType = extension switch
                {
                    ".png" => "image/png",
                    ".jpg" or ".jpeg" => "image/jpeg",
                    ".webp" => "image/webp",
                    ".svg" => "image/svg+xml",
                    _ => "application/octet-stream"
                };

                try
                {
                    await using var fileStream = File.OpenRead(file);
                    var publicUrl = await _storage.UploadPublicAsync(key, fileStream, contentType, cancellationToken);
                    result.SeededPlaceholders.Add(publicUrl);
                    _logger.LogInformation("Seeded placeholder to R2: {Key} -> {Url}", key, publicUrl);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed seeding placeholder {Key} to R2", key);
                    result.Messages.Add($"Warning: Failed seeding {key}: {ex.Message}");
                }
            }
        }

        private async Task MigrateLegacyUploadsAsync(StorageMigrationResult result, CancellationToken cancellationToken)
        {
            var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");

            // Migrate Users (such as Nasr Elshamekh) whose avatar or cover image is in /uploads/...
            var usersToMigrate = await _db.Users
                .Where(u => (u.AvatarUrl != null && u.AvatarUrl.StartsWith("/uploads/")) ||
                            (u.CoverImageUrl != null && u.CoverImageUrl.StartsWith("/uploads/")))
                .ToListAsync(cancellationToken);

            foreach (var user in usersToMigrate)
            {
                bool userUpdated = false;

                if (user.AvatarUrl != null && user.AvatarUrl.StartsWith("/uploads/"))
                {
                    var relative = user.AvatarUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                    var localPath = Path.Combine(webRoot, relative);
                    if (File.Exists(localPath))
                    {
                        var ext = Path.GetExtension(localPath).ToLowerInvariant().TrimStart('.');
                        if (string.IsNullOrEmpty(ext)) ext = "webp";
                        var key = $"avatars/{user.Username}-{Guid.NewGuid():N}.{ext}";
                        var contentType = ext == "png" ? "image/png" : ext == "webp" ? "image/webp" : "image/jpeg";

                        await using var stream = File.OpenRead(localPath);
                        var newUrl = await _storage.UploadPublicAsync(key, stream, contentType, cancellationToken);
                        user.AvatarUrl = newUrl;
                        userUpdated = true;
                        _logger.LogInformation("Migrated avatar for user {Username}: {Old} -> {New}", user.Username, localPath, newUrl);
                    }
                }

                if (user.CoverImageUrl != null && user.CoverImageUrl.StartsWith("/uploads/"))
                {
                    var relative = user.CoverImageUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                    var localPath = Path.Combine(webRoot, relative);
                    if (File.Exists(localPath))
                    {
                        var ext = Path.GetExtension(localPath).ToLowerInvariant().TrimStart('.');
                        if (string.IsNullOrEmpty(ext)) ext = "webp";
                        var key = $"covers/{user.Username}-{Guid.NewGuid():N}.{ext}";
                        var contentType = ext == "png" ? "image/png" : ext == "webp" ? "image/webp" : "image/jpeg";

                        await using var stream = File.OpenRead(localPath);
                        var newUrl = await _storage.UploadPublicAsync(key, stream, contentType, cancellationToken);
                        user.CoverImageUrl = newUrl;
                        userUpdated = true;
                        _logger.LogInformation("Migrated cover for user {Username}: {Old} -> {New}", user.Username, localPath, newUrl);
                    }
                }

                if (userUpdated)
                {
                    result.MigratedUsers++;
                }
            }

            // Migrate Posts with legacy /uploads/
            var postsToMigrate = await _db.Posts
                .Where(p => p.ImageUrl != null && p.ImageUrl.StartsWith("/uploads/"))
                .ToListAsync(cancellationToken);

            foreach (var post in postsToMigrate)
            {
                var relative = post.ImageUrl!.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                var localPath = Path.Combine(webRoot, relative);
                if (File.Exists(localPath))
                {
                    var ext = Path.GetExtension(localPath).ToLowerInvariant().TrimStart('.');
                    if (string.IsNullOrEmpty(ext)) ext = "webp";
                    var key = $"posts/{Guid.NewGuid():N}.{ext}";
                    var contentType = ext == "png" ? "image/png" : ext == "webp" ? "image/webp" : "image/jpeg";

                    await using var stream = File.OpenRead(localPath);
                    var newUrl = await _storage.UploadPublicAsync(key, stream, contentType, cancellationToken);
                    post.ImageUrl = newUrl;
                    result.MigratedPosts++;
                    _logger.LogInformation("Migrated post image for post {PostId}: {Old} -> {New}", post.Id, localPath, newUrl);
                }
            }

            if (result.MigratedUsers > 0 || result.MigratedPosts > 0)
            {
                await _db.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Database updated with {Users} migrated users and {Posts} migrated posts.", result.MigratedUsers, result.MigratedPosts);
            }
        }

        private static byte[] GenerateAvatarPlaceholderPng()
        {
            using var surface = SKSurface.Create(new SKImageInfo(512, 512, SKColorType.Rgba8888, SKAlphaType.Premul));
            var canvas = surface.Canvas;
            canvas.Clear(SKColor.Parse("#e2e7ff"));

            using var headPaint = new SKPaint
            {
                Color = SKColor.Parse("#6366f1"),
                IsAntialias = true,
                Style = SKPaintStyle.Fill
            };
            canvas.DrawCircle(256f, 196f, 90f, headPaint);

            using var bodyPaint = new SKPaint
            {
                Color = SKColor.Parse("#8b5cf6"),
                IsAntialias = true,
                Style = SKPaintStyle.Fill
            };

            using var bodyPath = new SKPath();
            const float scale = 512f / 240f;
            bodyPath.MoveTo(48f * scale, 214f * scale);
            bodyPath.CubicTo(
                (48f + 8f) * scale, (214f - 44f) * scale,
                (48f + 36f) * scale, (214f - 70f) * scale,
                (48f + 72f) * scale, (214f - 70f) * scale);
            bodyPath.CubicTo(
                (120f + 36f) * scale, 144f * scale,
                (120f + 64f) * scale, (144f + 26f) * scale,
                (120f + 72f) * scale, (144f + 70f) * scale);
            bodyPath.LineTo(512f, 512f);
            bodyPath.LineTo(0f, 512f);
            bodyPath.Close();

            canvas.DrawPath(bodyPath, bodyPaint);
            canvas.Flush();

            using var image = surface.Snapshot();
            using var data = image.Encode(SKEncodedImageFormat.Png, 100);
            return data.ToArray();
        }

        private static byte[] GenerateCoverPlaceholderPng()
        {
            using var surface = SKSurface.Create(new SKImageInfo(1200, 420, SKColorType.Rgba8888, SKAlphaType.Premul));
            var canvas = surface.Canvas;

            using var bgPaint = new SKPaint
            {
                IsAntialias = true,
                Shader = SKShader.CreateLinearGradient(
                    new SKPoint(0, 0),
                    new SKPoint(1200, 420),
                    new[] { SKColor.Parse("#6366f1"), SKColor.Parse("#8b5cf6"), SKColor.Parse("#006577") },
                    new[] { 0f, 0.55f, 1f },
                    SKShaderTileMode.Clamp)
            };
            canvas.DrawRect(0, 0, 1200, 420, bgPaint);

            using var whitePaint16 = new SKPaint
            {
                Color = new SKColor(255, 255, 255, (byte)(255 * 0.16f)),
                IsAntialias = true,
                Style = SKPaintStyle.Fill
            };
            canvas.DrawCircle(1020, 70, 150, whitePaint16);

            using var whitePaint12 = new SKPaint
            {
                Color = new SKColor(255, 255, 255, (byte)(255 * 0.12f)),
                IsAntialias = true,
                Style = SKPaintStyle.Fill
            };
            canvas.DrawCircle(170, 350, 190, whitePaint12);

            using var wavePaint = new SKPaint
            {
                Color = new SKColor(255, 255, 255, (byte)(255 * 0.18f)),
                IsAntialias = true,
                Style = SKPaintStyle.Fill
            };
            using var wavePath = new SKPath();
            wavePath.MoveTo(0, 310);
            wavePath.CubicTo(160, 266, 314, 272, 462, 328);
            wavePath.CubicTo(610, 384, 764, 394, 932, 330);
            wavePath.CubicTo(1100, 266, 1192, 272, 1200, 276);
            wavePath.LineTo(1200, 420);
            wavePath.LineTo(0, 420);
            wavePath.Close();

            canvas.DrawPath(wavePath, wavePaint);
            canvas.Flush();

            using var image = surface.Snapshot();
            using var data = image.Encode(SKEncodedImageFormat.Png, 100);
            return data.ToArray();
        }
    }
}
