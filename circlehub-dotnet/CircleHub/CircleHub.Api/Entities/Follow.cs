namespace CircleHub.Api.Entities
{
    public class Follow
    {
        public Guid Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid FollowerId { get; set; }
        public User Follower { get; set; } = null!;
        public Guid FollowingId { get; set; }
        public User Following { get; set; } = null!;
    }
}
