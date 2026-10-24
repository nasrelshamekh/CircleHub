using System.Collections.Concurrent;
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
        private static readonly ConcurrentDictionary<string, List<string>> RecentPreviews = new();

        private readonly IHubContext<ChatHub> _hub;
        private readonly IConnectionTracker _connections;
        private readonly ExpoPushService _push;
        private readonly IConfiguration _config;
        private readonly ILogger<MessageDeliveryService> _logger;

        public MessageDeliveryService(
            IHubContext<ChatHub> hub,
            IConnectionTracker connections,
            ExpoPushService push,
            IConfiguration config,
            ILogger<MessageDeliveryService> logger)
        {
            _hub = hub;
            _connections = connections;
            _push = push;
            _config = config;
            _logger = logger;
        }

        public void ClearUnreadPreviews(Guid conversationId, Guid recipientId)
        {
            var key = $"{conversationId}_{recipientId}";
            RecentPreviews.TryRemove(key, out _);
        }

        public async Task DeliverAsync(
            Guid recipientId,
            Guid senderId,
            EncryptedMessageEnvelope envelope,
            string? senderName = null,
            string? senderAvatarUrl = null,
            string? previewText = null,
            int unreadCount = 1,
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

            var baseTitle = string.IsNullOrWhiteSpace(senderName) ? "New message" : senderName;
            var title = unreadCount > 1 ? $"{baseTitle} ({unreadCount} messages)" : baseTitle;

            var singleBody = !string.IsNullOrWhiteSpace(previewText)
                ? (previewText.Length > 150 ? previewText[..150] + "…" : previewText)
                : (string.IsNullOrEmpty(envelope.EncryptedPayload) ? "Shared a post" : "Sent you a message");

            var previewKey = $"{envelope.ConversationId}_{recipientId}";
            var previews = RecentPreviews.AddOrUpdate(
                previewKey,
                _ => new List<string> { singleBody },
                (_, existing) =>
                {
                    lock (existing)
                    {
                        if (unreadCount <= 1)
                        {
                            existing.Clear();
                        }
                        existing.Add(singleBody);
                        while (existing.Count > 3)
                        {
                            existing.RemoveAt(0);
                        }
                        return existing;
                    }
                });

            string body;
            lock (previews)
            {
                body = string.Join("\n", previews);
            }

            string? resolvedAvatarUrl = null;
            if (!string.IsNullOrWhiteSpace(senderAvatarUrl))
            {
                if (senderAvatarUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                    senderAvatarUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                {
                    resolvedAvatarUrl = senderAvatarUrl;
                }
                else
                {
                    var baseUrl = _config["App:BaseUrl"] ?? "https://circlehub.runasp.net";
                    resolvedAvatarUrl = $"{baseUrl.TrimEnd('/')}/{senderAvatarUrl.TrimStart('/')}";
                }
            }

            var conversationTag = $"chat_{envelope.ConversationId}";

            await _push.SendToUserAsync(
                recipientId,
                title,
                body,
                new
                {
                    type = "message",
                    conversationId = envelope.ConversationId,
                    messageId = envelope.MessageId,
                    senderId = envelope.SenderId,
                    senderAvatarUrl = resolvedAvatarUrl,
                    tag = conversationTag
                },
                channelId: "messages",
                tag: conversationTag,
                imageUrl: null, // Avoid BigPictureStyle so Android expands message text rather than enlarging the avatar
                cancellationToken: cancellationToken);
        }
    }
}
