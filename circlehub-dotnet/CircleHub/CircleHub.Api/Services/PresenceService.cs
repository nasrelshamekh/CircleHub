using CircleHub.Api.Data;
using CircleHub.Api.Dtos;
using CircleHub.Api.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CircleHub.Api.Services
{
    /// <summary>
    /// Answers "is this user around right now?" and tells the people who already talk to them when the
    /// answer changes.
    /// <para>
    /// Live connections are held by <see cref="IConnectionTracker"/>, which is process-local and dies
    /// with the process; <c>Users.LastSeenAt</c> is the durable half, so "last seen 12 minutes ago"
    /// survives a restart. Presence is only pushed to the other participants of the user's existing
    /// conversations — never to strangers, and never for a user you have never messaged.
    /// </para>
    /// </summary>
    public class PresenceService
    {
        private readonly AppDbContext _db;
        private readonly IConnectionTracker _connections;
        private readonly IHubContext<ChatHub> _hub;

        public PresenceService(
            AppDbContext db,
            IConnectionTracker connections,
            IHubContext<ChatHub> hub)
        {
            _db = db;
            _connections = connections;
            _hub = hub;
        }

        /// <summary>Whether the user has a live connection on this instance.</summary>
        public bool IsOnline(Guid userId) => _connections.IsOnline(userId);

        /// <summary>
        /// Called when a user gains their first connection: stamps <c>LastSeenAt</c> and pushes the
        /// "online" event to their conversation partners.
        /// </summary>
        public async Task UserCameOnlineAsync(Guid userId, CancellationToken cancellationToken)
        {
            // Stamped on connect as well as on disconnect: while they are online the value is never
            // shown, but it bounds how stale it can be if the process dies before OnDisconnectedAsync
            // has a chance to run.
            await MarkSeenAsync(userId, cancellationToken);

            await BroadcastAsync(userId, isOnline: true, lastSeenAt: null, cancellationToken);
        }

        /// <summary>
        /// Called when a user loses their last connection: stamps the time they were last around and
        /// pushes the "offline" event.
        /// </summary>
        public async Task UserWentOfflineAsync(Guid userId, CancellationToken cancellationToken)
        {
            var lastSeenAt = await MarkSeenAsync(userId, cancellationToken);

            await BroadcastAsync(userId, isOnline: false, lastSeenAt, cancellationToken);
        }

        private async Task<DateTime?> MarkSeenAsync(Guid userId, CancellationToken cancellationToken)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user is null)
                return null;

            user.LastSeenAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(cancellationToken);

            return user.LastSeenAt;
        }

        private async Task BroadcastAsync(
            Guid userId,
            bool isOnline,
            DateTime? lastSeenAt,
            CancellationToken cancellationToken)
        {
            var partnerIds = await GetConversationPartnerIdsAsync(userId, cancellationToken);

            if (partnerIds.Count == 0)
                return;

            await _hub.Clients
                .Users(partnerIds.Select(id => id.ToString()).ToList())
                .SendAsync(
                    ChatHub.PresenceChangedMethod,
                    new PresenceChangedEnvelope
                    {
                        UserId = userId.ToString(),
                        IsOnline = isOnline,
                        LastSeenAt = lastSeenAt
                    },
                    cancellationToken);
        }

        /// <summary>
        /// Everyone who shares a conversation with the user. This is the audience for their presence: a
        /// conversation is the only place the UI shows it, and the only place we have a reason to.
        /// </summary>
        private async Task<List<Guid>> GetConversationPartnerIdsAsync(
            Guid userId,
            CancellationToken cancellationToken)
        {
            return await _db.ConversationParticipants
                .Where(p => p.UserId == userId)
                .SelectMany(p => p.Conversation.Participants)
                .Where(p => p.UserId != userId)
                .Select(p => p.UserId)
                .Distinct()
                .ToListAsync(cancellationToken);
        }
    }
}
