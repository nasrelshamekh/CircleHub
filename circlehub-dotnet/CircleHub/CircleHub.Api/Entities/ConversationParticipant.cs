namespace CircleHub.Api.Entities
{
    public class ConversationParticipant
    {
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public Conversation Conversation { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public DateTime? LastReadAt { get; set; }
    }
}
