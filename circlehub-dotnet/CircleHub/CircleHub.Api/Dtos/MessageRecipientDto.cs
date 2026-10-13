namespace CircleHub.Api.Dtos
{
    /// <summary>
    /// Someone the current user can start a conversation with, plus whether
    /// that person's "messages from" setting currently allows it.
    /// </summary>
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
