namespace CircleHub.Api.Entities
{
    public class Like
    {
        public Guid Id { get; set; }
        public DateTime CreatedAt { get; set; }

        public Guid PostId { get; set; }
        public Post Post { get; set; } = null!;
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
    }
}
