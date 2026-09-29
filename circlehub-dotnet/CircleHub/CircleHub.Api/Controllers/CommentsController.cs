using CircleHub.Api.Data;
using CircleHub.Api.Dtos;
using CircleHub.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CircleHub.Api.Controllers
{
    [ApiController]
    [Route("api/posts/{postId}/comments")]
    public class CommentsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public CommentsController(AppDbContext db)
        {
            _db = db;
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
        public async Task<IActionResult> GetComments(Guid postId)
        {
            var postVisible = await _db.Posts
                .Where(p => p.Id == postId)
                .WhereVisibleTo(CurrentUserId)
                .AnyAsync();

            if (!postVisible)
                return Fail(StatusCodes.Status404NotFound, "Post not found");

            var comments = await _db.Comments
                .Where(c => c.PostId == postId)
                .OrderBy(c => c.CreatedAt)
                .Select(CommentDto.Projection)
                .ToListAsync();

            return Ok(new ApiResponse<List<CommentDto>>
            {
                Count = comments.Count,
                Data = comments
            });
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddComment(Guid postId, CreateCommentDto dto)
        {
            var postVisible = await _db.Posts
                .Where(p => p.Id == postId)
                .WhereVisibleTo(CurrentUserId)
                .AnyAsync();
            if (!postVisible)
                return Fail(StatusCodes.Status404NotFound, "Post not found");

            var userId = CurrentUserId!.Value;

            var comment = new Comment
            {
                Content = dto.Content,
                PostId = postId,
                AuthorId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Comments.Add(comment);
            await _db.SaveChangesAsync();

            var created = await _db.Comments
                .Where(c => c.Id == comment.Id)
                .Select(CommentDto.Projection)
                .FirstAsync();

            var commentsCount = await _db.Comments.CountAsync(c => c.PostId == postId);

            return StatusCode(StatusCodes.Status201Created, new ApiResponse<object>
            {
                Message = "Comment added successfully",
                Data = new { comment = created, postId, commentsCount }
            });
        }

        [Authorize]
        [HttpDelete("{commentId}")]
        public async Task<IActionResult> DeleteComment(Guid postId, Guid commentId)
        {
            var userId = CurrentUserId!.Value;

            var comment = await _db.Comments
                .FirstOrDefaultAsync(c => c.Id == commentId && c.PostId == postId);

            if (comment is null)
                return Fail(StatusCodes.Status404NotFound, "Comment not found");

            if (comment.AuthorId != userId)
                return Fail(StatusCodes.Status403Forbidden, "You are not allowed to delete this comment");

            _db.Comments.Remove(comment);
            await _db.SaveChangesAsync();

            var commentsCount = await _db.Comments.CountAsync(c => c.PostId == postId);

            return Ok(new ApiResponse<object>
            {
                Message = "Comment deleted successfully",
                Data = new { postId, commentId, commentsCount }
            });
        }
    }
}
