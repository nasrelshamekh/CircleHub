namespace CircleHub.Api.Dtos
{
    public class SearchUserDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? JobTitle { get; set; }
        public string? AvatarUrl { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? Bio { get; set; }
        public string? Location { get; set; }
        public string? Website { get; set; }
        public List<string> Skills { get; set; } = new();
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public DateTime CreatedAt { get; set; }
        public int PostsCount { get; set; }
        public int FollowersCount { get; set; }
        public int FollowingCount { get; set; }
        public bool IsFollowedByMe { get; set; }
    }
}
