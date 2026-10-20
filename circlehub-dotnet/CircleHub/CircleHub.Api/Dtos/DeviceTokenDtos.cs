namespace CircleHub.Api.Dtos
{
    public class RegisterDeviceTokenRequest
    {
        public string Token { get; set; } = string.Empty;
        public string? Platform { get; set; }
    }

    public class UnregisterDeviceTokenRequest
    {
        public string Token { get; set; } = string.Empty;
    }

    public class DeviceTokenDto
    {
        public string Token { get; init; } = string.Empty;
        public string Platform { get; init; } = string.Empty;
        public DateTime UpdatedAt { get; init; }
    }
}
