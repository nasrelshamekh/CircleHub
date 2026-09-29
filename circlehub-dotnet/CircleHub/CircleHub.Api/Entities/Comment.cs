namespace CircleHub.Api.Entities
{
    public class Comment
    {
        public Guid Id { get; set; }
        public required string Content { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public Guid PostId { get; set; }
        public Post Post { get; set; } = null!;

        public Guid AuthorId { get; set; }
        public User Author { get; set; } = null!;
    }
}
