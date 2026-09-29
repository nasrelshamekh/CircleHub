using CircleHub.Api.Data;
using CircleHub.Api.Dtos;
using CircleHub.Api.Entities;
using CircleHub.Api.Enums;
using CircleHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace CircleHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CommunitiesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly UploadService _uploadService;

        public CommunitiesController(AppDbContext db, UploadService uploadService)
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
                && extension is ".jpg" or ".jpeg" or ".png" or ".gif" or ".webp";
        }

        private void CleanupUploads(params string?[] relatives)
        {
            foreach (var relative in relatives)
            {
                if (relative is not null)
                    _uploadService.DeletePostImage(relative);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetCommunities(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var currentUserId = CurrentUserId!.Value;

            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var total = await _db.Communities.CountAsync();

            var communities = await _db.Communities
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(CommunityListItemDto.Projection(currentUserId))
                .ToListAsync();

            var totalPages = Math.Max(1, (int)Math.Ceiling(total / (double)pageSize));

            return Ok(new ApiResponse<List<CommunityListItemDto>>
            {
                Data = communities,
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

        [HttpGet("categories")]
        public IActionResult GetCommunityCategories()
        {
            var categories = Enum.GetNames<CommunityCategory>().ToList();

            return Ok(new ApiResponse<List<string>>
            {
                Count = categories.Count,
                Data = categories
            });
        }

        [HttpGet("{slug}")]
        public async Task<IActionResult> GetCommunityBySlug(string slug)
        {
            var currentUserId = CurrentUserId!.Value;

            var community = await _db.Communities
                .Where(c => c.Slug == slug)
                .Select(c => new CommunityDetailsDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    Category = c.Category,
                    Description = c.Description,
                    ImageUrl = c.ImageUrl,
                    CoverImageUrl = c.CoverImageUrl,
                    Visibility = c.Visibility.ToString().ToLower(),
                    Admin = new CommunityAdminDto
                    {
                        Id = c.Admin.Id,
                        Name = c.Admin.Name,
                        Username = c.Admin.Username,
                        JobTitle = c.Admin.JobTitle,
                        AvatarUrl = c.Admin.AvatarUrl
                    },
                    Members = c.Members
                        .OrderBy(m => m.JoinedAt)
                        .Select(m => new CommunityMemberDto
                        {
                            MembershipId = m.Id,
                            Id = m.User.Id,
                            Name = m.User.Name,
                            Username = m.User.Username,
                            JobTitle = m.User.JobTitle,
                            AvatarUrl = m.User.AvatarUrl,
                            Location = m.User.Location,
                            CommunityRole = m.Role.ToString().ToLower(),
                            JoinedAt = m.JoinedAt
                        })
                        .ToList(),
                    MembershipStatus =
                        c.AdminId == currentUserId ||
                        c.Members.Any(m => m.UserId == currentUserId)
                            ? "joined"
                            : c.Requests.Any(r =>
                                r.UserId == currentUserId &&
                                r.Status == CommunityJoinRequestStatus.Pending)
                                ? "requested"
                                : "not_joined",
                    CommunityRole =
                        c.AdminId == currentUserId
                            ? "admin"
                            : c.Members
                                .Where(m => m.UserId == currentUserId)
                                .Select(m => m.Role.ToString().ToLower())
                                .FirstOrDefault(),
                    MembersCount = c.Members.Count,
                    PostsCount = c.Posts.Count,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (community is null)
                return Fail(StatusCodes.Status404NotFound, "Community not found");

            return Ok(new ApiResponse<CommunityDetailsDto>
            {
                Data = community
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateCommunity([FromForm] CreateCommunityDto dto)
        {
            var currentUserId = CurrentUserId!.Value;

            var visibility = (dto.Visibility ?? "public").Trim().ToLower();

            if (visibility != "public" && visibility != "private")
                return Fail(
                    StatusCodes.Status400BadRequest,
                    "Visibility must be public or private"
                );

            if (!IsValidCategory(dto.Category))
                return Fail(
                    StatusCodes.Status400BadRequest,
                    "Category is invalid"
                );

            if (dto.ImageUrl is not null && !IsAllowedImageUrl(dto.ImageUrl))
                return Fail(
                    StatusCodes.Status400BadRequest,
                    "Image URL must be a relative /uploads/... path"
                );

            string? imageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl;
            string? coverImageUrl = null;
            string? uploadedImage = null;
            string? uploadedCover = null;

            try
            {
                if (dto.Image is not null && dto.Image.Length > 0)
                {
                    uploadedImage = await _uploadService.SaveCommunityImageAsync(dto.Image);
                    imageUrl = uploadedImage;
                }

                if (dto.CoverImage is not null && dto.CoverImage.Length > 0)
                {
                    uploadedCover = await _uploadService.SaveCommunityImageAsync(dto.CoverImage);
                    coverImageUrl = uploadedCover;
                }
            }
            catch (ArgumentException ex)
            {
                CleanupUploads(uploadedImage, uploadedCover);

                return Fail(StatusCodes.Status400BadRequest, ex.Message);
            }

            var slug = Regex
                .Replace(dto.Name.Trim().ToLower(), "[^a-z0-9]+", "-")
                .Trim('-');

            if (string.IsNullOrEmpty(slug))
                return Fail(
                    StatusCodes.Status400BadRequest,
                    "Community name must be at least 2 characters"
                );

            var existingCommunity = await _db.Communities
                .Where(c => c.Slug == slug)
                .Select(c => c.Id)
                .FirstOrDefaultAsync();

            if (existingCommunity != Guid.Empty)
                return Fail(
                    StatusCodes.Status409Conflict,
                    "A community with this name already exists"
                );

            var community = new Community
            {
                Name = dto.Name.Trim(),
                Slug = slug,
                Category = dto.Category.Trim(),
                Description = dto.Description.Trim(),
                ImageUrl = imageUrl,
                CoverImageUrl = coverImageUrl,
                Visibility = visibility == "private"
                    ? CommunityVisibility.Private
                    : CommunityVisibility.Public,
                AdminId = currentUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Communities.Add(community);

            _db.CommunityMembers.Add(new CommunityMember
            {
                Community = community,
                UserId = currentUserId,
                Role = CommunityRole.Admin,
                JoinedAt = DateTime.UtcNow
            });

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                CleanupUploads(uploadedImage, uploadedCover);

                return Fail(
                    StatusCodes.Status409Conflict,
                    "A community with this name already exists"
                );
            }

            var created = await _db.Communities
                .Where(c => c.Id == community.Id)
                .Select(x => new
                {
                    Id = x.Id,
                    Name = x.Name,
                    Slug = x.Slug,
                    Category = x.Category,
                    Description = x.Description,
                    ImageUrl = x.ImageUrl,
                    CoverImageUrl = x.CoverImageUrl,
                    Visibility = x.Visibility.ToString().ToLower(),
                    Admin = new CommunityAdminDto
                    {
                        Id = x.Admin.Id,
                        Name = x.Admin.Name,
                        Username = x.Admin.Username,
                        JobTitle = x.Admin.JobTitle,
                        AvatarUrl = x.Admin.AvatarUrl
                    },
                    MembersCount = x.Members.Count,
                    PostsCount = x.Posts.Count
                })
                .FirstAsync();

            return StatusCode(StatusCodes.Status201Created, new ApiResponse<object>
            {
                Message = "Community created successfully",
                Data = new
                {
                    created.Id,
                    created.Name,
                    created.Slug,
                    created.Category,
                    created.Description,
                    created.ImageUrl,
                    created.CoverImageUrl,
                    created.Visibility,
                    created.Admin,
                    created.MembersCount,
                    created.PostsCount,
                    MembershipStatus = "joined",
                    CommunityRole = "admin"
                }
            });
        }

        [HttpPatch("{communityId:guid}")]
        public async Task<IActionResult> UpdateCommunity(Guid communityId, [FromForm] UpdateCommunityDto dto)
        {
            var currentUserId = CurrentUserId!.Value;

            var hasImageFile = dto.Image is not null && dto.Image.Length > 0;
            var hasCoverImageFile = dto.CoverImage is not null && dto.CoverImage.Length > 0;

            if (string.IsNullOrWhiteSpace(dto.Name) &&
                string.IsNullOrWhiteSpace(dto.Category) &&
                string.IsNullOrWhiteSpace(dto.Description) &&
                string.IsNullOrWhiteSpace(dto.ImageUrl) &&
                string.IsNullOrWhiteSpace(dto.CoverImageUrl) &&
                string.IsNullOrWhiteSpace(dto.Visibility) &&
                !hasImageFile &&
                !hasCoverImageFile)
            {
                return Fail(
                    StatusCodes.Status400BadRequest,
                    "At least one field must be provided"
                );
            }

            var community = await _db.Communities
                .Where(c => c.Id == communityId)
                .Select(c => new
                {
                    c.Id,
                    c.AdminId
                })
                .FirstOrDefaultAsync();

            if (community is null)
                return Fail(StatusCodes.Status404NotFound, "Community not found");

            if (community.AdminId != currentUserId)
                return Fail(
                    StatusCodes.Status403Forbidden,
                    "Only the community administrator can update the community"
                );

            var entity = await _db.Communities.FirstAsync(c => c.Id == communityId);

            if (dto.Name is not null)
                entity.Name = dto.Name.Trim();
            if (dto.Category is not null)
            {
                if (!IsValidCategory(dto.Category))
                    return Fail(
                        StatusCodes.Status400BadRequest,
                        "Category is invalid"
                    );

                entity.Category = dto.Category.Trim();
            }
            if (dto.Description is not null)
                entity.Description = dto.Description.Trim();
            if (dto.ImageUrl is not null)
            {
                if (!IsAllowedImageUrl(dto.ImageUrl))
                    return Fail(
                        StatusCodes.Status400BadRequest,
                        "Image URL must be a relative /uploads/... path"
                    );

                var imageUrl = dto.ImageUrl.Trim();
                entity.ImageUrl = imageUrl == "" ? null : imageUrl;
            }
            if (dto.CoverImageUrl is not null)
            {
                if (!IsAllowedImageUrl(dto.CoverImageUrl))
                    return Fail(
                        StatusCodes.Status400BadRequest,
                        "Cover image URL must be a relative /uploads/... path"
                    );

                var coverImageUrl = dto.CoverImageUrl.Trim();
                entity.CoverImageUrl = coverImageUrl == "" ? null : coverImageUrl;
            }

            string? uploadedImage = null;
            string? uploadedCover = null;

            try
            {
                if (hasImageFile)
                    uploadedImage = await _uploadService.SaveCommunityImageAsync(dto.Image);

                if (hasCoverImageFile)
                    uploadedCover = await _uploadService.SaveCommunityImageAsync(dto.CoverImage);
            }
            catch (ArgumentException ex)
            {
                CleanupUploads(uploadedImage, uploadedCover);

                return Fail(StatusCodes.Status400BadRequest, ex.Message);
            }

            if (uploadedImage is not null)
                entity.ImageUrl = AbsoluteUrl(uploadedImage);

            if (uploadedCover is not null)
                entity.CoverImageUrl = AbsoluteUrl(uploadedCover);

            if (dto.Visibility is not null)
            {
                var visibility = dto.Visibility.Trim().ToLower();

                if (visibility != "public" && visibility != "private")
                {
                    CleanupUploads(uploadedImage, uploadedCover);

                    return Fail(
                        StatusCodes.Status400BadRequest,
                        "Visibility must be public or private"
                    );
                }

                entity.Visibility = visibility == "private"
                    ? CommunityVisibility.Private
                    : CommunityVisibility.Public;
            }

            entity.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _db.SaveChangesAsync();
            }
            catch
            {
                CleanupUploads(uploadedImage, uploadedCover);
                throw;
            }

            var updated = await _db.Communities
                .Where(c => c.Id == communityId)
                .Select(x => new
                {
                    Id = x.Id,
                    Name = x.Name,
                    Slug = x.Slug,
                    Category = x.Category,
                    Description = x.Description,
                    ImageUrl = x.ImageUrl,
                    CoverImageUrl = x.CoverImageUrl,
                    Visibility = x.Visibility.ToString().ToLower(),
                    Admin = new CommunityAdminDto
                    {
                        Id = x.Admin.Id,
                        Name = x.Admin.Name,
                        Username = x.Admin.Username,
                        JobTitle = x.Admin.JobTitle,
                        AvatarUrl = x.Admin.AvatarUrl
                    },
                    MembersCount = x.Members.Count,
                    PostsCount = x.Posts.Count
                })
                .FirstAsync();

            return Ok(new ApiResponse<object>
            {
                Message = "Community updated successfully",
                Data = new
                {
                    updated.Id,
                    updated.Name,
                    updated.Slug,
                    updated.Category,
                    updated.Description,
                    updated.ImageUrl,
                    updated.CoverImageUrl,
                    updated.Visibility,
                    updated.Admin,
                    updated.MembersCount,
                    updated.PostsCount
                }
            });
        }

        [HttpDelete("{communityId:guid}")]
        public async Task<IActionResult> DeleteCommunity(Guid communityId)
        {
            var currentUserId = CurrentUserId!.Value;

            var community = await _db.Communities
                .Where(c => c.Id == communityId)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.AdminId
                })
                .FirstOrDefaultAsync();

            if (community is null)
                return Fail(StatusCodes.Status404NotFound, "Community not found");

            if (community.AdminId != currentUserId)
                return Fail(
                    StatusCodes.Status403Forbidden,
                    "Only the community administrator can delete the community"
                );

            var entity = await _db.Communities.FirstAsync(c => c.Id == communityId);

            _db.Communities.Remove(entity);

            await _db.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Message = $"{community.Name} deleted successfully",
                Data = new
                {
                    communityId = community.Id
                }
            });
        }

        [HttpPost("{id:guid}/join")]
        public async Task<IActionResult> JoinCommunity(Guid id)
        {
            var currentUserId = CurrentUserId!.Value;

            var community = await _db.Communities
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.AdminId,
                    c.Visibility,
                    IsMember = c.Members.Any(m => m.UserId == currentUserId),
                    ExistingRequest = c.Requests
                        .Where(r => r.UserId == currentUserId)
                        .Select(r => new
                        {
                            r.Id,
                            r.Status
                        })
                        .FirstOrDefault()
                })
                .FirstOrDefaultAsync();

            if (community is null)
                return Fail(StatusCodes.Status404NotFound, "Community not found");

            if (community.AdminId == currentUserId)
                return Fail(
                    StatusCodes.Status409Conflict,
                    "You are already the administrator of this community"
                );

            if (community.IsMember)
                return Fail(StatusCodes.Status409Conflict, "You are already a member");

            if (community.Visibility == CommunityVisibility.Public)
            {
                var oldRequests = await _db.CommunityJoinRequests
                    .Where(r => r.CommunityId == id && r.UserId == currentUserId)
                    .ToListAsync();

                _db.CommunityJoinRequests.RemoveRange(oldRequests);

                _db.CommunityMembers.Add(new CommunityMember
                {
                    CommunityId = id,
                    UserId = currentUserId,
                    Role = CommunityRole.Member,
                    JoinedAt = DateTime.UtcNow
                });

                await _db.SaveChangesAsync();

                return StatusCode(StatusCodes.Status201Created, new ApiResponse<object>
                {
                    Message = $"You joined {community.Name}",
                    Data = new
                    {
                        membershipStatus = "joined",
                        communityRole = "member"
                    }
                });
            }

            if (community.ExistingRequest?.Status == CommunityJoinRequestStatus.Pending)
                return Fail(
                    StatusCodes.Status409Conflict,
                    "You already have a pending request"
                );

            var existingRequest = await _db.CommunityJoinRequests
                .FirstOrDefaultAsync(r =>
                    r.CommunityId == id &&
                    r.UserId == currentUserId);

            if (existingRequest is null)
            {
                _db.CommunityJoinRequests.Add(new CommunityJoinRequest
                {
                    CommunityId = id,
                    UserId = currentUserId,
                    Status = CommunityJoinRequestStatus.Pending,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                existingRequest.Status = CommunityJoinRequestStatus.Pending;
            }

            await _db.SaveChangesAsync();

            return StatusCode(StatusCodes.Status201Created, new ApiResponse<object>
            {
                Message = $"Join request sent to {community.Name}",
                Data = new
                {
                    membershipStatus = "requested",
                    communityRole = (string?)null
                }
            });
        }

        [HttpDelete("{id:guid}/membership")]
        public async Task<IActionResult> LeaveCommunity(Guid id)
        {
            var currentUserId = CurrentUserId!.Value;

            var community = await _db.Communities
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.AdminId,
                    Membership = c.Members
                        .Where(m => m.UserId == currentUserId)
                        .Select(m => new
                        {
                            m.Id
                        })
                        .FirstOrDefault(),
                    PendingRequest = c.Requests
                        .Where(r =>
                            r.UserId == currentUserId &&
                            r.Status == CommunityJoinRequestStatus.Pending)
                        .Select(r => new
                        {
                            r.Id
                        })
                        .FirstOrDefault()
                })
                .FirstOrDefaultAsync();

            if (community is null)
                return Fail(StatusCodes.Status404NotFound, "Community not found");

            if (community.AdminId == currentUserId)
                return Fail(
                    StatusCodes.Status403Forbidden,
                    "The community administrator cannot leave the community"
                );

            var isMember = community.Membership is not null;
            var hasPendingRequest = community.PendingRequest is not null;

            if (!isMember && !hasPendingRequest)
                return Fail(
                    StatusCodes.Status404NotFound,
                    "You are not a member and have no pending request"
                );

            if (isMember)
            {
                var membership = await _db.CommunityMembers
                    .FirstAsync(m => m.Id == community.Membership!.Id);

                _db.CommunityMembers.Remove(membership);
            }

            if (hasPendingRequest)
            {
                var request = await _db.CommunityJoinRequests
                    .FirstAsync(r => r.Id == community.PendingRequest!.Id);

                _db.CommunityJoinRequests.Remove(request);
            }

            await _db.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Message = isMember
                    ? $"You left {community.Name}"
                    : $"Your request to join {community.Name} was cancelled",
                Data = new
                {
                    membershipStatus = "not_joined",
                    communityRole = (string?)null
                }
            });
        }

        [HttpGet("{communityId:guid}/members")]
        public async Task<IActionResult> GetCommunityMembers(Guid communityId)
        {
            var community = await _db.Communities
                .Where(c => c.Id == communityId)
                .Select(c => new
                {
                    c.Id,
                    c.Visibility,
                    IsMember =
                        c.AdminId == CurrentUserId ||
                        c.Members.Any(m => m.UserId == CurrentUserId)
                })
                .FirstOrDefaultAsync();

            if (community is null)
                return Fail(StatusCodes.Status404NotFound, "Community not found");

            if (
                community.Visibility == CommunityVisibility.Private &&
                !community.IsMember
            )
                return Fail(
                    StatusCodes.Status403Forbidden,
                    "You must be a community member to view its members"
                );

            var members = await _db.CommunityMembers
                .Where(m => m.CommunityId == communityId)
                .OrderBy(m => m.JoinedAt)
                .Select(m => new CommunityMemberDto
                {
                    MembershipId = m.Id,
                    Id = m.User.Id,
                    Name = m.User.Name,
                    Username = m.User.Username,
                    JobTitle = m.User.JobTitle,
                    AvatarUrl = m.User.AvatarUrl,
                    Location = m.User.Location,
                    CommunityRole = m.Role.ToString().ToLower(),
                    JoinedAt = m.JoinedAt
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<CommunityMemberDto>>
            {
                Count = members.Count,
                Data = members
            });
        }

        [HttpGet("{id:guid}/requests")]
        public async Task<IActionResult> GetCommunityJoinRequests(Guid id)
        {
            var currentUserId = CurrentUserId!.Value;

            var community = await _db.Communities
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    c.Id,
                    c.AdminId,
                    IsModerator = c.Members.Any(m =>
                        m.UserId == currentUserId &&
                        m.Role == CommunityRole.Moderator)
                })
                .FirstOrDefaultAsync();

            if (community is null)
                return Fail(StatusCodes.Status404NotFound, "Community not found");

            var isAdmin = community.AdminId == currentUserId;

            if (!isAdmin && !community.IsModerator)
                return Fail(
                    StatusCodes.Status403Forbidden,
                    "You are not allowed to view join requests"
                );

            var requests = await _db.CommunityJoinRequests
                .Where(r =>
                    r.CommunityId == id &&
                    r.Status == CommunityJoinRequestStatus.Pending)
                .OrderBy(r => r.CreatedAt)
                .Select(r => new CommunityJoinRequestDto
                {
                    Id = r.Id,
                    Note = r.Note,
                    Status = r.Status.ToString().ToLower(),
                    CreatedAt = r.CreatedAt,
                    User = new CommunityRequestUserDto
                    {
                        Id = r.User.Id,
                        Name = r.User.Name,
                        Username = r.User.Username,
                        JobTitle = r.User.JobTitle,
                        AvatarUrl = r.User.AvatarUrl
                    }
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<CommunityJoinRequestDto>>
            {
                Count = requests.Count,
                Data = requests
            });
        }

        [HttpPatch("{communityId:guid}/requests/{requestId:guid}")]
        public async Task<IActionResult> DecideCommunityJoinRequest(
            Guid communityId,
            Guid requestId,
            DecideCommunityJoinRequestDto dto)
        {
            var currentUserId = CurrentUserId!.Value;

            var decision = dto.Decision.Trim().ToLower();

            if (decision != "approve" && decision != "reject")
                return Fail(
                    StatusCodes.Status400BadRequest,
                    "Decision must be approve or reject"
                );

            var community = await _db.Communities
                .Where(c => c.Id == communityId)
                .Select(c => new
                {
                    c.Id,
                    c.AdminId,
                    IsModerator = c.Members.Any(m =>
                        m.UserId == currentUserId &&
                        m.Role == CommunityRole.Moderator)
                })
                .FirstOrDefaultAsync();

            if (community is null)
                return Fail(StatusCodes.Status404NotFound, "Community not found");

            var isAdmin = community.AdminId == currentUserId;

            if (!isAdmin && !community.IsModerator)
                return Fail(
                    StatusCodes.Status403Forbidden,
                    "You are not authorized to review join requests"
                );

            var joinRequest = await _db.CommunityJoinRequests
                .FirstOrDefaultAsync(r =>
                    r.Id == requestId &&
                    r.CommunityId == communityId);

            if (joinRequest is null)
                return Fail(StatusCodes.Status404NotFound, "Join request not found");

            if (joinRequest.Status != CommunityJoinRequestStatus.Pending)
                return Fail(
                    StatusCodes.Status409Conflict,
                    "Join request has already been processed"
                );

            if (decision == "reject")
            {
                joinRequest.Status = CommunityJoinRequestStatus.Rejected;

                await _db.SaveChangesAsync();

                return Ok(new ApiResponse<object>
                {
                    Message = "Join request rejected successfully",
                    Data = new
                    {
                        membership = (object?)null,
                        request = new
                        {
                            id = joinRequest.Id,
                            status = "rejected"
                        }
                    }
                });
            }

            var alreadyMember = await _db.CommunityMembers
                .AnyAsync(m =>
                    m.CommunityId == communityId &&
                    m.UserId == joinRequest.UserId);

            if (alreadyMember)
                return Fail(
                    StatusCodes.Status409Conflict,
                    "User is already a community member"
                );

            joinRequest.Status = CommunityJoinRequestStatus.Approved;

            var newMember = new CommunityMember
            {
                CommunityId = communityId,
                UserId = joinRequest.UserId,
                Role = CommunityRole.Member,
                JoinedAt = DateTime.UtcNow
            };

            _db.CommunityMembers.Add(newMember);

            await _db.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Message = "Join request approved successfully",
                Data = new
                {
                    membership = new
                    {
                        id = newMember.Id,
                        communityId = newMember.CommunityId,
                        userId = newMember.UserId,
                        role = "member",
                        joinedAt = newMember.JoinedAt
                    },
                    request = new
                    {
                        id = joinRequest.Id,
                        status = "approved"
                    }
                }
            });
        }

        [HttpDelete("{communityId:guid}/members/{membershipId:guid}")]
        public async Task<IActionResult> RemoveCommunityMember(
    Guid communityId,
    Guid membershipId)
        {
            var currentUserId = CurrentUserId!.Value;

            var community = await _db.Communities
                .Where(c => c.Id == communityId)
                .Select(c => new
                {
                    c.Id,
                    c.AdminId,
                    IsModerator = c.Members.Any(m =>
                        m.UserId == currentUserId &&
                        m.Role == CommunityRole.Moderator)
                })
                .FirstOrDefaultAsync();

            if (community is null)
                return Fail(StatusCodes.Status404NotFound, "Community not found");

            var isAdmin = community.AdminId == currentUserId;

            if (!isAdmin && !community.IsModerator)
                return Fail(
                    StatusCodes.Status403Forbidden,
                    "You are not authorized to remove community members"
                );

            var targetMembership = await _db.CommunityMembers
                .FirstOrDefaultAsync(m =>
                    m.Id == membershipId &&
                    m.CommunityId == communityId);

            if (targetMembership is null)
                return Fail(StatusCodes.Status404NotFound, "Community member not found");

            if (targetMembership.UserId == community.AdminId)
                return Fail(
                    StatusCodes.Status403Forbidden,
                    "The community administrator cannot be removed"
                );

            if (targetMembership.UserId == currentUserId)
                return Fail(
                    StatusCodes.Status400BadRequest,
                    "Use the leave community endpoint to remove yourself"
                );

            if (
                community.IsModerator &&
                !isAdmin &&
                targetMembership.Role != CommunityRole.Member
            )
                return Fail(
                    StatusCodes.Status403Forbidden,
                    "Moderators can only remove regular members"
                );

            _db.CommunityMembers.Remove(targetMembership);

            await _db.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Message = "Community member removed successfully",
                Data = new
                {
                    membership = new
                    {
                        id = targetMembership.Id,
                        communityId = targetMembership.CommunityId,
                        userId = targetMembership.UserId,
                        role = targetMembership.Role.ToString().ToLower()
                    }
                }
            });
        }

        [HttpPatch("{communityId:guid}/members/{membershipId:guid}/role")]
        public async Task<IActionResult> UpdateCommunityMemberRole(
    Guid communityId,
    Guid membershipId,
    UpdateCommunityMemberRoleDto dto)
        {
            var currentUserId = CurrentUserId!.Value;

            var role = dto.Role.Trim().ToLower();

            if (role != "member" && role != "moderator")
                return Fail(
                    StatusCodes.Status400BadRequest,
                    "Role must be member or moderator"
                );

            var community = await _db.Communities
                .Where(c => c.Id == communityId)
                .Select(c => new
                {
                    c.Id,
                    c.AdminId
                })
                .FirstOrDefaultAsync();

            if (community is null)
                return Fail(StatusCodes.Status404NotFound, "Community not found");

            if (community.AdminId != currentUserId)
                return Fail(
                    StatusCodes.Status403Forbidden,
                    "Only the community administrator can change member roles"
                );

            var targetMembership = await _db.CommunityMembers
                .FirstOrDefaultAsync(m =>
                    m.Id == membershipId &&
                    m.CommunityId == communityId);

            if (targetMembership is null)
                return Fail(StatusCodes.Status404NotFound, "Community member not found");

            if (
                targetMembership.UserId == community.AdminId ||
                targetMembership.Role == CommunityRole.Admin
            )
                return Fail(
                    StatusCodes.Status403Forbidden,
                    "The community administrator's role cannot be changed"
                );

            var newRole = role == "moderator"
                ? CommunityRole.Moderator
                : CommunityRole.Member;

            if (targetMembership.Role == newRole)
                return Fail(
                    StatusCodes.Status409Conflict,
                    $"Community member already has the {role} role"
                );

            targetMembership.Role = newRole;

            await _db.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Message = "Community member role updated successfully",
                Data = new
                {
                    membership = new
                    {
                        id = targetMembership.Id,
                        communityId = targetMembership.CommunityId,
                        userId = targetMembership.UserId,
                        role = targetMembership.Role.ToString().ToLower(),
                        joinedAt = targetMembership.JoinedAt
                    }
                }
            });
        }

        [HttpGet("{communityId:guid}/posts")]
        public async Task<IActionResult> GetCommunityPosts(Guid communityId)
        {
            var currentUserId = CurrentUserId!.Value;

            var community = await _db.Communities
                .Where(c => c.Id == communityId)
                .Select(c => new
                {
                    c.Id,
                    c.Visibility,
                    IsMember =
                        c.AdminId == currentUserId ||
                        c.Members.Any(m => m.UserId == currentUserId)
                })
                .FirstOrDefaultAsync();

            if (community is null)
                return Fail(StatusCodes.Status404NotFound, "Community not found");

            if (
                community.Visibility == CommunityVisibility.Private &&
                !community.IsMember
            )
                return Fail(
                    StatusCodes.Status403Forbidden,
                    "You must be a community member to view its posts"
                );

            var posts = await _db.Posts
                .Where(p => p.CommunityId == communityId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(PostDto.Projection(currentUserId))
                .ToListAsync();

            return Ok(new ApiResponse<List<PostDto>>
            {
                Count = posts.Count,
                Data = posts
            });
        }

        [HttpPost("{communityId:guid}/posts")]
        public async Task<IActionResult> CreateCommunityPost(Guid communityId, [FromForm] CreatePostDto dto)
        {
            var currentUserId = CurrentUserId!.Value;

            var community = await _db.Communities
                .Where(c => c.Id == communityId)
                .Select(c => new
                {
                    c.Id,
                    IsMember =
                        c.AdminId == currentUserId ||
                        c.Members.Any(m => m.UserId == currentUserId)
                })
                .FirstOrDefaultAsync();

            if (community is null)
                return Fail(StatusCodes.Status404NotFound, "Community not found");

            if (!community.IsMember)
                return Fail(
                    StatusCodes.Status403Forbidden,
                    "You must be a community member to create posts"
                );

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
                CommunityId = communityId,
                AuthorId = currentUserId,
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
                .Select(PostDto.Projection(currentUserId))
                .FirstAsync();

            return StatusCode(StatusCodes.Status201Created, new ApiResponse<PostDto>
            {
                Message = "Community post created successfully",
                Data = created
            });
        }

        [HttpDelete("{communityId:guid}/posts/{postId:guid}")]
        public async Task<IActionResult> DeleteCommunityPost(Guid communityId, Guid postId)
        {
            var currentUserId = CurrentUserId!.Value;

            var community = await _db.Communities
                .Where(c => c.Id == communityId)
                .Select(c => new
                {
                    c.Id,
                    c.AdminId,
                    IsModerator = c.Members.Any(m =>
                        m.UserId == currentUserId &&
                        m.Role == CommunityRole.Moderator)
                })
                .FirstOrDefaultAsync();

            if (community is null)
                return Fail(StatusCodes.Status404NotFound, "Community not found");

            var isAdmin = community.AdminId == currentUserId;
            var isModerator = community.IsModerator;

            var post = await _db.Posts
                .Where(p => p.Id == postId && p.CommunityId == communityId)
                .Select(p => new
                {
                    p.Id,
                    p.AuthorId
                })
                .FirstOrDefaultAsync();

            if (post is null)
                return Fail(StatusCodes.Status404NotFound, "Community post not found");

            var isPostAuthor = post.AuthorId == currentUserId;
            var isModerationAction = !isPostAuthor && (isAdmin || isModerator);

            if (!isPostAuthor && !isAdmin && !isModerator)
                return Fail(
                    StatusCodes.Status403Forbidden,
                    "You are not authorized to delete this community post"
                );

            Guid? moderationLogId = null;

            if (isModerationAction)
            {
                var moderationLog = new CommunityPostModerationLog
                {
                    CommunityId = communityId,
                    PostId = post.Id,
                    PostAuthorId = post.AuthorId,
                    ActorId = currentUserId,
                    Action = CommunityModerationAction.PostDeleted,
                    CreatedAt = DateTime.UtcNow
                };

                _db.CommunityModerationLogs.Add(moderationLog);
                await _db.SaveChangesAsync();

                moderationLogId = moderationLog.Id;
            }

            var postEntity = await _db.Posts.FirstAsync(p => p.Id == postId);
            _db.Posts.Remove(postEntity);
            await _db.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Message = "Community post deleted successfully",
                Data = new
                {
                    postId,
                    communityId,
                    moderationLogId
                }
            });
        }

        private static bool IsValidCategory(string? category) =>
            !string.IsNullOrWhiteSpace(category) &&
            Enum.GetNames<CommunityCategory>().Any(name =>
                string.Equals(name, category.Trim(), StringComparison.OrdinalIgnoreCase));

        private string AbsoluteUrl(string relative) =>
            $"{Request.Scheme}://{Request.Host}{relative}";
    }
}
