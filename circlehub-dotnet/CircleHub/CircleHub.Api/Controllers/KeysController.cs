using CircleHub.Api.Data;
using CircleHub.Api.Dtos;
using CircleHub.Api.Entities;
using CircleHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CircleHub.Api.Controllers
{
    /// <summary>
    /// Publishes and fetches the public half of each browser's encryption key. The server never sees a
    /// private key and cannot read a wrapped message; it is only the directory both sides look each other
    /// up in. Reading someone else's keys is gated by the same messaging policy as a message itself, so a
    /// user who cannot be messaged cannot have their key directory enumerated either.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class KeysController : ControllerBase
    {
        /// <summary>An uncompressed P-256 point is 0x04 || X || Y — 65 bytes, 88 base64 chars.</summary>
        private const int PublicKeyByteLength = 65;

        private readonly AppDbContext _db;
        private readonly MessagePolicyService _policy;

        public KeysController(AppDbContext db, MessagePolicyService policy)
        {
            _db = db;
            _policy = policy;
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

        /// <summary>Every device key a user has published, which is what a sender wraps a message for.</summary>
        [HttpGet("{username}")]
        public async Task<IActionResult> GetKeys(string username, CancellationToken cancellationToken)
        {
            var currentUserId = CurrentUserId!.Value;

            var recipient = await _db.Users
                .FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
            if (recipient is null)
                return Fail(StatusCodes.Status404NotFound, "User not found");

            // Own keys are always readable (they are this user's own directory); anyone else's follows the
            // messaging rule, with the same deliberately generic refusal the hub uses.
            if (recipient.Id != currentUserId &&
                !await _policy.CanMessageAsync(recipient, currentUserId, cancellationToken))
            {
                return Fail(StatusCodes.Status403Forbidden, "This user isn't accepting messages right now");
            }

            var keys = await _db.UserDeviceKeys
                .Where(k => k.UserId == recipient.Id)
                .OrderBy(k => k.CreatedAt)
                .Select(k => new DeviceKeyDto
                {
                    DeviceId = k.DeviceId,
                    PublicKey = k.PublicKey,
                    CreatedAt = k.CreatedAt
                })
                .ToListAsync(cancellationToken);

            return Ok(new ApiResponse<List<DeviceKeyDto>> { Data = keys, Count = keys.Count });
        }

        /// <summary>
        /// Registers (or replaces) the calling user's key for their current browser. Upsert on
        /// (user, device): a regenerated key replaces the old row rather than stacking duplicates, and
        /// another user cannot write to the directory at all because the user id comes from the JWT.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Register([FromBody] RegisterDeviceKeyRequest request, CancellationToken cancellationToken)
        {
            var currentUserId = CurrentUserId!.Value;

            if (string.IsNullOrWhiteSpace(request.DeviceId) || request.DeviceId.Length > 64)
                return Fail(StatusCodes.Status400BadRequest, "A device id of at most 64 characters is required");

            if (string.IsNullOrWhiteSpace(request.PublicKey) || request.PublicKey.Length > 200)
                return Fail(StatusCodes.Status400BadRequest, "A public key is required");

            byte[] raw;
            try
            {
                raw = Convert.FromBase64String(request.PublicKey);
            }
            catch (FormatException)
            {
                return Fail(StatusCodes.Status400BadRequest, "The public key must be base64");
            }

            if (raw.Length != PublicKeyByteLength || raw[0] != 0x04)
                return Fail(StatusCodes.Status400BadRequest, "The public key must be an uncompressed P-256 point");

            var now = DateTime.UtcNow;

            // One statement instead of read-then-write: two tabs publish at the same instant on first load
            // (React StrictMode alone makes one tab do it twice), and a find-then-insert pair lets both
            // discover "no row" and race to insert, where the unique index turns the loser into a 500.
            // `ON DUPLICATE KEY UPDATE` makes the second write an update and the request always succeeds.
            await _db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO UserDeviceKeys (Id, UserId, DeviceId, PublicKey, CreatedAt)
                VALUES ({Guid.NewGuid()}, {currentUserId}, {request.DeviceId}, {request.PublicKey}, {now})
                ON DUPLICATE KEY UPDATE PublicKey = VALUES(PublicKey), CreatedAt = VALUES(CreatedAt);
                """, cancellationToken);

            return Ok(new ApiResponse<DeviceKeyDto>
            {
                Data = new DeviceKeyDto
                {
                    DeviceId = request.DeviceId,
                    PublicKey = request.PublicKey,
                    CreatedAt = now
                }
            });
        }
    }
}
