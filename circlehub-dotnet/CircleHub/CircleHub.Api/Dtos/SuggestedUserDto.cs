namespace CircleHub.Api.Dtos
{
    public class SuggestedUserDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? JobTitle { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Location { get; set; }
    }
}
