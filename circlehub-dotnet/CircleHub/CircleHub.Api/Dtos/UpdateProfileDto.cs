using System.ComponentModel.DataAnnotations;

namespace CircleHub.Api.Dtos
{
    public class UpdateProfileDto
    {
        [MinLength(2, ErrorMessage = "Full name must be at least 2 characters")]
        [MaxLength(80, ErrorMessage = "Full name is too long")]
        public string? Name { get; set; }

        [MaxLength(120, ErrorMessage = "Job title is too long")]
        public string? JobTitle { get; set; }

        [MaxLength(500, ErrorMessage = "Bio is too long")]
        public string? Bio { get; set; }

        [MaxLength(120, ErrorMessage = "Location is too long")]
        [RegularExpression(@"^[^,]+,\s*[^,]+$", ErrorMessage = "Location must be in the format City, Country")]
        public string? Location { get; set; }

        [MaxLength(200, ErrorMessage = "Website is too long")]
        public string? Website { get; set; }

        [MaxLength(500, ErrorMessage = "Avatar URL is too long")]
        public string? AvatarUrl { get; set; }

        [MaxLength(500, ErrorMessage = "Cover image URL is too long")]
        public string? CoverImageUrl { get; set; }

        [RegularExpression("^(male|female|other)$", ErrorMessage = "Gender must be male, female or other")]
        public string? Gender { get; set; }

        public DateTime? DateOfBirth { get; set; }

        [MaxLength(50, ErrorMessage = "Too many skills")]
        public List<string>? Skills { get; set; }

        public IFormFile? AvatarImage { get; set; }

        public IFormFile? CoverImage { get; set; }
    }
}
