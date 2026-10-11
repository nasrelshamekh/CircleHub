using System.ComponentModel.DataAnnotations;

namespace CircleHub.Api.Dtos
{
    public class ResetPasswordDto
    {
        [Required]
        public Guid UserId { get; set; }

        [Required(ErrorMessage = "Reset token is required")]
        public string Token { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
        public string Password { get; set; } = string.Empty;
    }
}
