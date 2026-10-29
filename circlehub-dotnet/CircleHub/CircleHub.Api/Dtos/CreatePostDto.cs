using System.ComponentModel.DataAnnotations;

namespace CircleHub.Api.Dtos
{
    public class CreatePostDto
    {
        [Required(ErrorMessage = "Post content is required")]
        [MaxLength(5000, ErrorMessage = "Post content must be at most 5000 characters")]
        public string Content { get; set; } = string.Empty;

        public IFormFile? Image { get; set; }
        public List<IFormFile>? Images { get; set; }

        public string? PollQuestion { get; set; }
        public List<string>? PollOptions { get; set; }
        public int? PollDurationDays { get; set; }
    }
}
