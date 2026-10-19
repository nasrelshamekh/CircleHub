using Microsoft.AspNetCore.SignalR;

namespace CircleHub.Api.Services
{
    /// <summary>
    /// Maps SignalR connections to the same user id the REST API uses: the "sub" claim (a Guid
    /// string) issued by <see cref="TokenService"/>.
    /// <para>
    /// Without this, <c>Clients.User(id)</c> would look for <c>ClaimTypes.NameIdentifier</c>,
    /// which this API never issues (<c>MapInboundClaims</c> is off), and every message would
    /// silently route to nobody. The id is normalised to the canonical Guid form so casing
    /// differences between the claim and the caller can't break delivery either.
    /// </para>
    /// </summary>
    public class CircleHubUserIdProvider : IUserIdProvider
    {
        public string GetUserId(HubConnectionContext connection) =>
            Guid.TryParse(connection.User?.FindFirst("sub")?.Value, out var userId)
                ? userId.ToString()
                : string.Empty;
    }
}
