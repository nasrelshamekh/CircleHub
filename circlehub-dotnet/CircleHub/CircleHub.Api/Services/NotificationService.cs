using CircleHub.Api.Data;
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
    /// Each call commits on its own and then nudges the recipient's live connections over the hub. That is
    /// deliberately <em>after</em> the action's own commit: the notification is a side effect, so a crash in
    /// between loses one row rather than leaving a notification pointing at something that never happened.
    /// A recipient with no live connection simply gets the row, and sees it on their next fetch.
    /// </para>
    /// </summary>
    public class NotificationService
    {
        private readonly AppDbContext _db;
        private readonly IHubContext<ChatHub> _hub;

        public NotificationService(AppDbContext db, IHubContext<ChatHub> hub)
        {
            _db = db;
            _hub = hub;
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

            foreach (var recipientId in recipients)
            {
                _db.Notifications.Add(new Notification
                {
                    Type = type,
                    CreatedAt = createdAt,
                    UserId = recipientId,
                    ActorId = actorId,
                    PostId = postId,
                    CommunityId = communityId
                });
            }

            await _db.SaveChangesAsync();

            foreach (var recipientId in recipients)
                await _hub.Clients.User(recipientId.ToString()).SendAsync(ChatHub.NotificationCreatedMethod);
        }
    }
}
