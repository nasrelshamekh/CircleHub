namespace CircleHub.Api.Dtos
{
    public class UserCommunityDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string Visibility { get; set; } = string.Empty;
        public CommunityAdminDto Admin { get; set; } = null!;
        public string UserRole { get; set; } = string.Empty;
        public string MembershipStatus { get; set; } = string.Empty;
        public int MembersCount { get; set; }
        public int PostsCount { get; set; }
    }
}
