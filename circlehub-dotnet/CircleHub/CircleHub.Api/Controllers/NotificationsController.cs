using CircleHub.Api.Data;
using CircleHub.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CircleHub.Api.Controllers
{
    /// <summary>
    /// The in-app notification feed: what other people did that concerns the caller — follows, likes and
    /// comments on their posts, and the community events they are on either side of.
    /// <para>
    /// Messages are deliberately absent: they already have their own list, badge, toast and sound, and
    /// counting them here would announce the same thing twice.
    /// </para>
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public NotificationsController(AppDbContext db)
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
            StatusCode(status, new ApiErrorResponse { Success = false, Message = message });

        [HttpGet]
        public async Task<IActionResult> GetNotifications(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var userId = CurrentUserId!.Value;

            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            // Unread is derived, so the cursor is read once and used both for the badge count and for the
            // per-row flag: the two can then never disagree inside one response.
            var seenAt = await _db.Users
                .Where(u => u.Id == userId)
                .Select(u => u.NotificationsSeenAt)
                .FirstAsync() ?? DateTime.UnixEpoch;

            var query = _db.Notifications.Where(n => n.UserId == userId);

            var total = await query.CountAsync();
            var unreadCount = await query.CountAsync(n => n.CreatedAt > seenAt);

            var items = await query
                .OrderByDescending(n => n.CreatedAt)
                .ThenByDescending(n => n.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    Type = n.Type.ToString(),
                    CreatedAt = n.CreatedAt,
                    Unread = n.CreatedAt > seenAt,
                    Actor = new AuthorDto
                    {
                        Id = n.Actor.Id,
                        Name = n.Actor.Name,
                        Username = n.Actor.Username,
                        AvatarUrl = n.Actor.AvatarUrl
                    },
                    PostId = n.PostId,
                    CommunityName = n.Community != null ? n.Community.Name : null,
                    CommunitySlug = n.Community != null ? n.Community.Slug : null
                })
                .ToListAsync();

            var totalPages = Math.Max(1, (int)Math.Ceiling(total / (double)pageSize));

            return Ok(new ApiResponse<NotificationFeedDto>
            {
                Count = items.Count,
                Data = new NotificationFeedDto
                {
                    UnreadCount = unreadCount,
                    Items = items
                },
                Meta = new PageMeta
                {
                    Page = page,
                    PageSize = pageSize,
                    Total = total,
                    TotalPages = totalPages,
                    HasNext = page < totalPages
                }
            });
        }

        /// <summary>
        /// Stamps the feed as seen. It moves a single timestamp rather than flipping a flag per row, so it is
        /// idempotent and cannot leave a row half-read.
        /// </summary>
        [HttpPost("seen")]
        public async Task<IActionResult> MarkSeen()
        {
            var userId = CurrentUserId!.Value;

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user is null)
                return Fail(StatusCodes.Status404NotFound, "User not found");

            user.NotificationsSeenAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new ApiResponse<object> { Message = "Notifications marked as seen" });
        }
    }
}
