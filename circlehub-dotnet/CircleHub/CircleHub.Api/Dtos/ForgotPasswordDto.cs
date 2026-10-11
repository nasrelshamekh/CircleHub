using System.ComponentModel.DataAnnotations;

namespace CircleHub.Api.Dtos
{
    public class ForgotPasswordDto
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Email is invalid")]
        public string Email { get; set; } = string.Empty;
    }
}
