using System.ComponentModel.DataAnnotations;

namespace CircleHub.Api.Dtos
{
    public class SendMessageDto
    {
        /// <summary>
        /// The stored body. With client-side encryption this is normally a base64 envelope, which runs
        /// larger than the words typed — the cap that actually applies lives in
        /// <c>MessagesController.MaxContentLength</c> (a guidance error a user can read), while this
        /// attribute only has to be high enough that model binding never truncates the payload before
        /// the controller sees it. Without it DataAnnotations defaults a string to 4000 and silently cuts
        /// a longer envelope in half, which stores an undecryptable message and answers 200.
        /// </summary>
        [MaxLength(14000)]
        public string? Content { get; set; }

        [MaxLength(300)]
        public string? PreviewText { get; set; }

        [Required]
        public string RecipientUsername { get; set; } = string.Empty;

        public Guid? PostId { get; set; }
    }

    public class SendMessageResultDto
    {
        public Guid ConversationId { get; set; }
        public MessageDto Message { get; set; } = null!;
    }
}
