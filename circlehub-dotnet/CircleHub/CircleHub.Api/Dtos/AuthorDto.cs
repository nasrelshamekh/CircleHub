using System.Text.Json.Serialization;

namespace CircleHub.Api.Dtos
{
    public class AuthorDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? JobTitle { get; set; }
    }
}
