namespace CircleHub.Api.Dtos
{
    /// <summary>
    /// Partial update of the account settings shown on the Settings tab.
    /// Values are the same lowercase strings the clients send; the controller
    /// validates and maps them onto the domain enums.
    /// </summary>
    public class UpdateSettingsDto
    {
        /// "public" | "followers" | "private"
        public string? ProfileVisibility { get; set; }

        /// "everyone" | "followers" | "none"
        public string? MessagesFrom { get; set; }

        public bool? EmailNotifications { get; set; }

        public bool? CommunityUpdates { get; set; }
    }
}
