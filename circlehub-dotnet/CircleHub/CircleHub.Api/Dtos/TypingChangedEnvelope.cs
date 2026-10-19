namespace CircleHub.Api.Dtos
{
    /// <summary>
    /// Pushed to a recipient while the caller is typing a message to them
    /// (<see cref="Hubs.ChatHub.TypingChangedMethod"/>).
    /// <para>
    /// Ephemeral by design: never stored, never pushed to an offline device, and worthless a few seconds
    /// later. The recipient expires the claim on its own, so a "stopped" signal lost to a dropped
    /// connection cannot leave the indicator stuck.
    /// </para>
    /// </summary>
    public class TypingChangedEnvelope
    {
        /// <summary>Canonical Guid form of the user who is (or is no longer) typing.</summary>
        public required string UserId { get; init; }

        /// <summary>True while they are typing; false once they stopped.</summary>
        public bool IsTyping { get; init; }
    }
}
