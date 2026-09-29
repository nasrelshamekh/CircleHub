using System.ComponentModel.DataAnnotations;

namespace CircleHub.Api.Dtos
{
    public class VerifyEmailDto
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        public string Token { get; set; } = string.Empty;
    }
}
