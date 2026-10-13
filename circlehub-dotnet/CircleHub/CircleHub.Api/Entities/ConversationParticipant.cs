namespace CircleHub.Api.Entities
{
    public class ConversationParticipant
    {
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public Conversation Conversation { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        // Used to work out how many messages are unread for this participant.
        public DateTime? LastReadAt { get; set; }
    }
}
