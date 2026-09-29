using CircleHub.Api.Enums;

namespace CircleHub.Api.Entities
{
    public class CommunityPostModerationLog
    { 
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public Guid PostAuthorId { get; set; }
        public CommunityModerationAction Action { get; set; }
        public string? Reason { get; set; }
        public DateTime CreatedAt { get; set; }

        public Guid CommunityId { get; set; }
        public Community Community { get; set; } = null!;
        public Guid ActorId { get; set; }
        public User Actor { get; set; } = null!;
    }
}
