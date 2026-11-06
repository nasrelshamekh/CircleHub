using System;

namespace CircleHub.Api.Entities
{
    public class MessageReaction
    {
        public Guid Id { get; set; }

        public Guid MessageId { get; set; }
        public Message Message { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public string Emoji { get; set; } = null!;

        public DateTime CreatedAt { get; set; }
    }
}
