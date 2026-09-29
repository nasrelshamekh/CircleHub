using System.Linq.Expressions;
using CircleHub.Api.Entities;

namespace CircleHub.Api.Dtos
{
    public class CommentDto
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public AuthorDto Author { get; set; } = null!;

        public static readonly Expression<Func<Comment, CommentDto>> Projection =
            c => new CommentDto
            {
                Id = c.Id,
                Content = c.Content,
                CreatedAt = c.CreatedAt,
                Author = new AuthorDto
                {
                    Id = c.Author.Id,
                    Name = c.Author.Name,
                    Username = c.Author.Username,
                    AvatarUrl = c.Author.AvatarUrl
                }
            };
    }
}
