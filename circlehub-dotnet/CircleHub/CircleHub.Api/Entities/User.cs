namespace CircleHub.Api.Entities
{
    public class User
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public required string Username { get; set; }
        public required string Email { get; set; }
        public required string PasswordHash { get; set; }
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? JobTitle { get; set; }
        public string? AvatarUrl { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? Bio { get; set; }
        public string? Location { get; set; }
        public string? Website { get; set; }
        public List<string> Skills { get; set; } = new();
        public bool EmailVerified { get; set; }
        public string? EmailVerificationTokenHash { get; set; }
        public DateTime? EmailVerificationTokenExpires { get; set; }
        public DateTime? VerificationEmailSentAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public ICollection<Post> Posts { get; set; } = new List<Post>();
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public ICollection<Like> Likes { get; set; } = new List<Like>();
        public ICollection<Community> AdministeredCommunities { get; set; } = new List<Community>();
        public ICollection<CommunityMember> CommunityMemberships { get; set; } = new List<CommunityMember>();
        public ICollection<CommunityJoinRequest> CommunityJoinRequests { get; set; } = new List<CommunityJoinRequest>();
        public ICollection<CommunityPostModerationLog> CommunityModerationActions { get; set; } = new List<CommunityPostModerationLog>();
        public ICollection<Follow> Following { get; set; } = new List<Follow>();
        public ICollection<Follow> Followers { get; set; } = new List<Follow>();
    }
}
