using CircleHub.Api.Data;
using CircleHub.Api.Dtos;
using CircleHub.Api.Entities;
using CircleHub.Api.Enums;
using CircleHub.Api.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CircleHub.Api.Services
{
    /// <summary>
    /// The single writer for the notification feed, so "never notify yourself" and the de-duplication of
    /// repeatable actions live in one place instead of at every call site.
    /// <para>
    /// Each call commits on its own and then nudges the recipient's live connections over the hub, falling
    /// back to the Expo Push Service when the recipient has no live connection. That is deliberately
    /// <em>after</em> the action's own commit: the notification is a side effect, so a crash in between loses
    /// one row rather than leaving a notification pointing at something that never happened.
    /// </para>
    /// </summary>
    public class NotificationService
    {
        private const string FallbackCommunity = "a community";

        private readonly AppDbContext _db;
        private readonly IHubContext<ChatHub> _hub;
        private readonly IConnectionTracker _connections;
        private readonly ExpoPushService _push;
        private readonly IConfiguration _config;

        public NotificationService(
            AppDbContext db,
            IHubContext<ChatHub> hub,
            IConnectionTracker connections,
            ExpoPushService push,
            IConfiguration config)
        {
            _db = db;
            _hub = hub;
            _connections = connections;
            _push = push;
            _config = config;
        }

        public Task NotifyFollowAsync(Guid actorId, Guid recipientId) =>
            NotifyAsync(actorId, new[] { recipientId }, NotificationType.Follow, dedupe: true);

        public Task NotifyPostLikeAsync(Guid actorId, Guid recipientId, Guid postId) =>
            NotifyAsync(actorId, new[] { recipientId }, NotificationType.PostLike, postId: postId, dedupe: true);

        public Task NotifyPostCommentAsync(Guid actorId, Guid recipientId, Guid postId) =>
            NotifyAsync(actorId, new[] { recipientId }, NotificationType.PostComment, postId: postId);

        /// <summary>
        /// Tells everyone who can review join requests — the administrator and the moderators — that someone
        /// asked to join. De-duplicated, because a declined request can be re-sent and should not ring the
        /// bell a second time.
        /// </summary>
        public async Task NotifyCommunityJoinRequestedAsync(Guid actorId, Guid communityId)
        {
            var reviewers = await _db.CommunityMembers
                .Where(m => m.CommunityId == communityId && m.Role != CommunityRole.Member)
                .Select(m => m.UserId)
                .ToListAsync();

            await NotifyAsync(actorId, reviewers, NotificationType.CommunityJoinRequested,
                communityId: communityId, dedupe: true);
        }

        public Task NotifyJoinRequestDecidedAsync(Guid actorId, Guid recipientId, Guid communityId, bool approved) =>
            NotifyAsync(actorId, new[] { recipientId },
                approved ? NotificationType.CommunityJoinRequestApproved : NotificationType.CommunityJoinRequestRejected,
                communityId: communityId);

        public Task NotifyCommunityMemberRemovedAsync(Guid actorId, Guid recipientId, Guid communityId) =>
            NotifyAsync(actorId, new[] { recipientId }, NotificationType.CommunityMemberRemoved,
                communityId: communityId);

        public Task NotifyCommunityRoleChangedAsync(Guid actorId, Guid recipientId, Guid communityId) =>
            NotifyAsync(actorId, new[] { recipientId }, NotificationType.CommunityRoleChanged,
                communityId: communityId);

        /// <summary>
        /// Tells an author that a moderator removed their post. Carries no <c>PostId</c> on purpose: the post
        /// is deleted moments later, and the foreign key would cascade the notification away with it.
        /// </summary>
        public Task NotifyCommunityPostRemovedAsync(Guid actorId, Guid recipientId, Guid communityId) =>
            NotifyAsync(actorId, new[] { recipientId }, NotificationType.CommunityPostRemoved,
                communityId: communityId);

        private async Task NotifyAsync(
            Guid actorId,
            IEnumerable<Guid> recipientIds,
            NotificationType type,
            Guid? postId = null,
            Guid? communityId = null,
            bool dedupe = false)
        {
            var recipients = recipientIds.Where(id => id != actorId).Distinct().ToList();

            if (dedupe && recipients.Count > 0)
            {
                // The like endpoint is a toggle and a follow can be re-made after an unfollow, so the same
                // actor can arrive twice for the same subject. Only the first one is worth a row.
                var alreadyNotified = await _db.Notifications
                    .Where(n =>
                        recipients.Contains(n.UserId) &&
                        n.ActorId == actorId &&
                        n.Type == type &&
                        n.PostId == postId &&
                        n.CommunityId == communityId)
                    .Select(n => n.UserId)
                    .ToListAsync();

                recipients = recipients.Except(alreadyNotified).ToList();
            }

            if (recipients.Count == 0)
                return;

            var createdAt = DateTime.UtcNow;
            var created = new List<(Notification Row, Guid RecipientId)>();

            foreach (var recipientId in recipients)
            {
                var row = new Notification
                {
                    Type = type,
                    CreatedAt = createdAt,
                    UserId = recipientId,
                    ActorId = actorId,
                    PostId = postId,
                    CommunityId = communityId
                };

                _db.Notifications.Add(row);
                created.Add((row, recipientId));
            }

            await _db.SaveChangesAsync();

            // The event carries the row itself so the client can raise a toast immediately, without waiting
            // for the invalidation refetch that also follows. Projected through EF for exactly the fields the
            // GET builds into a NotificationDto (Actor + Community joins included); `Unread` is true because
            // the row was created after the reader's last stamp. Everything else about the DTO must stay in
            // step with `NotificationsController.GetNotifications`.
            var ids = created.Select(c => c.Row.Id).ToList();

            var dtos = await _db.Notifications
                .Where(n => ids.Contains(n.Id))
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    Type = n.Type.ToString(),
                    CreatedAt = n.CreatedAt,
                    Unread = true,
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
                .ToDictionaryAsync(n => n.Id);

            foreach (var (row, recipientId) in created)
            {
                if (!dtos.TryGetValue(row.Id, out var dto))
                    continue;

                // Deliberately not tied to the caller's token (the default): the row is committed, so a
                // caller hanging up mid-flight must not swallow the nudge — same rule as the message fan-out.
                await _hub.Clients.User(recipientId.ToString())
                    .SendAsync(ChatHub.NotificationCreatedMethod, dto);

                string? resolvedActorAvatar = null;
                if (!string.IsNullOrWhiteSpace(dto.Actor.AvatarUrl))
                {
                    if (dto.Actor.AvatarUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                        dto.Actor.AvatarUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                    {
                        resolvedActorAvatar = dto.Actor.AvatarUrl;
                    }
                    else
                    {
                        var baseUrl = _config["App:BaseUrl"] ?? "https://circlehub.runasp.net";
                        resolvedActorAvatar = $"{baseUrl.TrimEnd('/')}/{dto.Actor.AvatarUrl.TrimStart('/')}";
                    }
                }

                var notificationTag = $"notif_{dto.Id}";

                // Send push notification to any registered mobile devices
                await _push.SendToUserAsync(
                    recipientId,
                    dto.Actor.Name,
                    $"{dto.Actor.Name} {BuildSentence(type, dto.CommunityName)}",
                    new
                    {
                        type = "notification",
                        notificationId = dto.Id.ToString(),
                        notificationType = dto.Type,
                        postId = dto.PostId?.ToString(),
                        communitySlug = dto.CommunitySlug,
                        actorUsername = dto.Actor.Username,
                        senderName = dto.Actor.Name,
                        senderAvatarUrl = resolvedActorAvatar,
                        tag = notificationTag
                    },
                    channelId: "default",
                    tag: notificationTag,
                    imageUrl: null);
            }
        }

        private static string BuildSentence(NotificationType type, string? communityName)
        {
            var community = string.IsNullOrWhiteSpace(communityName) ? FallbackCommunity : communityName;
            return type switch
            {
                NotificationType.Follow => "started following you.",
                NotificationType.PostLike => "liked your post.",
                NotificationType.PostComment => "commented on your post.",
                NotificationType.CommunityJoinRequested => $"asked to join {community}.",
                NotificationType.CommunityJoinRequestApproved => $"approved your request to join {community}.",
                NotificationType.CommunityJoinRequestRejected => $"declined your request to join {community}.",
                NotificationType.CommunityMemberRemoved => $"removed you from {community}.",
                NotificationType.CommunityRoleChanged => $"changed your role in {community}.",
                NotificationType.CommunityPostRemoved => $"removed your post in {community}.",
                _ => "sent you a notification."
            };
        }
    }
}
