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
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly Services.UploadService _uploadService;

        public UsersController(AppDbContext db, Services.UploadService uploadService)
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

        private static bool IsAllowedImageUrl(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return true;

            var extension = Path.GetExtension(url).ToLowerInvariant();

            return url.StartsWith("/uploads/", StringComparison.Ordinal)
                && !url.Contains("..")
                && extension is ".jpg" or ".jpeg" or ".png" or ".webp";
        }

        private void CleanupUploads(params string?[] relatives)
        {
            foreach (var relative in relatives)
            {
                if (relative is not null)
                    _uploadService.DeletePostImage(relative);
            }
        }

        [HttpGet("suggested")]
        public async Task<IActionResult> GetSuggestedUsers()
        {
            var currentUserId = CurrentUserId!.Value;

            var excludeIds = await _db.Follows
                .Where(f => f.FollowerId == currentUserId)
                .Select(f => f.FollowingId)
                .ToListAsync();

            excludeIds.Add(currentUserId);

            var users = await _db.Users
                .Where(u => !excludeIds.Contains(u.Id))
                .OrderByDescending(u => u.CreatedAt)
                .Take(10)
                .Select(u => new SuggestedUserDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Username = u.Username,
                    JobTitle = u.JobTitle,
                    AvatarUrl = u.AvatarUrl,
                    Location = u.Location,
                })
                .ToListAsync();
            return Ok(new ApiResponse<List<SuggestedUserDto>>
            {
                Count = users.Count,
                Data = users
            });
        }
        [HttpGet("{username}")]
        public async Task<IActionResult> GetUserProfile(string username)
        {
            var currentUserId = CurrentUserId!.Value;

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
                return Fail(StatusCodes.Status404NotFound, "User not found");

            var isCurrentUser = user.Id == currentUserId;

            var followersCount = await _db.Follows.CountAsync(f => f.FollowingId == user.Id);
            var followingCount = await _db.Follows.CountAsync(f => f.FollowerId == user.Id);
            var postsCount = await _db.Posts
                .Where(p => p.AuthorId == user.Id)
                .WhereVisibleTo(currentUserId)
                .CountAsync();

            var isFollowedByMe = !isCurrentUser && await _db.Follows
                .AnyAsync(f => f.FollowerId == currentUserId && f.FollowingId == user.Id);

            var followsMe = !isCurrentUser && await _db.Follows
                .AnyAsync(f => f.FollowerId == user.Id && f.FollowingId == currentUserId);

            return Ok(new ApiResponse<UserProfileDto>
            {
                Data = new UserProfileDto
                {
                    Id = user.Id,
                    Name = user.Name,
                    Username = user.Username,
                    JobTitle = user.JobTitle,
                    AvatarUrl = user.AvatarUrl,
                    CoverImageUrl = user.CoverImageUrl,
                    Bio = user.Bio,
                    Location = user.Location,
                    Website = user.Website,
                    Skills = user.Skills,
                    Gender = user.Gender,
                    DateOfBirth = user.DateOfBirth,
                    CreatedAt = user.CreatedAt,

                    FollowersCount = followersCount,
                    FollowingCount = followingCount,
                    PostsCount = postsCount,
                    IsCurrentUser = isCurrentUser,
                    IsFollowedByMe = isFollowedByMe,
                    FollowsMe = followsMe
                }
            });
        }

        [HttpGet("{username}/posts")]
        public async Task<IActionResult> GetUserPosts(string username)
        {
            var currentUserId = CurrentUserId!.Value;

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
                return Fail(StatusCodes.Status404NotFound, "User not found");

            var userPosts = await _db.Posts
                .Where(p => p.AuthorId == user.Id)
                .WhereVisibleTo(currentUserId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(PostDto.Projection(currentUserId, includeCommunity: true))
                .ToListAsync();

            return Ok(new ApiResponse<List<PostDto>>
            {
                Count = userPosts.Count,
                Data = userPosts
            });

        }

        [HttpGet("{username}/liked-posts")]
        public async Task<IActionResult> GetUserLikedPosts(string username)
        {
            var currentUserId = CurrentUserId!.Value;

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
                return Fail(StatusCodes.Status404NotFound, "User not found");

            var likedPosts = await _db.Likes
                .Where(l => l.UserId == user.Id)
                .Where(l => _db.Posts
                    .Where(p => p.Id == l.PostId)
                    .WhereVisibleTo(currentUserId)
                    .Any())
                .OrderByDescending(l => l.CreatedAt)
                .Select(l => l.Post)
                .Select(PostDto.Projection(currentUserId, includeCommunity: true))
                .ToListAsync();

            return Ok(new ApiResponse<List<PostDto>>
            {
                Count = likedPosts.Count,
                Data = likedPosts
            });
        }

        [HttpGet("{username}/communities")]
        public async Task<IActionResult> GetUserCommunities(string username)
        {
            var currentUserId = CurrentUserId!.Value;

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
                return Fail(StatusCodes.Status404NotFound, "User not found");

            var memberships = await _db.CommunityMembers
                .Where(m => m.UserId == user.Id)
                .OrderBy(m => m.JoinedAt)
                .Select(m => new UserCommunityDto
                {
                    Id = m.Community.Id,
                    Name = m.Community.Name,
                    Slug = m.Community.Slug,
                    Category = m.Community.Category,
                    Description = m.Community.Description,
                    ImageUrl = m.Community.ImageUrl,
                    Visibility = m.Community.Visibility.ToString().ToLower(),
                    Admin = new CommunityAdminDto
                    {
                        Id = m.Community.Admin.Id,
                        Name = m.Community.Admin.Name,
                        Username = m.Community.Admin.Username,
                        JobTitle = m.Community.Admin.JobTitle,
                        AvatarUrl = m.Community.Admin.AvatarUrl
                    },
                    UserRole = m.Role.ToString().ToLower(),
                    MembershipStatus =
                        m.Community.AdminId == currentUserId ||
                        m.Community.Members.Any(mem => mem.UserId == currentUserId)
                            ? "joined"
                            : m.Community.Requests.Any(r =>
                                r.UserId == currentUserId &&
                                r.Status == CommunityJoinRequestStatus.Pending)
                                ? "requested"
                                : "not_joined",
                    MembersCount = m.Community.Members.Count,
                    PostsCount = m.Community.Posts.Count
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<UserCommunityDto>>
            {
                Count = memberships.Count,
                Data = memberships
            });
        }

        [HttpGet("{username}/followers")]
        public async Task<IActionResult> GetUserFollowers(string username)
        {
            var currentUserId = CurrentUserId!.Value;

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
                return Fail(StatusCodes.Status404NotFound, "User not found");

            var followers = await _db.Follows
                .Where(f => f.FollowingId == user.Id)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new FollowUserDto
                {
                    Id = f.Follower.Id,
                    Name = f.Follower.Name,
                    Username = f.Follower.Username,
                    JobTitle = f.Follower.JobTitle,
                    Bio = f.Follower.Bio,
                    Location = f.Follower.Location,
                    AvatarUrl = f.Follower.AvatarUrl,
                    FollowersCount = f.Follower.Followers.Count,
                    IsFollowedByMe = f.Follower.Followers.Any(fol => fol.FollowerId == currentUserId),
                    IsCurrentUser = f.Follower.Id == currentUserId
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<FollowUserDto>>
            {
                Count = followers.Count,
                Data = followers
            });
        }

        [HttpGet("{username}/following")]
        public async Task<IActionResult> GetUserFollowing(string username)
        {
            var currentUserId = CurrentUserId!.Value;

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
                return Fail(StatusCodes.Status404NotFound, "User not found");

            var following = await _db.Follows
                .Where(f => f.FollowerId == user.Id)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new FollowUserDto
                {
                    Id = f.Following.Id,
                    Name = f.Following.Name,
                    Username = f.Following.Username,
                    JobTitle = f.Following.JobTitle,
                    Bio = f.Following.Bio,
                    Location = f.Following.Location,
                    AvatarUrl = f.Following.AvatarUrl,
                    FollowersCount = f.Following.Followers.Count,
                    IsFollowedByMe = f.Following.Followers.Any(fol => fol.FollowerId == currentUserId),
                    IsCurrentUser = f.Following.Id == currentUserId
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<FollowUserDto>>
            {
                Count = following.Count,
                Data = following
            });
        }

        [HttpPatch("me")]
        public async Task<IActionResult> UpdateMyProfile([FromForm] UpdateProfileDto dto)
        {
            var currentUserId = CurrentUserId!.Value;

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == currentUserId);

            if (user == null)
                return Fail(StatusCodes.Status404NotFound, "User not found");

            if (dto.Name is not null)
                user.Name = dto.Name;
            if (dto.JobTitle is not null)
                user.JobTitle = dto.JobTitle;
            if (dto.Bio is not null)
                user.Bio = dto.Bio;
            if (dto.Location is not null)
                user.Location = dto.Location;
            if (dto.Website is not null)
                user.Website = dto.Website;
            if (dto.AvatarUrl is not null)
            {
                if (!IsAllowedImageUrl(dto.AvatarUrl))
                    return Fail(
                        StatusCodes.Status400BadRequest,
                        "Avatar URL must be a relative /uploads/... path"
                    );

                user.AvatarUrl = dto.AvatarUrl;
            }
            if (dto.CoverImageUrl is not null)
            {
                if (!IsAllowedImageUrl(dto.CoverImageUrl))
                    return Fail(
                        StatusCodes.Status400BadRequest,
                        "Cover image URL must be a relative /uploads/... path"
                    );

                user.CoverImageUrl = dto.CoverImageUrl;
            }
            if (dto.Gender is not null)
                user.Gender = dto.Gender;
            if (dto.DateOfBirth is not null)
                user.DateOfBirth = dto.DateOfBirth;
            if (dto.Skills is not null)
                user.Skills = dto.Skills;

            string? avatarRelative = null;
            string? coverRelative = null;

            try
            {
                if (dto.AvatarImage is not null)
                    avatarRelative = await _uploadService.SaveUserImageAsync(dto.AvatarImage);
                if (dto.CoverImage is not null)
                    coverRelative = await _uploadService.SaveUserImageAsync(dto.CoverImage);
            }
            catch (ArgumentException ex)
            {
                CleanupUploads(avatarRelative, coverRelative);

                return Fail(StatusCodes.Status400BadRequest, ex.Message);
            }

            if (avatarRelative is not null)
                user.AvatarUrl = avatarRelative;
            if (coverRelative is not null)
                user.CoverImageUrl = coverRelative;

            user.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _db.SaveChangesAsync();
            }
            catch
            {
                CleanupUploads(avatarRelative, coverRelative);
                throw;
            }

            return Ok(new ApiResponse<UserDto>
            {
                Message = "Profile updated successfully",
                Data = UserDto.FromEntity(user)
            });
        }

        [HttpPost("{id}/follow")]
        public async Task<IActionResult> FollowUser(Guid id)
        {
            var currentUserId = CurrentUserId!.Value;

            if (id == currentUserId)
                return Fail(StatusCodes.Status400BadRequest, "You cannot follow yourself");

            var targetExists = await _db.Users.AnyAsync(u => u.Id == id);
            if (!targetExists)
                return Fail(StatusCodes.Status404NotFound, "User not found");

            var alreadyFollowing = await _db.Follows
                .AnyAsync(f => f.FollowerId == currentUserId && f.FollowingId == id);
            if (alreadyFollowing)
                return Fail(StatusCodes.Status409Conflict, "You already follow this user");

            _db.Follows.Add(new Follow
            {
                FollowerId = currentUserId,
                FollowingId = id,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            var followersCount = await _db.Follows.CountAsync(f => f.FollowingId == id);

            return StatusCode(StatusCodes.Status201Created, new ApiResponse<object>
            {
                Message = "User followed successfully",
                Data = new { userId = id, isFollowedByMe = true, followersCount }
            });
        }
        [HttpDelete("{id}/follow")]
        public async Task<IActionResult> UnFollowUser(Guid id)
        {
            var currentUserId = CurrentUserId!.Value;

            if (id == currentUserId)
                return Fail(StatusCodes.Status400BadRequest, "You cannot unfollow yourself");

            var targetExists = await _db.Users.AnyAsync(u => u.Id == id);

            if (!targetExists)
                return Fail(StatusCodes.Status404NotFound, "User not found");

            var follow = await _db.Follows
                .FirstOrDefaultAsync(f =>
                    f.FollowerId == currentUserId &&
                    f.FollowingId == id);

            if (follow == null)
                return Fail(StatusCodes.Status404NotFound, "You do not follow this user");

            _db.Follows.Remove(follow);

            await _db.SaveChangesAsync();

            var followersCount = await _db.Follows
                .CountAsync(f => f.FollowingId == id);

            return Ok(new ApiResponse<object>
            {
                Message = "User unfollowed successfully",
                Data = new
                {
                    userId = id,
                    isFollowedByMe = false,
                    followersCount
                }
            });
        }
    }
}
