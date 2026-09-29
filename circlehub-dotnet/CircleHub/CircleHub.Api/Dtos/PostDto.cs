using System.Linq.Expressions;
using System.Text.Json.Serialization;
using CircleHub.Api.Entities;

namespace CircleHub.Api.Dtos
{
    public class PostDto
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int LikesCount { get; set; }
        public int CommentsCount { get; set; }
        public bool IsLikedByMe { get; set; }
        public AuthorDto Author { get; set; } = null!;
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<CommentDto>? Comments { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public PostCommunityDto? Community { get; set; }

        public static Expression<Func<Post, PostDto>> Projection(Guid? currentUserId) =>
            Projection(currentUserId, includeCommunity: false);

        public static Expression<Func<Post, PostDto>> Projection(
            Guid? currentUserId,
            bool includeCommunity) =>
            p => new PostDto
            {
                Id = p.Id,
                Content = p.Content,
                ImageUrl = p.ImageUrl,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                LikesCount = p.Likes.Count,
                CommentsCount = p.Comments.Count,
                IsLikedByMe = p.Likes.Any(l => l.UserId == currentUserId),
                Author = new AuthorDto
                {
                    Id = p.Author.Id,
                    Name = p.Author.Name,
                    Username = p.Author.Username,
                    AvatarUrl = p.Author.AvatarUrl
                },
                Community = includeCommunity && p.CommunityId != null
                    ? new PostCommunityDto
                    {
                        Id = p.Community!.Id,
                        Name = p.Community.Name,
                        Slug = p.Community.Slug,
                        ImageUrl = p.Community.ImageUrl,
                        Visibility = p.Community.Visibility.ToString().ToLower()
                    }
                    : null
            };

        public static Expression<Func<Post, PostDto>> SearchProjection(Guid? currentUserId) =>
            p => new PostDto
            {
                Id = p.Id,
                Content = p.Content,
                ImageUrl = p.ImageUrl,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                LikesCount = p.Likes.Count,
                CommentsCount = p.Comments.Count,
                IsLikedByMe = p.Likes.Any(l => l.UserId == currentUserId),
                Author = new AuthorDto
                {
                    Id = p.Author.Id,
                    Name = p.Author.Name,
                    Username = p.Author.Username,
                    AvatarUrl = p.Author.AvatarUrl,
                    JobTitle = p.Author.JobTitle
                },
                Community = p.CommunityId != null
                    ? new PostCommunityDto
                    {
                        Id = p.Community!.Id,
                        Name = p.Community.Name,
                        Slug = p.Community.Slug,
                        ImageUrl = p.Community.ImageUrl,
                        Visibility = p.Community.Visibility.ToString().ToLower()
                    }
                    : null
            };
    }
}
