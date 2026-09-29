namespace CircleHub.Api.Dtos
{
    public class FollowUserDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? JobTitle { get; set; }
        public string? Bio { get; set; }
        public string? Location { get; set; }
        public string? AvatarUrl { get; set; }
        public int FollowersCount { get; set; }
        public bool IsFollowedByMe { get; set; }
        public bool IsCurrentUser { get; set; }
    }
}
