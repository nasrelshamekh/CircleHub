using System.Text.Json.Serialization;

namespace CircleHub.Api.Dtos
{
    public class MessageDto
    {
        public Guid Id { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Content { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Guid? PostId { get; set; }

        // Projected for the viewer; null when the shared post is gone or no
        // longer visible to them.
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public PostDto? Post { get; set; }

        public DateTime CreatedAt { get; set; }
        public bool IsMine { get; set; }
        public AuthorDto Sender { get; set; } = null!;
    }
}
