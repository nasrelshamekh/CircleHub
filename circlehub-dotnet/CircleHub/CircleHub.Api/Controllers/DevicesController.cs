using CircleHub.Api.Data;
using CircleHub.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CircleHub.Api.Controllers
{
    /// <summary>
    /// Registers and removes Expo push tokens (<c>ExponentPushToken[…]</c> / <c>ExpoPushToken[…]</c>) for the
    /// signed-in user's mobile devices.
    /// <para>
    /// Every route is scoped to the authenticated user's <c>sub</c> claim. Registration is a single-statement
    /// upsert on the unique <c>Token</c> index: if a second account signs in on the same physical phone before
    /// the previous session could unregister, the token is rebound to the new user in place so notifications
    /// never leak to the old account.
    /// </para>
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DevicesController : ControllerBase
    {
        private const int MaxTokenLength = 255;

        private static readonly HashSet<string> AllowedPlatforms = new(StringComparer.OrdinalIgnoreCase)
        {
            "ios",
            "android",
            "unknown"
        };

        private readonly AppDbContext _db;

        public DevicesController(AppDbContext db)
        {
            _db = db;
        }

        private Guid? CurrentUserId
        {
            get
            {
                var sub = User.FindFirstValue("sub");
                return Guid.TryParse(sub, out var id) ? id : null;
            }
        }

        private IActionResult Fail(int status, string message) =>
            new ObjectResult(new ApiErrorResponse { Success = false, Message = message })
            {
                StatusCode = status
            };

        public static bool IsExpoPushToken(string? value)
        {
            if (string.IsNullOrWhiteSpace(value) || value.Length > MaxTokenLength)
                return false;

            ReadOnlySpan<char> span = value.AsSpan().Trim();
            if (!span.EndsWith("]", StringComparison.Ordinal))
                return false;

            ReadOnlySpan<char> inner;
            if (span.StartsWith("ExponentPushToken[", StringComparison.Ordinal))
                inner = span["ExponentPushToken[".Length..^1];
            else if (span.StartsWith("ExpoPushToken[", StringComparison.Ordinal))
                inner = span["ExpoPushToken[".Length..^1];
            else
                return false;

            return inner.Length > 0 && !inner.Contains('[') && !inner.Contains(']');
        }

        /// <summary>
        /// Registers (or refreshes) the calling user's Expo push token for their current mobile device.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Register([FromBody] RegisterDeviceTokenRequest request, CancellationToken cancellationToken)
        {
            var currentUserId = CurrentUserId!.Value;
            var token = request.Token?.Trim() ?? string.Empty;

            if (!IsExpoPushToken(token))
                return Fail(StatusCodes.Status400BadRequest, "A valid Expo push token (ExponentPushToken[...]) is required");

            var platform = string.IsNullOrWhiteSpace(request.Platform)
                ? "unknown"
                : request.Platform.Trim().ToLowerInvariant();

            if (!AllowedPlatforms.Contains(platform))
                return Fail(StatusCodes.Status400BadRequest, "Platform must be 'ios', 'android', or 'unknown'");

            var now = DateTime.UtcNow;

            await _db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO DeviceTokens (Id, UserId, Token, Platform, CreatedAt, UpdatedAt)
                VALUES ({Guid.NewGuid()}, {currentUserId}, {token}, {platform}, {now}, {now})
                ON DUPLICATE KEY UPDATE
                    UserId = VALUES(UserId),
                    Platform = VALUES(Platform),
                    UpdatedAt = VALUES(UpdatedAt);
                """, cancellationToken);

            return Ok(new ApiResponse<DeviceTokenDto>
            {
                Data = new DeviceTokenDto
                {
                    Token = token,
                    Platform = platform,
                    UpdatedAt = now
                }
            });
        }

        /// <summary>
        /// Unregisters a device token on sign-out via route parameter (<c>DELETE /api/devices/{token}</c>).
        /// </summary>
        [HttpDelete("{token}")]
        public Task<IActionResult> UnregisterByRoute(string token, CancellationToken cancellationToken) =>
            UnregisterCoreAsync(token, cancellationToken);

        /// <summary>
        /// Unregisters a device token on sign-out via query parameter (<c>DELETE /api/devices?token=…</c>) or
        /// JSON body (<c>{ "token": "…" }</c>), avoiding URL-encoding issues with brackets in Expo tokens.
        /// </summary>
        [HttpDelete]
        public Task<IActionResult> Unregister(
            [FromQuery] string? token,
            [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] UnregisterDeviceTokenRequest? body,
            CancellationToken cancellationToken)
        {
            var target = !string.IsNullOrWhiteSpace(token) ? token : body?.Token;
            return UnregisterCoreAsync(target, cancellationToken);
        }

        private async Task<IActionResult> UnregisterCoreAsync(string? rawToken, CancellationToken cancellationToken)
        {
            var currentUserId = CurrentUserId!.Value;
            var token = rawToken?.Trim() ?? string.Empty;

            if (string.IsNullOrEmpty(token))
                return Fail(StatusCodes.Status400BadRequest, "A device token is required");

            // Owner-scoped: a caller can only remove a token currently bound to their own account.
            // Idempotent when already pruned or never registered, so sign-out never fails on a missing row.
            await _db.DeviceTokens
                .Where(d => d.UserId == currentUserId && d.Token == token)
                .ExecuteDeleteAsync(cancellationToken);

            return Ok(new ApiResponse<string> { Message = "Device token removed" });
        }
    }
}
