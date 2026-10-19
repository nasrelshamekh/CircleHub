using CircleHub.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

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

        private readonly ILogger<ChatHub> _logger;

        public ChatHub(ILogger<ChatHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation(
                "Encrypted channel opened for user {UserId} on connection {ConnectionId}",
                Context.UserIdentifier,
                Context.ConnectionId);

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (exception is null)
            {
                _logger.LogInformation(
                    "Encrypted channel closed for user {UserId} on connection {ConnectionId}",
                    Context.UserIdentifier,
                    Context.ConnectionId);
            }
            else
            {
                _logger.LogWarning(
                    exception,
                    "Encrypted channel dropped for user {UserId} on connection {ConnectionId}",
                    Context.UserIdentifier,
                    Context.ConnectionId);
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
            var senderId = Context.UserIdentifier;

            if (string.IsNullOrEmpty(senderId))
                throw new HubException("This connection is not authenticated.");

            if (!Guid.TryParse(recipientId, out _))
                throw new HubException("recipientId must be a user id.");

            if (string.Equals(recipientId, senderId, StringComparison.OrdinalIgnoreCase))
                throw new HubException("You can't message yourself.");

            if (string.IsNullOrWhiteSpace(encryptedPayload))
                throw new HubException("encryptedPayload is required.");

            if (encryptedPayload.Length > MaxPayloadLength)
                throw new HubException($"encryptedPayload cannot exceed {MaxPayloadLength} characters.");

            await Clients.User(recipientId).SendAsync(ReceiveMessageMethod, new EncryptedMessageEnvelope
            {
                SenderId = senderId,
                EncryptedPayload = encryptedPayload,
                SentAt = DateTime.UtcNow
            });
        }
    }
}
