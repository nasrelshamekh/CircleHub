namespace CircleHub.Api.Entities
{
    /// <summary>
    /// One browser's published encryption key (public half only — the private key never leaves the device).
    /// A user has one row per browser/profile they sign in from, so a message can be wrapped for every
    /// device either participant owns. <see cref="DeviceId"/> is a stable id the browser invents for itself
    /// and keeps in localStorage; the row is upserted on that pair, so a regenerated key replaces the old
    /// one instead of stacking rows.
    /// </summary>
    public class UserDeviceKey
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public string DeviceId { get; set; } = null!;

        /// <summary>Base64 of the uncompressed P-256 point (65 bytes, 88 base64 chars).</summary>
        public string PublicKey { get; set; } = null!;

        /// <summary>When this device id was first published for this user.</summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// When this device id last published a key. A device that has not come back in a while is
        /// gone — a reinstall, a cleared browser profile — and its row only makes every message
        /// wider: a sender wraps a copy of the key for every device in the directory, and the
        /// recipient has to try every wrap its own keyring cannot match by device id.
        /// </summary>
        public DateTime LastSeenAt { get; set; }
    }
}
