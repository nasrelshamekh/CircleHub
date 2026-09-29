using CircleHub.Api.Data;
using CircleHub.Api.Dtos;
using CircleHub.Api.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CircleHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SearchController : ControllerBase
    {
        private const int ResultLimit = 20;

        private readonly AppDbContext _db;

        public SearchController(AppDbContext db)
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

        [HttpGet]
        public async Task<IActionResult> Search([FromQuery] string? q = null)
        {
            var currentUserId = CurrentUserId!.Value;
            var query = q?.Trim();

            List<SearchUserDto> users;
            List<CommunityListItemDto> communities;
            List<PostDto> posts;

            if (!string.IsNullOrEmpty(query))
            {
                users = await _db.Users
                    .Where(u => u.Id != currentUserId)
                    .Where(u =>
                        EF.Functions.Like(u.Name, $"%{query}%") ||
                        EF.Functions.Like(u.Username, $"%{query}%") ||
                        EF.Functions.Like(u.JobTitle ?? "", $"%{query}%") ||
                        EF.Functions.Like(u.Location ?? "", $"%{query}%") ||
                        EF.Functions.Like(u.Bio ?? "", $"%{query}%"))
                    .OrderBy(u => u.Name)
                    .Take(ResultLimit)
                    .Select(u => new SearchUserDto
                    {
                        Id = u.Id,
                        Name = u.Name,
                        Username = u.Username,
                        JobTitle = u.JobTitle,
                        AvatarUrl = u.AvatarUrl,
                        CoverImageUrl = u.CoverImageUrl,
                        Bio = u.Bio,
                        Location = u.Location,
                        Website = u.Website,
                        Skills = u.Skills,
                        Gender = u.Gender,
                        DateOfBirth = u.DateOfBirth,
                        CreatedAt = u.CreatedAt,
                        PostsCount = u.Posts.Count,
                        FollowersCount = u.Followers.Count,
                        FollowingCount = u.Following.Count,
                        IsFollowedByMe = u.Followers.Any(f =>
                            f.FollowerId == currentUserId)
                    })
                    .ToListAsync();

                communities = await _db.Communities
                    .Where(c =>
                        EF.Functions.Like(c.Name, $"%{query}%") ||
                        EF.Functions.Like(c.Category, $"%{query}%") ||
                        EF.Functions.Like(c.Description, $"%{query}%"))
                    .OrderByDescending(c => c.CreatedAt)
                    .Take(ResultLimit)
                    .Select(CommunityListItemDto.Projection(currentUserId))
                    .ToListAsync();

                posts = await _db.Posts
                    .WhereVisibleTo(currentUserId)
                    .Where(p =>
                        EF.Functions.Like(p.Content, $"%{query}%") ||
                        EF.Functions.Like(p.Author.Name, $"%{query}%") ||
                        EF.Functions.Like(p.Author.Username, $"%{query}%"))
                    .OrderByDescending(p => p.CreatedAt)
                    .Take(ResultLimit)
                    .Select(PostDto.SearchProjection(currentUserId))
                    .ToListAsync();
            }
            else
            {
                users = await _db.Users
                    .Where(u =>
                        u.Id != currentUserId &&
                        !u.Followers.Any(f => f.FollowerId == currentUserId))
                    .OrderByDescending(u => u.Followers.Count)
                    .Take(ResultLimit)
                    .Select(u => new SearchUserDto
                    {
                        Id = u.Id,
                        Name = u.Name,
                        Username = u.Username,
                        JobTitle = u.JobTitle,
                        AvatarUrl = u.AvatarUrl,
                        CoverImageUrl = u.CoverImageUrl,
                        Bio = u.Bio,
                        Location = u.Location,
                        Website = u.Website,
                        Skills = u.Skills,
                        Gender = u.Gender,
                        DateOfBirth = u.DateOfBirth,
                        CreatedAt = u.CreatedAt,
                        PostsCount = u.Posts.Count,
                        FollowersCount = u.Followers.Count,
                        FollowingCount = u.Following.Count,
                        IsFollowedByMe = false
                    })
                    .ToListAsync();

                communities = await _db.Communities
                    .Where(c =>
                        c.AdminId != currentUserId &&
                        !c.Members.Any(m => m.UserId == currentUserId))
                    .OrderByDescending(c => c.CreatedAt)
                    .Take(ResultLimit)
                    .Select(CommunityListItemDto.Projection(currentUserId))
                    .ToListAsync();

                posts = await _db.Posts
                    .Where(p => p.AuthorId != currentUserId)
                    .WhereVisibleTo(currentUserId)
                    .OrderByDescending(p => p.Likes.Count)
                    .ThenByDescending(p => p.CreatedAt)
                    .Take(ResultLimit)
                    .Select(PostDto.SearchProjection(currentUserId))
                    .ToListAsync();
            }

            return Ok(new ApiResponse<SearchResultDto>
            {
                Data = new SearchResultDto
                {
                    Users = users,
                    Communities = communities,
                    Posts = posts
                }
            });
        }
    }
}
