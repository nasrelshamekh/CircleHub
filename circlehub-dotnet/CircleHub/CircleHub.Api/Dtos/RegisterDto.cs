using System.ComponentModel.DataAnnotations;

namespace CircleHub.Api.Dtos
{
    public class RegisterDto
    {
        [Required(ErrorMessage = "Full name is required")]
        [MinLength(2, ErrorMessage = "Full name must be at least 2 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Username is required")]
        [StringLength(30, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 30 characters")]
        [RegularExpression("^[a-zA-Z0-9_]+$", ErrorMessage = "Username can only contain letters, numbers, and underscores")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Job title is required")]
        [MinLength(2, ErrorMessage = "Job title must be at least 2 characters")]
        public string JobTitle { get; set; } = string.Empty;

        [Required(ErrorMessage = "Please select a gender")]
        [RegularExpression("^(male|female|other)$", ErrorMessage = "Gender is invalid")]
        public string Gender { get; set; } = string.Empty;

        [Required(ErrorMessage = "Birthdate is required")]
        public DateTime DateOfBirth { get; set; }

        [Required(ErrorMessage = "Location is required")]
        [RegularExpression(@"^[^,]+,\s*[^,]+$", ErrorMessage = "Location must be in the format City, Country")]
        public string Location { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Email is invalid")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
        public string Password { get; set; } = string.Empty;
    }
}
