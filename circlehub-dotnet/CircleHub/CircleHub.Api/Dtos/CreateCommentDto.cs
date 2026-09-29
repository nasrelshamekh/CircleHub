using System.ComponentModel.DataAnnotations;

namespace CircleHub.Api.Dtos
{
    public class CreateCommentDto
    {
        [Required(ErrorMessage = "Comment content is required")]
        [MaxLength(1000, ErrorMessage = "Comment must be at most 1000 characters")]
        public string Content { get; set; } = string.Empty;
    }
}
