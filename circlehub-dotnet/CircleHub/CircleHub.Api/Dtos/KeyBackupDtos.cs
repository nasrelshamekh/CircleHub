namespace CircleHub.Api.Dtos
{
    /// <summary>
    /// Stores the caller's own key backup. The blob is opaque to the server: it only checks its shape and
    /// size, never its contents, and there is no way for this API to derive the phrase key that opens it.
    /// </summary>
    public class SaveKeyBackupRequest
    {
        /// <summary>Base64 of IV || AES-GCM(recovery key) under the phrase-derived key.</summary>
        public string WrappedAccountKey { get; set; } = null!;

        /// <summary>Base64 KDF salt the client used.</summary>
        public string Salt { get; set; } = null!;

        public int KdfIterations { get; set; }

        public string KdfAlgorithm { get; set; } = null!;
    }

    /// <summary>
    /// The caller's own backup, returned so a new device can unwrap it. Never returned for another user:
    /// the user id always comes from the JWT, and there is no "by username" route on purpose.
    /// </summary>
    public class KeyBackupDto
    {
        public string WrappedAccountKey { get; set; } = null!;
        public string Salt { get; set; } = null!;
        public int KdfIterations { get; set; }
        public string KdfAlgorithm { get; set; } = null!;
        public DateTime UpdatedAt { get; set; }
    }
}
