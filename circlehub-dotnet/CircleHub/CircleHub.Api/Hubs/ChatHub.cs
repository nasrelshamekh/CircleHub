using CircleHub.Api.Data;
using CircleHub.Api.Dtos;
using CircleHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CircleHub.Api.Hubs
{
    /// <summary>
    /// Real-time delivery channel for end-to-end encrypted messages.
    /// <para>
    /// The server is a dumb pipe here: it receives an opaque encrypted payload and routes it to
    /// the recipient's connections with <see cref="IHubClients.User(string)"/>. It never has the
    /// keys, so it can never read a message.
    /// </para>
    /// </summary>
    [Authorize]
    public class ChatHub : Hub
    {
        /// <summary>Client-side handler invoked on the recipient for each relayed envelope.</summary>
        public const string ReceiveMessageMethod = "ReceiveEncryptedMessage";

        /// <summary>
        /// Client-side handler for presence changes of the people we already have conversations with.
        /// </summary>
        public const string PresenceChangedMethod = "PresenceChanged";

        /// <summary>
        /// Client-side handler for "the person on the other end is typing to you" (and for them stopping).
        /// </summary>
        public const string TypingChangedMethod = "TypingChanged";

        /// <summary>
        /// Client-side handler telling a user that a new row landed in their notification feed. Carries no
        /// payload: the feed is the source of truth and the client simply refetches it.
        /// </summary>
        public const string NotificationCreatedMethod = "NotificationCreated";

        /// <summary>
        /// Cap on the encrypted payload. SignalR already rejects hub messages above
        /// <c>MaximumReceiveMessageSize</c> (32 KB by default); this keeps the application
        /// limit well below that so a single message can never crowd out the transport buffer.
        /// </summary>
        private const int MaxPayloadLength = 16 * 1024;

        private readonly AppDbContext _db;
        private readonly MessagePolicyService _policy;
        private readonly IConnectionTracker _connections;
        private readonly PresenceService _presence;
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(
            AppDbContext db,
            MessagePolicyService policy,
            IConnectionTracker connections,
            PresenceService presence,
            ILogger<ChatHub> logger)
        {
            _db = db;
            _policy = policy;
            _connections = connections;
            _presence = presence;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            if (Guid.TryParse(Context.UserIdentifier, out var userId))
            {
                _connections.Add(userId, Context.ConnectionId);

                var firstConnection = _connections.ConnectionCount(userId) == 1;

                _logger.LogInformation(
                    "Encrypted channel opened for user {UserId} on connection {ConnectionId} ({LiveConnections} live connection(s), {OnlineUsers} user(s) online)",
                    userId,
                    Context.ConnectionId,
                    _connections.ConnectionCount(userId),
                    _connections.OnlineUserCount);

                // Only a transition counts: a second tab belongs to a user who is already shown online.
                if (firstConnection)
                    await _presence.UserCameOnlineAsync(userId, Context.ConnectionAborted);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (Guid.TryParse(Context.UserIdentifier, out var userId))
            {
                _connections.Remove(userId, Context.ConnectionId);

                var lastConnection = _connections.ConnectionCount(userId) == 0;

                if (exception is null)
                {
                    _logger.LogInformation(
                        "Encrypted channel closed for user {UserId} on connection {ConnectionId} ({LiveConnections} live connection(s) left, {OnlineUsers} user(s) online)",
                        userId,
                        Context.ConnectionId,
                        _connections.ConnectionCount(userId),
                        _connections.OnlineUserCount);
                }
                else
                {
                    _logger.LogWarning(
                        exception,
                        "Encrypted channel dropped for user {UserId} on connection {ConnectionId} ({LiveConnections} live connection(s) left, {OnlineUsers} user(s) online)",
                        userId,
                        Context.ConnectionId,
                        _connections.ConnectionCount(userId),
                        _connections.OnlineUserCount);
                }

                // Last seen is stamped from this path, so it must not be skipped: Context.ConnectionAborted
                // is already cancelled here, hence CancellationToken.None.
                if (lastConnection)
                    await _presence.UserWentOfflineAsync(userId, CancellationToken.None);
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Relays an opaque encrypted payload to a single user.
        /// </summary>
        /// <param name="recipientId">Destination user id, resolved by <c>Clients.User</c>.</param>
        /// <param name="encryptedPayload">Ciphertext produced by the sender's device.</param>
        public async Task SendEncryptedMessage(string recipientId, string encryptedPayload)
        {
            // The sender is always the authenticated caller. Trusting a sender id from the
            // payload would let any client impersonate any other user.
            if (!Guid.TryParse(Context.UserIdentifier, out var senderId))
                throw new HubException("This connection is not authenticated.");

            if (!Guid.TryParse(recipientId, out var recipientGuid))
                throw new HubException("recipientId must be a user id.");

            if (recipientGuid == senderId)
                throw new HubException("You can't message yourself.");

            if (string.IsNullOrWhiteSpace(encryptedPayload))
                throw new HubException("encryptedPayload is required.");

            if (encryptedPayload.Length > MaxPayloadLength)
                throw new HubException($"encryptedPayload cannot exceed {MaxPayloadLength} characters.");

            // The same rule the REST write path applies. Without this, a client could ignore the
            // recipient's MessagingFrom setting by calling the hub directly.
            var recipient = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == recipientGuid, Context.ConnectionAborted);

            if (recipient is null || !await _policy.CanMessageAsync(recipient, senderId, Context.ConnectionAborted))
            {
                // Deliberately vague: a caller must not be able to use the hub to discover which
                // user ids exist. The real reason is in the log instead.
                _logger.LogInformation(
                    "Refused relay from {SenderId} to {RecipientId} ({Reason})",
                    senderId,
                    recipientGuid,
                    recipient is null ? "no such user" : $"recipient set MessagesFrom={recipient.MessagesFrom}");

                throw new HubException("This user isn't accepting messages right now.");
            }

            // Routed by the canonical Guid form: the user id provider normalises the "sub" claim
            // the same way, so casing can never break delivery.
            await Clients.User(recipientGuid.ToString()).SendAsync(
                ReceiveMessageMethod,
                new EncryptedMessageEnvelope
                {
                    SenderId = senderId.ToString(),
                    EncryptedPayload = encryptedPayload,
                    SentAt = DateTime.UtcNow
                },
                Context.ConnectionAborted);
        }

        /// <summary>
        /// Tells a recipient that the caller is (or is no longer) typing a message to them.
        /// </summary>
        /// <param name="recipientId">Destination user id, resolved by <c>Clients.User</c>.</param>
        /// <param name="isTyping">True while typing started or continues; false once it stops.</param>
        public async Task SendTyping(string recipientId, bool isTyping)
        {
            // Every rejection here is silent, unlike SendEncryptedMessage: this signal is raised
            // automatically while the user types, so there is nothing to shout at them about. A dropped
            // claim simply never appears on the other end.
            if (!Guid.TryParse(Context.UserIdentifier, out var senderId))
                return;

            if (!Guid.TryParse(recipientId, out var recipientGuid) || recipientGuid == senderId)
                return;

            // The same rule the write path applies, so typing cannot be used to reach someone whose
            // MessagesFrom setting says otherwise. A refusal is also indistinguishable from a recipient
            // who is merely offline, so the hub still cannot be used to probe for existing user ids.
            var recipient = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == recipientGuid, Context.ConnectionAborted);

            if (recipient is null || !await _policy.CanMessageAsync(recipient, senderId, Context.ConnectionAborted))
            {
                // Debug, not Information: this fires on every keystroke burst, so a refused client would
                // otherwise be able to write to the log at will.
                _logger.LogDebug(
                    "Dropped typing signal from {SenderId} to {RecipientId} ({Reason})",
                    senderId,
                    recipientGuid,
                    recipient is null ? "no such user" : $"recipient set MessagesFrom={recipient.MessagesFrom}");

                return;
            }

            await Clients.User(recipientGuid.ToString()).SendAsync(
                TypingChangedMethod,
                new TypingChangedEnvelope
                {
                    UserId = senderId.ToString(),
                    IsTyping = isTyping
                },
                Context.ConnectionAborted);
        }
    }
}
