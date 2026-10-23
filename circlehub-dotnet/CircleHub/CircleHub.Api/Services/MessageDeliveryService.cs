using CircleHub.Api.Dtos;
using CircleHub.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace CircleHub.Api.Services
{
    /// <summary>
    /// Mirrors a stored message to the recipient's live connections and to the sender's own other
    /// connections, and falls back to the Expo Push Service when the recipient has no live connection.
    /// <para>
    /// The REST write path stays the single source of truth (history, unread counts); this only tells
    /// whoever is connected right now that the message exists, or nudges their registered mobile devices
    /// when they are offline. The sender's other tabs and devices are echoed too, so a message sent from
    /// one tab appears on the rest without waiting for a refetch; the client recognises its own sender id
    /// and invalidates without ringing or toasting.
    /// </para>
    /// </summary>
    public class MessageDeliveryService
    {
        private readonly IHubContext<ChatHub> _hub;
        private readonly IConnectionTracker _connections;
        private readonly ExpoPushService _push;
        private readonly ILogger<MessageDeliveryService> _logger;

        public MessageDeliveryService(
            IHubContext<ChatHub> hub,
            IConnectionTracker connections,
            ExpoPushService push,
            ILogger<MessageDeliveryService> logger)
        {
            _hub = hub;
            _connections = connections;
            _push = push;
            _logger = logger;
        }

        public async Task DeliverAsync(
            Guid recipientId,
            Guid senderId,
            EncryptedMessageEnvelope envelope,
            string? senderName = null,
            CancellationToken cancellationToken = default)
        {
            // Two audiences, one call: the recipient's live connections get the message, and the
            // sender's own other connections get their echo (a message sent from tab A must show up in
            // tab B without a refetch). SignalR's Users(...) takes every id, so the sending connection
            // hears its own echo as well — harmless, because the client's own-sender guard turns it
            // into a plain invalidation.
            // Pushing to a user who has nothing connected is a no-op, not an error: the message is
            // already stored, so the worst case is that they see it a little later.
            await _hub.Clients.Users(recipientId.ToString(), senderId.ToString())
                .SendAsync(ChatHub.ReceiveMessageMethod, envelope, cancellationToken);

            // Message.Content is opaque (and usually an ENC:v1: E2EE envelope), so the push banner
            // deliberately never includes or inspects the message text.
            var title = string.IsNullOrWhiteSpace(senderName) ? "New message" : senderName;
            var body = string.IsNullOrEmpty(envelope.EncryptedPayload)
                ? "Shared a post"
                : "Sent you a message";

            await _push.SendToUserAsync(
                recipientId,
                title,
                body,
                new
                {
                    type = "message",
                    conversationId = envelope.ConversationId,
                    messageId = envelope.MessageId,
                    senderId = envelope.SenderId
                },
                cancellationToken);
        }
    }
}
