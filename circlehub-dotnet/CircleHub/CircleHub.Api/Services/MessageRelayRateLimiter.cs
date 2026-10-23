using System.Collections.Concurrent;

namespace CircleHub.Api.Services
{
    /// <summary>
    /// Per-connection token bucket for SignalR message relays (<c>SendEncryptedMessage</c>).
    /// Prevents flooded WebSocket calls from exhausting server resources, flooding recipients, or DoSing the hub.
    /// </summary>
    public class MessageRelayRateLimiter
    {
        /// <summary>Allows a sustained rate of 1 message per second.</summary>
        private const double RefillPerSecond = 1.0;

        /// <summary>Burst allowance for fast messaging.</summary>
        private const int Capacity = 15;

        private readonly ConcurrentDictionary<string, Bucket> _buckets = new();

        /// <summary>True when this message relay may proceed; false when the connection is out of tokens.</summary>
        public bool TryPass(string connectionId)
        {
            var bucket = _buckets.GetOrAdd(connectionId, _ => new Bucket(Capacity, RefillPerSecond));
            return bucket.TryConsume();
        }

        /// <summary>
        /// Forgets a connection's bucket on disconnect.
        /// </summary>
        public void Remove(string connectionId) => _buckets.TryRemove(connectionId, out _);

        private sealed class Bucket
        {
            private readonly object _gate = new();
            private readonly double _capacity;
            private readonly double _refillPerSecond;
            private double _tokens;
            private long _lastRefillMs = Environment.TickCount64;

            public Bucket(int capacity, double refillPerSecond)
            {
                _capacity = capacity;
                _refillPerSecond = refillPerSecond;
                _tokens = capacity;
            }

            public bool TryConsume()
            {
                lock (_gate)
                {
                    var now = Environment.TickCount64;
                    _tokens = Math.Min(_capacity, _tokens + (now - _lastRefillMs) / 1000.0 * _refillPerSecond);
                    _lastRefillMs = now;

                    if (_tokens < 1) return false;

                    _tokens -= 1;
                    return true;
                }
            }
        }
    }
}
