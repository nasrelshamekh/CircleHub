using CircleHub.Api.Data;
using CircleHub.Api.Dtos;
using CircleHub.Api.Entities;
using CircleHub.Api.Enums;
using CircleHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CircleHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly UploadService _uploadService;

        public PostsController(AppDbContext db, UploadService uploadService)
        {
            _db = db;
            _uploadService = uploadService;
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

            return Ok(new ApiResponse<PostDto> { Data = post });
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreatePost([FromForm] CreatePostDto dto)
        {
            var userId = CurrentUserId!.Value;

            string? imageUrl;
            try
            {
                imageUrl = await _uploadService.SavePostImageAsync(dto.Image);
            }
            catch (ArgumentException ex)
            {
                return Fail(StatusCodes.Status400BadRequest, ex.Message);
            }

            var post = new Post
            {
                Content = dto.Content,
                ImageUrl = imageUrl is null ? null : AbsoluteUrl(imageUrl),
                AuthorId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Posts.Add(post);

            try
            {
                await _db.SaveChangesAsync();
            }
            catch
            {
                if (imageUrl is not null)
                    _uploadService.DeletePostImage(imageUrl);
                throw;
            }

            var created = await _db.Posts
                .Where(p => p.Id == post.Id)
                .Select(PostDto.Projection(userId))
                .FirstAsync();

            return StatusCode(StatusCodes.Status201Created, new ApiResponse<PostDto>
            {
                Message = "Post created successfully",
                Data = created
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
                    _uploadService.DeletePostImage(new Uri(post.ImageUrl).AbsolutePath);

                post.ImageUrl = AbsoluteUrl(newImageRelative);
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
                    _uploadService.DeletePostImage(newImageRelative);
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

            var postExists = await _db.Posts.AnyAsync(p => p.Id == id);
            if (!postExists)
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

            var likesCount = await _db.Likes.CountAsync(l => l.PostId == id);

            return Ok(new ApiResponse<object>
            {
                Message = isLikedByMe ? "Post liked successfully" : "Post unliked successfully",
                Data = new { postId = id, likesCount, isLikedByMe }
            });
        }

        private string AbsoluteUrl(string relative) =>
            $"{Request.Scheme}://{Request.Host}{relative}";
    }
}
