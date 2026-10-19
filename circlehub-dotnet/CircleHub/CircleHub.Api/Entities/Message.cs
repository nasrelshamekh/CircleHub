namespace CircleHub.Api.Entities
{
    public class Message
    {
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public Conversation Conversation { get; set; } = null!;

        public Guid SenderId { get; set; }
        public User Sender { get; set; } = null!;

        public string? Content { get; set; }

        public Guid? PostId { get; set; }
        public Post? Post { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
