namespace CircleHub.Api.Enums
{
    /// <summary>
    /// What produced a <see cref="Entities.Notification"/>. The value is what the client switches on to
    /// pick its wording and its link, so renaming a member changes the app's copy and needs the client
    /// updated in the same change.
    /// </summary>
    public enum NotificationType
    {
        /// <summary>The actor started following the recipient.</summary>
        Follow,

        /// <summary>The actor liked the recipient's post.</summary>
        PostLike,

        /// <summary>The actor commented on the recipient's post.</summary>
        PostComment,

        /// <summary>The actor asked to join a community the recipient administers or moderates.</summary>
        CommunityJoinRequested,

        /// <summary>The recipient's request to join a community was approved.</summary>
        CommunityJoinRequestApproved,

        /// <summary>The recipient's request to join a community was declined.</summary>
        CommunityJoinRequestRejected,

        /// <summary>The actor removed the recipient from a community.</summary>
        CommunityMemberRemoved,

        /// <summary>The actor changed the recipient's role in a community.</summary>
        CommunityRoleChanged,

        /// <summary>The actor, acting as a moderator, removed the recipient's post from a community.</summary>
        CommunityPostRemoved
    }
}
