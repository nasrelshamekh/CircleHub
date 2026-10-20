namespace CircleHub.Api.Entities
{
    /// <summary>
    /// One user's recovery material: the account recovery key, wrapped (encrypted) under a key derived from
    /// the user's recovery phrase. The server stores an opaque blob it cannot open — it has no way to derive
    /// the phrase key — so this row is a convenience for the user and a liability for nobody.
    ///
    /// One row per user: a newer backup replaces the old one, because restoring is "unwrap the account key,
    /// then re-wrap this device's private key". <see cref="Salt"/> and the KDF parameters are stored
    /// alongside so a client can reproduce the derivation without shipping a constant baked into the build.
    /// </summary>
    public class UserKeyBackup
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        /// <summary>Base64 of the recovery key wrapped under the phrase-derived key (IV || AES-GCM output).</summary>
        public string WrappedAccountKey { get; set; } = null!;

        /// <summary>Base64 KDF salt. Random per user and per backup, so two users with the same phrase do not share a key.</summary>
        public string Salt { get; set; } = null!;

        /// <summary>PBKDF2 iteration count at the time this backup was written, so old rows stay readable if it is raised.</summary>
        public int KdfIterations { get; set; }

        public string KdfAlgorithm { get; set; } = null!;

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
