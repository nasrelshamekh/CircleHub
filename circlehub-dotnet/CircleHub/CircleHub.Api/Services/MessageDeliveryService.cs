using CircleHub.Api.Dtos;
using CircleHub.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace CircleHub.Api.Services
{
    /// <summary>
    /// Mirrors a stored message to the recipient's live connections and to the sender's own other
    /// connections.
    /// <para>
    /// The REST write path stays the single source of truth (history, unread counts); this only tells
    /// whoever is connected right now that the message exists. Anyone else loads it on their next
    /// request, and the push fallback will hang off the same place. The sender's other tabs and devices
    /// are echoed too, so a message sent from one tab appears on the rest without waiting for a refetch;
    /// the client recognises its own sender id and invalidates without ringing or toasting.
    /// </para>
    /// </summary>
    public class MessageDeliveryService
    {
        private readonly IHubContext<ChatHub> _hub;
        private readonly IConnectionTracker _connections;
        private readonly ILogger<MessageDeliveryService> _logger;

        public MessageDeliveryService(
            IHubContext<ChatHub> hub,
            IConnectionTracker connections,
            ILogger<MessageDeliveryService> logger)
        {
            _hub = hub;
            _connections = connections;
            _logger = logger;
        }

        public async Task DeliverAsync(
            Guid recipientId,
            Guid senderId,
            EncryptedMessageEnvelope envelope,
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

            if (!_connections.IsOnline(recipientId))
            {
                _logger.LogInformation(
                    "Recipient {RecipientId} has no live connection; message {MessageId} is stored but was not delivered in real time",
                    recipientId,
                    envelope.MessageId);
            }
        }
    }
}
