using System.Text.Json.Serialization;

namespace CircleHub.Api.Dtos
{
    /// <summary>
    /// The other participant of a conversation, plus presence.
    /// <para>
    /// Presence lives here rather than on <see cref="AuthorDto"/>, which is also returned for posts and
    /// comments: who is online is only relevant inside a conversation, and is only ever sent to the
    /// people who already have one with that user.
    /// </para>
    /// </summary>
    public class ConversationUserDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }

        /// <summary>Whether the user has a live connection right now. Server-instance local.</summary>
        public bool IsOnline { get; set; }

        /// <summary>
        /// When the user was last on the hub, or null if they never have been. Omitted while online,
        /// where the exact time is of no interest.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public DateTime? LastSeenAt { get; set; }
    }
}
