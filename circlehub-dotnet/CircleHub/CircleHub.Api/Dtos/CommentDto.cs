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

        public Guid? ParentCommentId { get; set; }
        public string? ParentAuthorName { get; set; }
        public string? ParentAuthorUsername { get; set; }

        public int LikesCount { get; set; }
        public bool IsLiked { get; set; }

        public List<CommentDto> Replies { get; set; } = new();

        public static Expression<Func<Comment, CommentDto>> Projection =>
            ProjectionFor(null);

        public static Expression<Func<Comment, CommentDto>> ProjectionFor(Guid? currentUserId) =>
            c => new CommentDto
            {
                Id = c.Id,
                Content = c.Content,
                CreatedAt = c.CreatedAt,
                ParentCommentId = c.ParentCommentId,
                ParentAuthorName = c.ParentComment != null ? c.ParentComment.Author.Name : null,
                ParentAuthorUsername = c.ParentComment != null ? c.ParentComment.Author.Username : null,
                LikesCount = c.Likes.Count,
                IsLiked = currentUserId != null && c.Likes.Any(l => l.UserId == currentUserId),
                Author = new AuthorDto
                {
                    Id = c.Author.Id,
                    Name = c.Author.Name,
                    Username = c.Author.Username,
                    AvatarUrl = c.Author.AvatarUrl
                }
            };

        public static List<CommentDto> NestComments(List<CommentDto> flatComments)
        {
            var commentDict = flatComments.ToDictionary(c => c.Id);
            var rootComments = new List<CommentDto>();

            foreach (var comment in flatComments)
            {
                if (comment.ParentCommentId.HasValue && commentDict.TryGetValue(comment.ParentCommentId.Value, out var parent))
                {
                    parent.Replies.Add(comment);
                }
                else
                {
                    rootComments.Add(comment);
                }
            }

            // Top-level comments: Newest first (reverse chronological)
            // Nested replies: Chronological (oldest first, preserved from flatComments OrderBy CreatedAt ASC)
            rootComments.Reverse();

            return rootComments;
        }
    }
}
