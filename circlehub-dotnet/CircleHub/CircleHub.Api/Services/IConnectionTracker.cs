namespace CircleHub.Api.Services
{
    /// <summary>
    /// Registry of live SignalR connections, keyed by user id. Tells the server whether a message can be
    /// delivered in real time or has to fall back to a push notification.
    /// <para>
    /// This is per-process state: the instance that owns a connection is the only one that can deliver to
    /// it. With more than one API instance behind a load balancer this needs a shared backplane
    /// (e.g. Redis) plus sticky sessions at the proxy.
    /// </para>
    /// </summary>
    public interface IConnectionTracker
    {
        /// <summary>Registers a connection. A user can hold several at once (multiple tabs/devices).</summary>
        void Add(Guid userId, string connectionId);

        /// <summary>Drops a connection and forgets the user once their last one goes away.</summary>
        void Remove(Guid userId, string connectionId);

        /// <summary>True when the user has at least one live connection on this instance.</summary>
        bool IsOnline(Guid userId);

        int ConnectionCount(Guid userId);

        int OnlineUserCount { get; }
    }
}
