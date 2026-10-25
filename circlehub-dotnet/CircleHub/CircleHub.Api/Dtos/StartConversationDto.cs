namespace CircleHub.Api.Dtos
{
    public class StartConversationDto
    {
        public Guid? RecipientId { get; set; }
        public string? RecipientUsername { get; set; }
    }

    public class StartConversationResultDto
    {
        public Guid ConversationId { get; set; }
        public ConversationUserDto OtherUser { get; set; } = null!;
        public bool IsNew { get; set; }
    }
}
