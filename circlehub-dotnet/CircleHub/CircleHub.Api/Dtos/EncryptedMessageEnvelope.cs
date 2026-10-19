namespace CircleHub.Api.Dtos
{
    /// <summary>
    /// Payload relayed over <see cref="Hubs.ChatHub"/>. The server treats
    /// <see cref="EncryptedPayload"/> as an opaque ciphertext blob: it is produced on the
    /// sender's device and can only be decrypted by the recipient's device.
    /// </summary>
    public class EncryptedMessageEnvelope
    {
        /// <summary>The authenticated sender, taken from the JWT ("sub"), never from the caller.</summary>
        public required string SenderId { get; init; }

        /// <summary>Opaque, end-to-end encrypted payload. The server never inspects or mutates it.</summary>
        public required string EncryptedPayload { get; init; }

        public DateTime SentAt { get; init; }
    }
}
