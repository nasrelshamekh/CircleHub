using CircleHub.Api.Enums;

namespace CircleHub.Api.Entities
{
    public class CommunityJoinRequest
    {
        public Guid Id { get; set; }
        public string? Note { get; set; }
        public CommunityJoinRequestStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }

        public Guid CommunityId { get; set; }
        public Community Community { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
    }
}
