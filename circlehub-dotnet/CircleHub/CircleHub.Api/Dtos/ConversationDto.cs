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
