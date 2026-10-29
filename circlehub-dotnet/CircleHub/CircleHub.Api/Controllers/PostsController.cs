using Microsoft.AspNetCore.RateLimiting;
﻿using CircleHub.Api.Data;
using CircleHub.Api.Dtos;
using CircleHub.Api.Entities;
using CircleHub.Api.Enums;
using CircleHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using CircleHub.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace CircleHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly UploadService _uploadService;
        private readonly NotificationService _notifications;
        private readonly IHubContext<ChatHub> _hub;

        public PostsController(
            AppDbContext db,
            UploadService uploadService,
            NotificationService notifications,
            IHubContext<ChatHub> hub)
        {
            _db = db;
            _uploadService = uploadService;
            _notifications = notifications;
            _hub = hub;
        }

        private Guid? CurrentUserId
        {
            get
            {
                var sub = User.FindFirstValue("sub");
                return sub is not null && Guid.TryParse(sub, out var id) ? id : null;
            }
        }

        private IActionResult Fail(int status, string message) =>
            StatusCode(status, new ApiErrorResponse { Success = false, Message = message });

        [HttpGet]
        public async Task<IActionResult> GetPosts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var visible = _db.Posts.WhereVisibleTo(CurrentUserId);

            var total = await visible.CountAsync();

            var posts = await visible
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(PostDto.Projection(CurrentUserId, includeCommunity: true))
                .ToListAsync();

            posts.ForEach(p => p.ResolveRichData());

            var totalPages = Math.Max(1, (int)Math.Ceiling(total / (double)pageSize));

            return Ok(new ApiResponse<List<PostDto>>
            {
                Data = posts,
                Meta = new PageMeta
                {
                    Page = page,
                    PageSize = pageSize,
                    Total = total,
                    TotalPages = totalPages,
                    HasNext = page < totalPages
                }
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPost(Guid id)
        {
            var post = await _db.Posts
                .Where(p => p.Id == id)
                .WhereVisibleTo(CurrentUserId)
                .Select(PostDto.Projection(CurrentUserId, includeCommunity: true))
                .FirstOrDefaultAsync();

            if (post is null)
                return Fail(StatusCodes.Status404NotFound, "Post not found");

            post.Comments = await _db.Comments
                .Where(c => c.PostId == id)
                .OrderBy(c => c.CreatedAt)
                .Select(CommentDto.Projection)
                .ToListAsync();

            post.ResolveRichData();

            return Ok(new ApiResponse<PostDto> { Data = post });
        }

        [Authorize]
        [HttpPost]
        [EnableRateLimiting("upload")]
        public async Task<IActionResult> CreatePost([FromForm] CreatePostDto dto)
        {
            var userId = CurrentUserId!.Value;

            string? primaryImageUrl = null;
            var additionalUrls = new List<string>();
            var savedUrls = new List<string>();

            // Collect all images from Images list or single Image
            var imageFiles = new List<IFormFile>();
            if (dto.Images != null && dto.Images.Count > 0)
                imageFiles.AddRange(dto.Images.Where(f => f != null && f.Length > 0));
            else if (dto.Image != null && dto.Image.Length > 0)
                imageFiles.Add(dto.Image);

            try
            {
                for (int i = 0; i < imageFiles.Count; i++)
                {
                    var saved = await _uploadService.SavePostImageAsync(imageFiles[i]);
                    if (saved != null)
                    {
                        savedUrls.Add(saved);
                        if (i == 0) primaryImageUrl = saved;
                        else additionalUrls.Add(saved);
                    }
                }
            }
            catch (ArgumentException ex)
            {
                foreach (var url in savedUrls)
                    await _uploadService.DeleteImageAsync(url);
                return Fail(StatusCodes.Status400BadRequest, ex.Message);
            }

            var post = new Post
            {
                Content = dto.Content,
                ImageUrl = primaryImageUrl,
                AdditionalImageUrls = additionalUrls.Count > 0 ? System.Text.Json.JsonSerializer.Serialize(additionalUrls) : null,
                AuthorId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Community Polls & Rich Post Types
            if (!string.IsNullOrWhiteSpace(dto.PollQuestion) && dto.PollOptions != null)
            {
                var validOptions = dto.PollOptions
                    .Where(o => !string.IsNullOrWhiteSpace(o))
                    .Select(o => o.Trim())
                    .Distinct()
                    .Take(6)
                    .ToList();

                if (validOptions.Count >= 2)
                {
                    var expiresAt = dto.PollDurationDays.HasValue && dto.PollDurationDays.Value > 0
                        ? DateTime.UtcNow.AddDays(Math.Clamp(dto.PollDurationDays.Value, 1, 30))
                        : (DateTime?)null;

                    post.Poll = new Poll
                    {
                        Question = dto.PollQuestion.Trim(),
                        ExpiresAt = expiresAt,
                        CreatedAt = DateTime.UtcNow,
                        Options = validOptions.Select((text, index) => new PollOption
                        {
                            Text = text,
                            DisplayOrder = index
                        }).ToList()
                    };
                }
            }

            _db.Posts.Add(post);

            try
            {
                await _db.SaveChangesAsync();
            }
            catch
            {
                foreach (var url in savedUrls)
                    await _uploadService.DeleteImageAsync(url);
                throw;
            }

            var created = await _db.Posts
                .Where(p => p.Id == post.Id)
                .Select(PostDto.Projection(userId, includeCommunity: true))
                .FirstAsync();

            created.ResolveRichData();

            await _hub.Clients.All.SendAsync(ChatHub.PostCreatedMethod, created);

            return StatusCode(StatusCodes.Status201Created, new ApiResponse<PostDto>
            {
                Message = "Post created successfully",
                Data = created
            });
        }

        [Authorize]
        [HttpPost("{id}/poll/vote")]
        public async Task<IActionResult> VotePoll(Guid id, [FromBody] VotePollDto dto)
        {
            var userId = CurrentUserId!.Value;

            var post = await _db.Posts
                .Include(p => p.Poll)
                    .ThenInclude(p => p!.Options)
                .Include(p => p.Poll)
                    .ThenInclude(p => p!.Votes)
                .WhereVisibleTo(userId)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (post?.Poll is null)
                return Fail(StatusCodes.Status404NotFound, "Poll not found for this post");

            if (post.Poll.ExpiresAt.HasValue && post.Poll.ExpiresAt.Value < DateTime.UtcNow)
                return Fail(StatusCodes.Status400BadRequest, "This poll has ended");

            var option = post.Poll.Options.FirstOrDefault(o => o.Id == dto.OptionId);
            if (option is null)
                return Fail(StatusCodes.Status400BadRequest, "Invalid poll option selected");

            var existingVote = post.Poll.Votes.FirstOrDefault(v => v.UserId == userId);
            if (existingVote != null)
            {
                existingVote.PollOptionId = dto.OptionId;
                existingVote.VotedAt = DateTime.UtcNow;
            }
            else
            {
                _db.PollVotes.Add(new PollVote
                {
                    PollId = post.Poll.Id,
                    PollOptionId = dto.OptionId,
                    UserId = userId,
                    VotedAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();

            var updatedPost = await _db.Posts
                .Where(p => p.Id == id)
                .Select(PostDto.Projection(userId, includeCommunity: true))
                .FirstAsync();

            updatedPost.ResolveRichData();

            await _hub.Clients.All.SendAsync("PollUpdated", new { PostId = id, Poll = updatedPost.Poll });

            return Ok(new ApiResponse<PollDto>
            {
                Message = "Vote recorded successfully",
                Data = updatedPost.Poll!
            });
        }

        [Authorize]
        [HttpPatch("{id}")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePost(Guid id, [FromForm] UpdatePostDto dto)
        {
            var userId = CurrentUserId!.Value;

            var post = await _db.Posts
                .Where(p => p.Id == id)
                .WhereVisibleTo(userId)
                .FirstOrDefaultAsync();

            if (post is null)
                return Fail(StatusCodes.Status404NotFound, "Post not found");

            if (post.AuthorId != userId)
                return Fail(StatusCodes.Status403Forbidden, "You are not allowed to update this post");

            string? newImageRelative = null;

            try
            {
                if (dto.Image is not null)
                    newImageRelative = await _uploadService.SavePostImageAsync(dto.Image);
            }
            catch (ArgumentException ex)
            {
                return Fail(StatusCodes.Status400BadRequest, ex.Message);
            }

            if (newImageRelative is not null)
            {
                if (!string.IsNullOrEmpty(post.ImageUrl))
                    await _uploadService.DeleteImageAsync(post.ImageUrl);

                post.ImageUrl = newImageRelative;
            }

            post.Content = dto.Content;
            post.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _db.SaveChangesAsync();
            }
            catch
            {
                if (newImageRelative is not null)
                    await _uploadService.DeleteImageAsync(newImageRelative);
                throw;
            }

            var updated = await _db.Posts
                .Where(p => p.Id == id)
                .Select(PostDto.Projection(userId))
                .FirstAsync();

            return Ok(new ApiResponse<PostDto>
            {
                Message = "Post updated successfully",
                Data = updated
            });
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePost(Guid id)
        {
            var userId = CurrentUserId!.Value;

            var post = await _db.Posts
                .Where(p => p.Id == id)
                .Where(p =>
                    p.AuthorId == userId ||
                    p.CommunityId == null ||
                    p.Community!.Visibility == CommunityVisibility.Public ||
                    p.Community!.AdminId == userId ||
                    p.Community!.Members.Any(m => m.UserId == userId))
                .FirstOrDefaultAsync();

            if (post is null)
                return Fail(StatusCodes.Status404NotFound, "Post not found");

            if (post.AuthorId != userId)
                return Fail(StatusCodes.Status403Forbidden, "You are not allowed to delete this post");

            _db.Posts.Remove(post);
            await _db.SaveChangesAsync();

            return Ok(new ApiResponse<object> { Message = "Post deleted successfully" });
        }

        [Authorize]
        [HttpPatch("{id}/like")]
        public async Task<IActionResult> ToggleLike(Guid id)
        {
            var userId = CurrentUserId!.Value;

            var postAuthorId = await _db.Posts
                .Where(p => p.Id == id)
                .WhereVisibleTo(userId)
                .Select(p => (Guid?)p.AuthorId)
                .FirstOrDefaultAsync();
            if (postAuthorId is null)
                return Fail(StatusCodes.Status404NotFound, "Post not found");

            var existingLike = await _db.Likes
                .FirstOrDefaultAsync(l => l.PostId == id && l.UserId == userId);

            bool isLikedByMe;

            if (existingLike is not null)
            {
                _db.Likes.Remove(existingLike);
                isLikedByMe = false;
            }
            else
            {
                _db.Likes.Add(new Like
                {
                    PostId = id,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                });
                isLikedByMe = true;
            }

            await _db.SaveChangesAsync();

            if (isLikedByMe)
                await _notifications.NotifyPostLikeAsync(userId, postAuthorId.Value, id);

            var likesCount = await _db.Likes.CountAsync(l => l.PostId == id);

            return Ok(new ApiResponse<object>
            {
                Message = isLikedByMe ? "Post liked successfully" : "Post unliked successfully",
                Data = new { postId = id, likesCount, isLikedByMe }
            });
        }
    }
}
