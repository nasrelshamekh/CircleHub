namespace CircleHub.Api.Dtos
{
    public class UpdateSettingsDto
    {
        public string? ProfileVisibility { get; set; }

        public string? MessagesFrom { get; set; }

        public bool? EmailNotifications { get; set; }

        public bool? CommunityUpdates { get; set; }
    }
}
