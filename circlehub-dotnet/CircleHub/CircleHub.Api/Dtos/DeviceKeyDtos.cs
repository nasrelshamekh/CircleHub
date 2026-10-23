namespace CircleHub.Api.Dtos
{
    /// <summary>One published device key as other clients see it.</summary>
    public class DeviceKeyDto
    {
        public string DeviceId { get; init; } = string.Empty;
        public string PublicKey { get; init; } = string.Empty;
        public DateTime CreatedAt { get; init; }

        /// <summary>
        /// When this device last published a key. A sender wraps a message for the most recently
        /// seen devices first, so this is the order the directory is useful in.
        /// </summary>
        public DateTime LastSeenAt { get; init; }
    }

    public class RegisterDeviceKeyRequest
    {
        public string DeviceId { get; set; } = string.Empty;
        public string PublicKey { get; set; } = string.Empty;
    }
}
