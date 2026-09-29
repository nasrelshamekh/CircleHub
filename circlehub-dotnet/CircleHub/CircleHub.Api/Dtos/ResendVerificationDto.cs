using System.ComponentModel.DataAnnotations;

namespace CircleHub.Api.Dtos
{
    public class ResendVerificationDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}
