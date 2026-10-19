namespace CircleHub.Api.Dtos
{
    /// <summary>
    /// One feed entry. Carries facts only — the client turns <see cref="Type"/> into a sentence, so the
    /// server never ships rendered copy.
    /// </summary>
    public class NotificationDto
    {
        public Guid Id { get; set; }

        /// <summary>The <c>NotificationType</c> name, e.g. <c>PostLike</c>.</summary>
        public string Type { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        /// <summary>True while the row is unread: newer than the reader's <c>NotificationsSeenAt</c> and not individually marked as read.</summary>
        public bool Unread { get; set; }

        /// <summary>Who did it.</summary>
        public AuthorDto Actor { get; set; } = null!;

        /// <summary>Set for like/comment notifications, so the client can link to the post.</summary>
        public Guid? PostId { get; set; }

        public string? CommunityName { get; set; }
        public string? CommunitySlug { get; set; }
    }

    /// <summary>
    /// The feed page plus the badge count in one response: the client needs both, and asking twice would
    /// let the two disagree.
    /// </summary>
    public class NotificationFeedDto
    {
        public int UnreadCount { get; set; }
        public List<NotificationDto> Items { get; set; } = new();
    }
}
