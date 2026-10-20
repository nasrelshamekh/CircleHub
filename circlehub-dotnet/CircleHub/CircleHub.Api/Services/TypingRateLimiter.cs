using System.Collections.Concurrent;

namespace CircleHub.Api.Services
{
    /// <summary>
    /// Per-connection token bucket for the typing signal.
    /// <para>
    /// Typing is the one hub call a client raises automatically on the user's behalf, so without a cap a
    /// hostile client can re-render one recipient's UI as fast as it can call <c>SendTyping</c>. The
    /// bucket matches what a legitimate client already does — one signal per 2s while keys keep coming,
    /// plus a short burst for conversation switches — so a real user's typing is never touched and an
    /// abusive one is throttled down to indistinguishable-from-real traffic. Overflow is dropped silently
    /// by the hub, like every other typing refusal: there is nothing the typing user could do about it.
    /// </para>
    /// </summary>
    public class TypingRateLimiter
    {
        /// <summary>Matches the client's own throttle: one claim refresh per 2s while typing.</summary>
        private const double RefillPerSecond = 0.5;

        /// <summary>
        /// Burst allowance. A legitimate client never comes close (one "started" per conversation, a
        /// handful of refreshes, one "stopped"); it exists so rapid conversation switching is not punished.
        /// </summary>
        private const int Capacity = 10;

        private readonly ConcurrentDictionary<string, Bucket> _buckets = new();

        /// <summary>True when this call may proceed; false when the connection is out of tokens.</summary>
        public bool TryPass(string connectionId)
        {
            var bucket = _buckets.GetOrAdd(connectionId, _ => new Bucket(Capacity, RefillPerSecond));
            return bucket.TryConsume();
        }

        /// <summary>
        /// Forgets a connection's bucket. Called from the disconnect path so a reconnecting client starts
        /// with a full allowance and the map cannot outlive its connection.
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
                    // Refill from wall-clock deltas, not a timer: an idle connection costs no thread and
                    // simply arrives with its bucket full again.
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
