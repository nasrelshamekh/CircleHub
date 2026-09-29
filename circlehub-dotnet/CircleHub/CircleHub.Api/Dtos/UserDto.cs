using CircleHub.Api.Entities;

namespace CircleHub.Api.Dtos
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? JobTitle { get; set; }
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Location { get; set; }
        public string? AvatarUrl { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? Bio { get; set; }
        public string? Website { get; set; }
        public List<string> Skills { get; set; } = new();
        public bool EmailVerified { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public static UserDto FromEntity(User user) => new()
        {
            Id = user.Id,
            Name = user.Name,
            Username = user.Username,
            Email = user.Email,
            JobTitle = user.JobTitle,
            Gender = user.Gender,
            DateOfBirth = user.DateOfBirth,
            Location = user.Location,
            AvatarUrl = user.AvatarUrl,
            CoverImageUrl = user.CoverImageUrl,
            Bio = user.Bio,
            Website = user.Website,
            Skills = user.Skills,
            EmailVerified = user.EmailVerified,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }
}
