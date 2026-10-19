using System.Text.Json.Serialization;

namespace CircleHub.Api.Dtos
{
    /// <summary>
    /// Pushed to the other participants of a user's conversations when that user comes online or goes
    /// away (<see cref="Hubs.ChatHub.PresenceChangedMethod"/>).
    /// <para>
    /// Deliberately not broadcast to everyone: only people who already share a conversation with the
    /// user can see their presence.
    /// </para>
    /// </summary>
    public class PresenceChangedEnvelope
    {
        /// <summary>Canonical Guid form of the user whose presence changed.</summary>
        public required string UserId { get; init; }

        public bool IsOnline { get; init; }

        /// <summary>
        /// When the user was last on the hub. Set on the "offline" event, null while they are online.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public DateTime? LastSeenAt { get; init; }
    }
}
