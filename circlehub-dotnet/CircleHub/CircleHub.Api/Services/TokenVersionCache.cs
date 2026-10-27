using CircleHub.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace CircleHub.Api.Services
{
    /// <summary>
    /// Caches <c>User.TokenVersion</c> in memory so JWT validation does not pay a database round-trip
    /// on every authenticated HTTP request. Entries expire automatically after a short TTL and are
    /// explicitly invalidated whenever a user's password or token version changes.
    /// </summary>
    public class TokenVersionCache
    {
        private static readonly TimeSpan EntryTtl = TimeSpan.FromMinutes(5);
        private readonly IMemoryCache _cache;

        public TokenVersionCache(IMemoryCache cache)
        {
            _cache = cache;
        }

        private static string Key(Guid userId) => $"token_version:{userId:N}";

        public async Task<int?> GetAsync(Guid userId, AppDbContext db, CancellationToken cancellationToken = default)
        {
            var key = Key(userId);
            if (_cache.TryGetValue<int>(key, out var cached))
                return cached;

            var version = await db.Users
                .AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => (int?)u.TokenVersion)
                .FirstOrDefaultAsync(cancellationToken);

            if (version.HasValue)
            {
                _cache.Set(key, version.Value, EntryTtl);
            }

            return version;
        }

        public void Set(Guid userId, int version)
        {
            _cache.Set(Key(userId), version, EntryTtl);
        }

        public void Invalidate(Guid userId)
        {
            _cache.Remove(Key(userId));
        }
    }
}
