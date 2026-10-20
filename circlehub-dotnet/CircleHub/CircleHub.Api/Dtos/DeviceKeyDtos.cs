namespace CircleHub.Api.Dtos
{
    /// <summary>One published device key as other clients see it.</summary>
    public class DeviceKeyDto
    {
        public string DeviceId { get; init; } = string.Empty;
        public string PublicKey { get; init; } = string.Empty;
        public DateTime CreatedAt { get; init; }
    }

    public class RegisterDeviceKeyRequest
    {
        public string DeviceId { get; set; } = string.Empty;
        public string PublicKey { get; set; } = string.Empty;
    }
}
