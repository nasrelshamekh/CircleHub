using System.ComponentModel.DataAnnotations;

namespace CircleHub.Api.Dtos
{
    public class SendMessageDto
    {
        [Required]
        public string RecipientUsername { get; set; } = string.Empty;

        public string? Content { get; set; }

        // When set, the message shares this post. The post has to be visible to
        // both the sender and the recipient.
        public Guid? PostId { get; set; }
    }

    public class SendMessageResultDto
    {
        public Guid ConversationId { get; set; }
        public MessageDto Message { get; set; } = null!;
    }
}
