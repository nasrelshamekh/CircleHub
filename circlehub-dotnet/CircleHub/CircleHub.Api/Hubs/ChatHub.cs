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
        /// Cap on the encrypted payload. SignalR already rejects hub messages above
        /// <c>MaximumReceiveMessageSize</c> (32 KB by default); this keeps the application
        /// limit well below that so a single message can never crowd out the transport buffer.
        /// </summary>
        private const int MaxPayloadLength = 16 * 1024;

        private readonly AppDbContext _db;
        private readonly MessagePolicyService _policy;
        private readonly IConnectionTracker _connections;
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(
            AppDbContext db,
            MessagePolicyService policy,
            IConnectionTracker connections,
            ILogger<ChatHub> logger)
        {
            _db = db;
            _policy = policy;
            _connections = connections;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            if (Guid.TryParse(Context.UserIdentifier, out var userId))
            {
                _connections.Add(userId, Context.ConnectionId);

                _logger.LogInformation(
                    "Encrypted channel opened for user {UserId} on connection {ConnectionId} ({LiveConnections} live connection(s), {OnlineUsers} user(s) online)",
                    userId,
                    Context.ConnectionId,
                    _connections.ConnectionCount(userId),
                    _connections.OnlineUserCount);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (Guid.TryParse(Context.UserIdentifier, out var userId))
            {
                _connections.Remove(userId, Context.ConnectionId);

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
    }
}
