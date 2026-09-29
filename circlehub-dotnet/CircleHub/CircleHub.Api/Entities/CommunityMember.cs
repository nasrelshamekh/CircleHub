using CircleHub.Api.Enums;

namespace CircleHub.Api.Entities
{
    public class CommunityMember
    {
        public Guid Id { get; set; }
        public CommunityRole Role { get; set; }
        public DateTime JoinedAt { get; set; }

        public Guid CommunityId { get; set; }
        public Community Community { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
    }
}
