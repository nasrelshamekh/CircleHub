using CircleHub.Api.Data;
using CircleHub.Api.Dtos;
using CircleHub.Api.Entities;
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
                users = await SearchUsersAsync(
                    _db.Users
                        .Where(u => u.Id != currentUserId)
                        .Where(u =>
                            EF.Functions.Like(u.Name, $"%{query}%") ||
                            EF.Functions.Like(u.Username, $"%{query}%") ||
                            EF.Functions.Like(u.JobTitle ?? "", $"%{query}%") ||
                            EF.Functions.Like(u.Location ?? "", $"%{query}%") ||
                            EF.Functions.Like(u.Bio ?? "", $"%{query}%"))
                        .OrderBy(u => u.Name)
                        .Take(ResultLimit),
                    currentUserId);

                communities = await _db.Communities
                    .Where(c => c.Visibility == CommunityVisibility.Public ||
                                c.AdminId == currentUserId ||
                                c.Members.Any(m => m.UserId == currentUserId))
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
                users = await SearchUsersAsync(
                    _db.Users
                        .Where(u =>
                            u.Id != currentUserId &&
                            !u.Followers.Any(f => f.FollowerId == currentUserId))
                        .OrderByDescending(u => u.Followers.Count)
                        .Take(ResultLimit),
                    currentUserId);

                communities = await _db.Communities
                    .Where(c => c.Visibility == CommunityVisibility.Public)
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

        /// <summary>
        /// Projects users into search results, dropping the About-tab details (website,
        /// gender, date of birth) from accounts whose profile the viewer may not open.
        /// Everything else on the card stays public so locked accounts remain discoverable.
        /// </summary>
        private static async Task<List<SearchUserDto>> SearchUsersAsync(
            IQueryable<User> users,
            Guid currentUserId)
        {
            var results = await users
                .Select(u => new
                {
                    // UserVisibility.CanViewContent, inlined because EF cannot translate a
                    // method call inside a projection. These queries always exclude the
                    // viewer, so the "owner" branch of the rule never applies here.
                    CanViewContent =
                        u.ProfileVisibility == ProfileVisibility.Public ||
                        (u.ProfileVisibility == ProfileVisibility.Followers &&
                         u.Followers.Any(f => f.FollowerId == currentUserId)),
                    Result = new SearchUserDto
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
                    }
                })
                .ToListAsync();

            foreach (var result in results)
                UserVisibility.StripLockedDetails(result.Result, result.CanViewContent);

            return results.Select(result => result.Result).ToList();
        }
    }
}
