namespace CircleHub.Api.Dtos
{
    /// <summary>
    /// Payload pushed to a recipient's live connections. The server treats
    /// <see cref="EncryptedPayload"/> as an opaque blob: it is produced on the sender's device and can
    /// only be read by the recipient's device.
    /// </summary>
    public class EncryptedMessageEnvelope
    {
        /// <summary>The authenticated sender, taken from the JWT ("sub"), never from the caller.</summary>
        public required string SenderId { get; init; }

        /// <summary>Opaque payload. The server never inspects, truncates or rewrites it.</summary>
        public required string EncryptedPayload { get; init; }

        public DateTime SentAt { get; init; }

        /// <summary>
        /// Id of the stored message. Set by the REST fan-out, null for a pure hub relay, where there is
        /// no row to point at.
        /// </summary>
        public string? MessageId { get; init; }

        /// <summary>
        /// Conversation the message belongs to. Set by the REST fan-out so the client can refresh just
        /// that thread instead of refetching every conversation.
        /// </summary>
        public string? ConversationId { get; init; }
    }
}
