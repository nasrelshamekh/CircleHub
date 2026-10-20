using CircleHub.Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CircleHub.Api.Services
{
    /// <summary>
    /// Delivers push notifications through the Expo Push Service (<c>https://exp.host/--/api/v2/push/send</c>)
    /// whenever a recipient has no live SignalR connection.
    /// <para>
    /// Push delivery is a best-effort side effect after the database commit: a network error or a non-2xx
    /// response from Expo is logged and never fails the caller's request. When a ticket in the response carries
    /// <c>details.error == "DeviceNotRegistered"</c>, the corresponding token is deleted from
    /// <c>DeviceTokens</c> immediately so uninstalled or rotated installs stop receiving pushes.
    /// </para>
    /// </summary>
    public class ExpoPushService
    {
        public const string DefaultExpoEndpoint = "https://exp.host/--/api/v2/push/send";
        private const int MaxBatchSize = 100;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        private readonly HttpClient _http;
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;
        private readonly ILogger<ExpoPushService> _logger;

        public ExpoPushService(
            HttpClient http,
            AppDbContext db,
            IConfiguration config,
            ILogger<ExpoPushService> logger)
        {
            _http = http;
            _db = db;
            _config = config;
            _logger = logger;
        }

        public async Task SendToUserAsync(
            Guid recipientId,
            string title,
            string body,
            object? data = null,
            CancellationToken cancellationToken = default)
        {
            var tokens = await _db.DeviceTokens
                .Where(d => d.UserId == recipientId)
                .Select(d => d.Token)
                .ToListAsync(cancellationToken);

            if (tokens.Count == 0)
            {
                _logger.LogDebug(
                    "Recipient {RecipientId} is offline with no registered device tokens; skipping Expo push",
                    recipientId);
                return;
            }

            var endpoint = _config["ExpoPush:Endpoint"];
            if (string.IsNullOrWhiteSpace(endpoint))
                endpoint = DefaultExpoEndpoint;

            var accessToken = _config["ExpoPush:AccessToken"];
            var staleTokens = new HashSet<string>(StringComparer.Ordinal);

            foreach (var batch in tokens.Chunk(MaxBatchSize))
            {
                var payload = batch
                    .Select(token => new ExpoPushMessage
                    {
                        To = token,
                        Sound = "default",
                        Title = title,
                        Body = body,
                        Data = data
                    })
                    .ToArray();

                try
                {
                    using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
                    {
                        Content = JsonContent.Create(payload, options: JsonOptions)
                    };
                    request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                    if (!string.IsNullOrWhiteSpace(accessToken))
                        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

                    using var response = await _http.SendAsync(request, cancellationToken);

                    if (!response.IsSuccessStatusCode)
                    {
                        _logger.LogWarning(
                            "Expo push request for recipient {RecipientId} returned HTTP {StatusCode}",
                            recipientId,
                            (int)response.StatusCode);
                        continue;
                    }

                    var envelope = await response.Content.ReadFromJsonAsync<ExpoPushResponse>(
                        JsonOptions,
                        cancellationToken);

                    if (envelope?.Data is null)
                        continue;

                    for (var i = 0; i < envelope.Data.Count && i < batch.Length; i++)
                    {
                        var ticket = envelope.Data[i];
                        if (!string.Equals(ticket.Status, "error", StringComparison.OrdinalIgnoreCase))
                            continue;

                        var errorCode = ticket.Details?.Error;
                        var rejectedToken = !string.IsNullOrWhiteSpace(ticket.Details?.ExpoPushToken)
                            ? ticket.Details!.ExpoPushToken!
                            : batch[i];

                        if (string.Equals(errorCode, "DeviceNotRegistered", StringComparison.OrdinalIgnoreCase))
                        {
                            staleTokens.Add(rejectedToken);
                        }
                        else
                        {
                            _logger.LogWarning(
                                "Expo push ticket error for recipient {RecipientId}: {ErrorCode} ({Message})",
                                recipientId,
                                errorCode ?? "unknown",
                                ticket.Message ?? "no message");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(
                        ex,
                        "Expo push delivery failed for recipient {RecipientId}",
                        recipientId);
                }
            }

            if (staleTokens.Count > 0)
            {
                var pruned = await _db.DeviceTokens
                    .Where(d => staleTokens.Contains(d.Token))
                    .ExecuteDeleteAsync(cancellationToken);

                _logger.LogInformation(
                    "Pruned {Count} unregistered Expo device token(s) for recipient {RecipientId}",
                    pruned,
                    recipientId);
            }
        }

        private sealed class ExpoPushMessage
        {
            public required string To { get; init; }
            public string Sound { get; init; } = "default";
            public required string Title { get; init; }
            public required string Body { get; init; }
            public object? Data { get; init; }
        }

        private sealed class ExpoPushResponse
        {
            public List<ExpoPushTicket>? Data { get; init; }
        }

        private sealed class ExpoPushTicket
        {
            public string? Status { get; init; }
            public string? Id { get; init; }
            public string? Message { get; init; }
            public ExpoPushTicketDetails? Details { get; init; }
        }

        private sealed class ExpoPushTicketDetails
        {
            public string? Error { get; init; }
            public string? ExpoPushToken { get; init; }
        }
    }
}
