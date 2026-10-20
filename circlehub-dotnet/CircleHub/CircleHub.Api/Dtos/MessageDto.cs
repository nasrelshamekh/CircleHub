using System.Text.Json.Serialization;

namespace CircleHub.Api.Dtos
{
    public class MessageDto
    {
        public Guid Id { get; set; }

        /// <summary>
        /// The stored body as-is: ciphertext for anything sent since client-side encryption landed, and
        /// plain text for everything before it. The client is the only side that can read it.
        /// </summary>
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
