using System.ComponentModel.DataAnnotations;

namespace CircleHub.Api.Dtos
{
    public class SendMessageDto
    {
        [Required]
        public string RecipientUsername { get; set; } = string.Empty;

        public string? Content { get; set; }

        public Guid? PostId { get; set; }
    }

    public class SendMessageResultDto
    {
        public Guid ConversationId { get; set; }
        public MessageDto Message { get; set; } = null!;
    }
}
