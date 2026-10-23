namespace CircleHub.Api.Services.Storage
{
    /// <summary>
    /// Cloudflare R2 configuration. The access key and secret are read from the host's
    /// environment variables (<c>R2__AccessKeyId</c>, <c>R2__SecretAccessKey</c>) and are
    /// never committed to the repository.
    /// </summary>
    public sealed class R2Options
    {
        public const string SectionName = "R2";

        public string AccountId { get; set; } = string.Empty;
        public string AccessKeyId { get; set; } = string.Empty;
        public string SecretAccessKey { get; set; } = string.Empty;

        /// <summary>Bucket for images that are served directly from the public r2.dev/domain URL.</summary>
        public string PublicBucket { get; set; } = "circlehub-public";

        /// <summary>Bucket for encrypted chat attachments, reachable only through presigned URLs.</summary>
        public string PrivateBucket { get; set; } = "circlehub-media";

        /// <summary>
        /// Public origin of <see cref="PublicBucket"/>, e.g. the r2.dev URL or a custom media domain.
        /// No trailing slash is required.
        /// </summary>
        public string PublicBaseUrl { get; set; } = string.Empty;

        /// <summary>Reject images larger than this before decoding them.</summary>
        public long MaxUploadBytes { get; set; } = 5 * 1024 * 1024;

        public bool IsConfigured =>
            !string.IsNullOrWhiteSpace(AccountId) &&
            !string.IsNullOrWhiteSpace(AccessKeyId) &&
            !string.IsNullOrWhiteSpace(SecretAccessKey) &&
            !string.IsNullOrWhiteSpace(PublicBucket) &&
            !string.IsNullOrWhiteSpace(PublicBaseUrl);
    }
}
