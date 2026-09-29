using CircleHub.Api.Enums;

namespace CircleHub.Api.Entities
{
    public class Community
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public required string Slug { get; set; }
        public required string Category { get; set; }
        public required string Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? CoverImageUrl { get; set; }
        public CommunityVisibility Visibility { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public ICollection<Post> Posts { get; set; } = new List<Post>();

        public Guid AdminId { get; set; }
        public User Admin { get; set; } = null!;

        public ICollection<CommunityMember> Members { get; set; } = new List<CommunityMember>();
        public ICollection<CommunityJoinRequest> Requests { get; set; } = new List<CommunityJoinRequest>();
        public ICollection<CommunityPostModerationLog> ModerationActions { get; set; } = new List<CommunityPostModerationLog>();
    }
}
