namespace CircleHub.Api.Entities
{
    public class CommentLike
    {
        public Guid Id { get; set; }
        public DateTime CreatedAt { get; set; }

        public Guid CommentId { get; set; }
        public Comment Comment { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
    }
}
