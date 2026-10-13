namespace CircleHub.Api.Entities
{
    /// <summary>
    /// A single direct message. A message carries text, a shared post, or both.
    /// </summary>
    public class Message
    {
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public Conversation Conversation { get; set; } = null!;

        public Guid SenderId { get; set; }
        public User Sender { get; set; } = null!;

        public string? Content { get; set; }

        // Set when the message shares a post. Cleared (SetNull) if the post is deleted.
        public Guid? PostId { get; set; }
        public Post? Post { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
