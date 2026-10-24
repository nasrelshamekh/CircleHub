using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;

namespace CircleHub.Api.Services.Storage
{
    /// <summary>
    /// Cloudflare R2 is S3-compatible, so the AWS SDK is enough: no Cloudflare-specific SDK
    /// or Worker is involved. Images go to the public bucket and are served by its r2.dev or
    /// custom-domain origin; chat attachments go to the private bucket through presigned URLs.
    /// </summary>
    public sealed class R2ObjectStorage : IObjectStorage, IDisposable
    {
        private readonly R2Options _options;
        private readonly IAmazonS3? _client;

        public R2ObjectStorage(IOptions<R2Options> options)
        {
            _options = options.Value;

            if (!_options.IsConfigured)
                return;

            var config = new AmazonS3Config
            {
                ServiceURL = $"https://{_options.AccountId}.r2.cloudflarestorage.com",
                // R2 works with virtual-hosted style too, but path style keeps the bucket in
                // the path and avoids surprises when the account id is the endpoint host.
                ForcePathStyle = true,
                AuthenticationRegion = "auto",
                // AWS SDK 4 adds checksum headers by default. R2 accepts the required ones,
                // but "when required" avoids signing a checksum into presigned PUTs.
                RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
                ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED,
                Timeout = TimeSpan.FromSeconds(60),
                MaxErrorRetry = 3
            };

            _client = new AmazonS3Client(
                new BasicAWSCredentials(_options.AccessKeyId, _options.SecretAccessKey),
                config);
        }

        public bool IsConfigured => _client is not null;

        public string? PublicBaseUrl =>
            string.IsNullOrWhiteSpace(_options.PublicBaseUrl)
                ? null
                : _options.PublicBaseUrl.TrimEnd('/');

        public async Task<string> UploadPublicAsync(
            string key,
            Stream content,
            string contentType,
            CancellationToken cancellationToken = default)
        {
            var client = RequireClient();

            var request = new PutObjectRequest
            {
                BucketName = _options.PublicBucket,
                Key = key,
                InputStream = content,
                ContentType = contentType,
                DisablePayloadSigning = true,
                DisableDefaultChecksumValidation = true,
                // Keys contain a GUID and never change, so the browser may cache them forever.
                Headers =
                {
                    CacheControl = "public, max-age=31536000, immutable"
                },
                AutoCloseStream = false
            };

            await client.PutObjectAsync(request, cancellationToken);

            return GetPublicUrl(key)
                ?? throw new InvalidOperationException("R2:PublicBaseUrl is not configured.");
        }

        public async Task DeletePublicAsync(string key, CancellationToken cancellationToken = default)
        {
            var client = RequireClient();

            await client.DeleteObjectAsync(new DeleteObjectRequest
            {
                BucketName = _options.PublicBucket,
                Key = key
            }, cancellationToken);
        }

        public bool TryGetPublicKey(string url, out string key)
        {
            key = string.Empty;

            var baseUrl = PublicBaseUrl;
            if (string.IsNullOrWhiteSpace(baseUrl))
                return false;

            if (!url.StartsWith(baseUrl + "/", StringComparison.OrdinalIgnoreCase))
                return false;

            var candidate = url[(baseUrl.Length + 1)..];

            // Our generated keys never contain a query string or traversal segment. Refusing
            // both keeps an arbitrary URL from being accepted as an "uploaded" image.
            if (candidate.Length == 0 || candidate.Contains("..") || candidate.Contains('?') || candidate.Contains('#'))
                return false;

            key = candidate;
            return true;
        }

        public string? GetPublicUrl(string key)
        {
            var baseUrl = PublicBaseUrl;
            return string.IsNullOrWhiteSpace(baseUrl) ? null : $"{baseUrl}/{key.TrimStart('/')}";
        }

        public Task<string> CreatePrivateUploadUrlAsync(
            string key,
            string contentType,
            TimeSpan lifetime,
            CancellationToken cancellationToken = default)
        {
            RequireClient();

            var url = _client!.GetPreSignedURL(new GetPreSignedUrlRequest
            {
                BucketName = _options.PrivateBucket,
                Key = key,
                Verb = HttpVerb.PUT,
                ContentType = contentType,
                Expires = DateTime.UtcNow.Add(lifetime)
            });

            return Task.FromResult(url);
        }

        public Task<string> CreatePrivateDownloadUrlAsync(
            string key,
            TimeSpan lifetime,
            CancellationToken cancellationToken = default)
        {
            RequireClient();

            var url = _client!.GetPreSignedURL(new GetPreSignedUrlRequest
            {
                BucketName = _options.PrivateBucket,
                Key = key,
                Verb = HttpVerb.GET,
                Expires = DateTime.UtcNow.Add(lifetime)
            });

            return Task.FromResult(url);
        }

        public async Task DeletePrivateAsync(string key, CancellationToken cancellationToken = default)
        {
            var client = RequireClient();

            await client.DeleteObjectAsync(new DeleteObjectRequest
            {
                BucketName = _options.PrivateBucket,
                Key = key
            }, cancellationToken);
        }

        private IAmazonS3 RequireClient() =>
            _client ?? throw new InvalidOperationException(
                "R2 is not configured. Set R2:AccountId, R2:AccessKeyId, R2:SecretAccessKey and R2:PublicBaseUrl.");

        public void Dispose() => _client?.Dispose();
    }
}
