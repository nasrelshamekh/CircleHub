namespace CircleHub.Api.Dtos
{
    public class MessageRecipientDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string MessagesFrom { get; set; } = string.Empty;
        public bool CanMessage { get; set; }
    }
}
