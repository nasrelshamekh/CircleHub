using System.ComponentModel.DataAnnotations;
using System.Linq.Expressions;
using CircleHub.Api.Entities;
using CircleHub.Api.Enums;
using Microsoft.AspNetCore.Http;

namespace CircleHub.Api.Dtos
{
    public class CommunityListItemDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? CoverImageUrl { get; set; }
        public string Visibility { get; set; } = string.Empty;
        public CommunityAdminDto Admin { get; set; } = null!;
        public string MembershipStatus { get; set; } = string.Empty;
        public string? ViewerRole { get; set; }
        public int MembersCount { get; set; }
        public int PostsCount { get; set; }

        public static Expression<Func<Community, CommunityListItemDto>> Projection(Guid currentUserId) =>
            c => new CommunityListItemDto
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
                MembershipStatus =
                    c.AdminId == currentUserId ||
                    c.Members.Any(m => m.UserId == currentUserId)
                        ? "joined"
                        : c.Requests.Any(r =>
                            r.UserId == currentUserId &&
                            r.Status == CommunityJoinRequestStatus.Pending)
                            ? "requested"
                            : "not_joined",
                ViewerRole =
                    c.AdminId == currentUserId
                        ? "admin"
                        : c.Members
                            .Where(m => m.UserId == currentUserId)
                            .Select(m => m.Role.ToString().ToLower())
                            .FirstOrDefault(),
                MembersCount = c.Members.Count,
                PostsCount = c.Posts.Count
            };
    }

    public class CommunityDetailsDto : CommunityListItemDto
    {
        public List<CommunityMemberDto> Members { get; set; } = new();
        public string? CommunityRole { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CommunityAdminDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? JobTitle { get; set; }
        public string? AvatarUrl { get; set; }
    }

    public class PostCommunityDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string Visibility { get; set; } = string.Empty;
    }

    public class CommunityMemberDto
    {
        public Guid MembershipId { get; set; }
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? JobTitle { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Location { get; set; }
        public string CommunityRole { get; set; } = string.Empty;
        public DateTime JoinedAt { get; set; }
    }

    public class CommunityJoinRequestDto
    {
        public Guid Id { get; set; }
        public string? Note { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public CommunityRequestUserDto User { get; set; } = null!;
    }

    public class CommunityRequestUserDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? JobTitle { get; set; }
        public string? AvatarUrl { get; set; }
    }

    public class DecideCommunityJoinRequestDto
    {
        public string Decision { get; set; } = string.Empty;
    }

    public class UpdateCommunityMemberRoleDto
    {
        public string Role { get; set; } = string.Empty;
    }

    public class CreateCommunityDto
    {
        [Required(ErrorMessage = "Community name must be at least 2 characters")]
        [MinLength(2, ErrorMessage = "Community name must be at least 2 characters")]
        [MaxLength(80, ErrorMessage = "Community name must be at most 80 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Category is required")]
        [MinLength(2, ErrorMessage = "Category is required")]
        [MaxLength(50, ErrorMessage = "Category must be at most 50 characters")]
        public string Category { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description must be at least 10 characters")]
        [MinLength(10, ErrorMessage = "Description must be at least 10 characters")]
        [MaxLength(500, ErrorMessage = "Description must be at most 500 characters")]
        public string Description { get; set; } = string.Empty;

        [Url(ErrorMessage = "Image URL is invalid")]
        public string? ImageUrl { get; set; }

        public IFormFile? Image { get; set; }

        public IFormFile? CoverImage { get; set; }

        public string? Visibility { get; set; }
    }

    public class UpdateCommunityDto
    {
        [MinLength(2, ErrorMessage = "Community name must be at least 2 characters")]
        [MaxLength(80, ErrorMessage = "Community name must be at most 80 characters")]
        public string? Name { get; set; }

        [MinLength(2, ErrorMessage = "Category is required")]
        [MaxLength(50, ErrorMessage = "Category must be at most 50 characters")]
        public string? Category { get; set; }

        [MinLength(10, ErrorMessage = "Description must be at least 10 characters")]
        [MaxLength(500, ErrorMessage = "Description must be at most 500 characters")]
        public string? Description { get; set; }

        public string? ImageUrl { get; set; }

        public string? CoverImageUrl { get; set; }

        public IFormFile? Image { get; set; }

        public IFormFile? CoverImage { get; set; }

        public string? Visibility { get; set; }
    }
}
