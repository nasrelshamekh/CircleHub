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

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public PostDto? Post { get; set; }

        public DateTime CreatedAt { get; set; }
        public bool IsMine { get; set; }
        public AuthorDto Sender { get; set; } = null!;
    }
}
