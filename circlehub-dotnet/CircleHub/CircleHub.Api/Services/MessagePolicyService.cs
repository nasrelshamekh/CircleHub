using CircleHub.Api.Data;
using CircleHub.Api.Entities;
using CircleHub.Api.Enums;
using Microsoft.EntityFrameworkCore;

namespace CircleHub.Api.Services
{
    /// <summary>
    /// Single source of truth for "is this sender allowed to message this recipient?".
    /// <para>
    /// Both <c>MessagesController</c> (the write path) and <c>ChatHub</c> (the real-time relay) use
    /// this, so the privacy setting can't be bypassed by calling the hub directly instead of REST.
    /// </para>
    /// </summary>
    public class MessagePolicyService
    {
        private readonly AppDbContext _db;

        public MessagePolicyService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<bool> CanMessageAsync(User recipient, Guid senderId, CancellationToken cancellationToken = default)
        {
            if (recipient.Id == senderId)
                return false;

            return recipient.MessagesFrom switch
            {
                MessagesFrom.Everyone => true,
                MessagesFrom.Followers => await _db.Follows.AnyAsync(f =>
                    f.FollowerId == senderId && f.FollowingId == recipient.Id, cancellationToken),
                _ => false
            };
        }
    }
}
