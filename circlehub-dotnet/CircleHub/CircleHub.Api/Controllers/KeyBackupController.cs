using CircleHub.Api.Data;
using CircleHub.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CircleHub.Api.Controllers
{
    /// <summary>
    /// Stores and returns the calling user's own key backup — the account recovery key wrapped under a key
    /// derived from their recovery phrase. The server cannot open the blob (it never sees the phrase), so
    /// this is a sync point, not an escrow service: losing the phrase still means losing the history.
    ///
    /// Every route is owner-scoped with the user id taken from the JWT. There is deliberately **no**
    /// "by username" lookup: a backup is only ever the caller's own, so this endpoint cannot be used to
    /// fetch someone else's recovery material. A caller with no backup gets a 404, which is also the signal
    /// a client uses to decide between "offer recovery setup" and "offer recovery entry".
    /// </summary>
    [ApiController]
    [Route("api/keys/backup")]
    [Authorize]
    public class KeyBackupController : ControllerBase
    {
        /// <summary>IV (12) + AES-GCM overhead (16) + a 32-byte key round to 60 bytes; 200 base64 chars is generous.</summary>
        private const int MaxWrappedLength = 200;
        private const int MaxSaltLength = 100;

        private readonly AppDbContext _db;

        public KeyBackupController(AppDbContext db)
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

        /// <summary>The caller's own backup, or 404 when they have never set one up.</summary>
        [HttpGet]
        public async Task<IActionResult> Get(CancellationToken cancellationToken)
        {
            var currentUserId = CurrentUserId!.Value;

            var backup = await _db.UserKeyBackups
                .FirstOrDefaultAsync(b => b.UserId == currentUserId, cancellationToken);

            if (backup is null)
                return Fail(StatusCodes.Status404NotFound, "No key backup has been saved for this account");

            return Ok(new ApiResponse<KeyBackupDto>
            {
                Data = new KeyBackupDto
                {
                    WrappedAccountKey = backup.WrappedAccountKey,
                    Salt = backup.Salt,
                    KdfIterations = backup.KdfIterations,
                    KdfAlgorithm = backup.KdfAlgorithm,
                    UpdatedAt = backup.UpdatedAt
                }
            });
        }

        /// <summary>
        /// Saves (or replaces) the caller's backup. Upsert on the unique user index: setting recovery up
        /// again with a new phrase must replace the old blob, not stack a second one, or the phrase the user
        /// just wrote down would sit next to a stale one and restore would be a coin flip.
        /// </summary>
        [HttpPut]
        public async Task<IActionResult> Save([FromBody] SaveKeyBackupRequest request, CancellationToken cancellationToken)
        {
            var currentUserId = CurrentUserId!.Value;

            // Shape and size only. The server cannot verify the contents — that would require the phrase —
            // and a plausible-looking blob from a buggy client is indistinguishable from a good one here.
            // The checks exist to keep the column bounded and to reject obvious garbage early.
            if (string.IsNullOrWhiteSpace(request.WrappedAccountKey) || request.WrappedAccountKey.Length > MaxWrappedLength)
                return Fail(StatusCodes.Status400BadRequest, "A wrapped account key of at most 200 characters is required");

            if (string.IsNullOrWhiteSpace(request.Salt) || request.Salt.Length > MaxSaltLength)
                return Fail(StatusCodes.Status400BadRequest, "A salt of at most 100 characters is required");

            // A floor, not a ceiling: a client that sends a tiny iteration count would be storing material
            // that is cheap to brute force, and the cost is paid on the client, not here.
            if (request.KdfIterations < 100_000)
                return Fail(StatusCodes.Status400BadRequest, "The key derivation iteration count is too low");

            if (string.IsNullOrWhiteSpace(request.KdfAlgorithm) || request.KdfAlgorithm.Length > 40)
                return Fail(StatusCodes.Status400BadRequest, "A key derivation algorithm is required");

            try
            {
                Convert.FromBase64String(request.WrappedAccountKey);
                Convert.FromBase64String(request.Salt);
            }
            catch (FormatException)
            {
                return Fail(StatusCodes.Status400BadRequest, "The wrapped account key and salt must be base64");
            }

            var now = DateTime.UtcNow;

            // Same one-statement upsert as the device directory: two tabs finishing setup at the same
            // instant must not turn into a duplicate-key 500 on the unique user index.
            await _db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO UserKeyBackups (Id, UserId, WrappedAccountKey, Salt, KdfIterations, KdfAlgorithm, CreatedAt, UpdatedAt)
                VALUES ({Guid.NewGuid()}, {currentUserId}, {request.WrappedAccountKey}, {request.Salt}, {request.KdfIterations}, {request.KdfAlgorithm}, {now}, {now})
                ON DUPLICATE KEY UPDATE
                    WrappedAccountKey = VALUES(WrappedAccountKey),
                    Salt = VALUES(Salt),
                    KdfIterations = VALUES(KdfIterations),
                    KdfAlgorithm = VALUES(KdfAlgorithm),
                    UpdatedAt = VALUES(UpdatedAt);
                """, cancellationToken);

            return Ok(new ApiResponse<KeyBackupDto>
            {
                Data = new KeyBackupDto
                {
                    WrappedAccountKey = request.WrappedAccountKey,
                    Salt = request.Salt,
                    KdfIterations = request.KdfIterations,
                    KdfAlgorithm = request.KdfAlgorithm,
                    UpdatedAt = now
                }
            });
        }

        /// <summary>
        /// Deletes the caller's backup. The device keys are untouched — this only stops a new device from
        /// restoring, and it is the honest way to offer "turn recovery off" without pretending the history
        /// becomes any less recoverable than it already is.
        /// </summary>
        [HttpDelete]
        public async Task<IActionResult> Delete(CancellationToken cancellationToken)
        {
            var currentUserId = CurrentUserId!.Value;

            var backup = await _db.UserKeyBackups
                .FirstOrDefaultAsync(b => b.UserId == currentUserId, cancellationToken);

            if (backup is null)
                return Fail(StatusCodes.Status404NotFound, "No key backup has been saved for this account");

            _db.UserKeyBackups.Remove(backup);
            await _db.SaveChangesAsync(cancellationToken);

            return Ok(new ApiResponse<string> { Message = "Key backup removed" });
        }
    }
}
