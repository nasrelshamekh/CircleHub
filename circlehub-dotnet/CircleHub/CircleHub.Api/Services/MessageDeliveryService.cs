using CircleHub.Api.Dtos;
using CircleHub.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace CircleHub.Api.Services
{
    /// <summary>
    /// Mirrors a stored message to a recipient's live connections.
    /// <para>
    /// The REST write path stays the single source of truth (history, unread counts); this only tells
    /// whoever is connected right now that the message exists. Anyone else loads it on their next
    /// request, and the push fallback will hang off the same place.
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
            EncryptedMessageEnvelope envelope,
            CancellationToken cancellationToken = default)
        {
            // Pushing to a user who has nothing connected is a no-op, not an error: the message is
            // already stored, so the worst case is that they see it a little later.
            await _hub.Clients.User(recipientId.ToString())
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
