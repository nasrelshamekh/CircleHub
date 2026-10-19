using CircleHub.Api.Enums;

namespace CircleHub.Api.Entities
{
    /// <summary>
    /// One entry in a user's notification feed: something another user did that concerns them.
    /// <para>
    /// The row records only the <em>facts</em> — who, what, and which post or community. The wording is
    /// rendered by the client from <see cref="Type"/>, so there is no text column that can go stale when a
    /// display name changes, and no second copy of the copy to keep in sync.
    /// </para>
    /// </summary>
    public class Notification
    {
        public Guid Id { get; set; }
        public NotificationType Type { get; set; }
        public DateTime CreatedAt { get; set; }

        /// <summary>The user who receives this.</summary>
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        /// <summary>
        /// The user who caused this. Never equal to <see cref="UserId"/>: the writer drops self-actions, so
        /// the feed can never tell you that you did something to yourself.
        /// </summary>
        public Guid ActorId { get; set; }
        public User Actor { get; set; } = null!;

        /// <summary>
        /// Set for the like and comment notifications. Cascades away with the post, because a row pointing at
        /// a deleted post has nothing to open.
        /// </summary>
        public Guid? PostId { get; set; }
        public Post? Post { get; set; }

        /// <summary>Set for every community notification: the community it concerns.</summary>
        public Guid? CommunityId { get; set; }
        public Community? Community { get; set; }
    }
}
