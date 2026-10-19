using System.Collections.Concurrent;

namespace CircleHub.Api.Services
{
    /// <inheritdoc />
    public class ConnectionTracker : IConnectionTracker
    {
        private readonly ConcurrentDictionary<Guid, ConcurrentDictionary<string, byte>> _connections = new();

        public void Add(Guid userId, string connectionId)
        {
            var userConnections = _connections.GetOrAdd(userId, _ => new ConcurrentDictionary<string, byte>());

            userConnections[connectionId] = 0;
        }

        public void Remove(Guid userId, string connectionId)
        {
            if (!_connections.TryGetValue(userId, out var userConnections))
                return;

            userConnections.TryRemove(connectionId, out _);

            if (userConnections.IsEmpty)
            {
                // Remove the pair only if it is still the empty set we just observed. A connection
                // created in the meantime would otherwise be dropped from the registry while it is
                // still alive.
                _connections.TryRemove(new KeyValuePair<Guid, ConcurrentDictionary<string, byte>>(userId, userConnections));
            }
        }

        public bool IsOnline(Guid userId) =>
            _connections.TryGetValue(userId, out var userConnections) && !userConnections.IsEmpty;

        public int ConnectionCount(Guid userId) =>
            _connections.TryGetValue(userId, out var userConnections) ? userConnections.Count : 0;

        public int OnlineUserCount => _connections.Count;
    }
}
