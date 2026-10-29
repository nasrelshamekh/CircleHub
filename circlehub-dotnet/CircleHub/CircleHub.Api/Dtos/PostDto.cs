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
        public List<string> ImageUrls { get; set; } = new();
        [JsonIgnore]
        public string? AdditionalImageUrls { get; set; }
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public PollDto? Poll { get; set; }
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

        public void ResolveRichData()
        {
            ImageUrls.Clear();
            if (!string.IsNullOrWhiteSpace(ImageUrl))
                ImageUrls.Add(ImageUrl);

            if (!string.IsNullOrWhiteSpace(AdditionalImageUrls))
            {
                try
                {
                    var extra = System.Text.Json.JsonSerializer.Deserialize<List<string>>(AdditionalImageUrls);
                    if (extra != null)
                    {
                        foreach (var url in extra)
                        {
                            if (!string.IsNullOrWhiteSpace(url) && !ImageUrls.Contains(url))
                                ImageUrls.Add(url);
                        }
                    }
                }
                catch
                {
                    var split = AdditionalImageUrls.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                    foreach (var url in split)
                    {
                        if (!string.IsNullOrWhiteSpace(url) && !ImageUrls.Contains(url))
                            ImageUrls.Add(url);
                    }
                }
            }

            if (Poll != null && Poll.Options.Count > 0)
            {
                foreach (var opt in Poll.Options)
                {
                    opt.Percentage = Poll.TotalVotes > 0
                        ? Math.Round((double)opt.VotesCount / Poll.TotalVotes * 100, 1)
                        : 0;
                }
            }
        }

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
                AdditionalImageUrls = p.AdditionalImageUrls,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                LikesCount = p.Likes.Count,
                CommentsCount = p.Comments.Count,
                IsLikedByMe = p.Likes.Any(l => l.UserId == currentUserId),
                Poll = p.Poll != null
                    ? new PollDto
                    {
                        Id = p.Poll.Id,
                        Question = p.Poll.Question,
                        ExpiresAt = p.Poll.ExpiresAt,
                        IsExpired = p.Poll.ExpiresAt != null && p.Poll.ExpiresAt < DateTime.UtcNow,
                        TotalVotes = p.Poll.Votes.Count,
                        MyVotedOptionId = currentUserId != null
                            ? p.Poll.Votes.Where(v => v.UserId == currentUserId).Select(v => (Guid?)v.PollOptionId).FirstOrDefault()
                            : null,
                        Options = p.Poll.Options.OrderBy(o => o.DisplayOrder).Select(o => new PollOptionDto
                        {
                            Id = o.Id,
                            Text = o.Text,
                            DisplayOrder = o.DisplayOrder,
                            VotesCount = o.Votes.Count
                        }).ToList()
                    }
                    : null,
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
                AdditionalImageUrls = p.AdditionalImageUrls,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                LikesCount = p.Likes.Count,
                CommentsCount = p.Comments.Count,
                IsLikedByMe = p.Likes.Any(l => l.UserId == currentUserId),
                Poll = p.Poll != null
                    ? new PollDto
                    {
                        Id = p.Poll.Id,
                        Question = p.Poll.Question,
                        ExpiresAt = p.Poll.ExpiresAt,
                        IsExpired = p.Poll.ExpiresAt != null && p.Poll.ExpiresAt < DateTime.UtcNow,
                        TotalVotes = p.Poll.Votes.Count,
                        MyVotedOptionId = currentUserId != null
                            ? p.Poll.Votes.Where(v => v.UserId == currentUserId).Select(v => (Guid?)v.PollOptionId).FirstOrDefault()
                            : null,
                        Options = p.Poll.Options.OrderBy(o => o.DisplayOrder).Select(o => new PollOptionDto
                        {
                            Id = o.Id,
                            Text = o.Text,
                            DisplayOrder = o.DisplayOrder,
                            VotesCount = o.Votes.Count
                        }).ToList()
                    }
                    : null,
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
