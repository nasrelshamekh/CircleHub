namespace CircleHub.Api.Services.Storage
{
    public interface IObjectStorage
    {
        bool IsConfigured { get; }

        /// <summary>Public base URL without a trailing slash, or null when storage is not configured.</summary>
        string? PublicBaseUrl { get; }

        /// <summary>Uploads one object to the public image bucket and returns its absolute URL.</summary>
        Task<string> UploadPublicAsync(
            string key,
            Stream content,
            string contentType,
            CancellationToken cancellationToken = default);

        Task DeletePublicAsync(string key, CancellationToken cancellationToken = default);

        /// <summary>True when this URL points at the configured public bucket.</summary>
        bool TryGetPublicKey(string url, out string key);

        /// <summary>Absolute public URL for a key, or null when storage is not configured.</summary>
        string? GetPublicUrl(string key);

        /// <summary>Short-lived URL the mobile client can PUT an encrypted attachment to.</summary>
        Task<string> CreatePrivateUploadUrlAsync(
            string key,
            string contentType,
            TimeSpan lifetime,
            CancellationToken cancellationToken = default);

        /// <summary>Short-lived URL for reading a private attachment.</summary>
        Task<string> CreatePrivateDownloadUrlAsync(
            string key,
            TimeSpan lifetime,
            CancellationToken cancellationToken = default);

        Task DeletePrivateAsync(string key, CancellationToken cancellationToken = default);
    }
}
