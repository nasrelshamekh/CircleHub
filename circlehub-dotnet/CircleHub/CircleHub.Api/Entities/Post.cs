namespace CircleHub.Api.Entities
{
    public class Post
    {
        public Guid Id { get; set; }
        public required string Content { get; set; }
        public string? ImageUrl { get; set; }
        public string? ImagePublicId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        public Guid AuthorId { get; set; }
        public User Author { get; set; } = null!;

        public Guid? CommunityId { get; set; }
        public Community? Community { get; set; }

        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public ICollection<Like> Likes { get; set; } = new List<Like>();
    }
}
