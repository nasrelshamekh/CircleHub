using Microsoft.AspNetCore.SignalR;

namespace CircleHub.Api.Services
{
    /// <summary>
    /// Resolves the SignalR user id from the "sub" claim that <see cref="TokenService"/> issues.
    /// <para>
    /// SignalR defaults to <c>ClaimTypes.NameIdentifier</c>, which this API never emits (it sets
    /// <c>MapInboundClaims = false</c>). Without this provider <c>Clients.User(id)</c> would
    /// silently match nothing, so the mapping lives in one place and is shared with
    /// <c>MessagesController.CurrentUserId</c>.
    /// </para>
    /// </summary>
    public class CircleHubUserIdProvider : IUserIdProvider
    {
        public string GetUserId(HubConnectionContext connection) =>
            connection.User?.FindFirst("sub")?.Value ?? string.Empty;
    }
}
