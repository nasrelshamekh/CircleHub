using System.Text.Json.Serialization;

namespace CircleHub.Api.Dtos
{
    public class ConversationDto
    {
        public Guid Id { get; set; }
        public ConversationUserDto OtherUser { get; set; } = null!;
        public DateTime LastMessageAt { get; set; }
        public int UnreadCount { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public MessagePreviewDto? LastMessage { get; set; }
    }

    public class MessagePreviewDto
    {
        public Guid Id { get; set; }

        /// <summary>
        /// The last message's stored body (usually a ciphertext envelope) so the list can render a real
        /// preview rather than a placeholder. Sized like <see cref="SendMessageDto.Content"/>: no
        /// DataAnnotations cap, because a truncated envelope is unreadable while still looking plausible.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Content { get; set; }

        public bool HasPost { get; set; }
        public bool IsMine { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ConversationThreadDto
    {
        public Guid Id { get; set; }
        public ConversationUserDto OtherUser { get; set; } = null!;
        public List<MessageDto> Messages { get; set; } = new();
        public bool HasMore { get; set; }
    }
}
