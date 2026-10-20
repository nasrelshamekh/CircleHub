namespace CircleHub.Api.Entities
{
    /// <summary>
    /// One mobile install's Expo push token (<c>ExponentPushToken[…]</c> or <c>ExpoPushToken[…]</c>).
    /// A user can be signed in on multiple phones or tablets at once, so a user has zero or more rows here.
    /// <para>
    /// The unique index is on <see cref="Token"/> rather than <c>(UserId, Token)</c>: a push token identifies
    /// a physical app install, so if a second account signs in on the same phone before the first account
    /// could unregister, the upsert rebinds the token to the new user instead of delivering the previous
    /// user's notifications to that device. Stale rows are removed on sign-out and whenever the Expo Push
    /// Service reports <c>DeviceNotRegistered</c>.
    /// </para>
    /// </summary>
    public class DeviceToken
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        /// <summary>Expo push token string, e.g. <c>ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]</c>.</summary>
        public string Token { get; set; } = null!;

        /// <summary>Client platform (<c>ios</c> or <c>android</c>).</summary>
        public string Platform { get; set; } = null!;

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
