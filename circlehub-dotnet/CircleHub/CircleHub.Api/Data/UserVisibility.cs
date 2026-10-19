using CircleHub.Api.Dtos;
using CircleHub.Api.Enums;

namespace CircleHub.Api.Data
{
    /// <summary>
    /// Rules for what a viewer may see on a profile their visibility setting locks.
    ///
    /// The public part of a profile is everything the profile card shows: id, name, username,
    /// job title, avatar, cover image, bio, location, skills, join date, the follower /
    /// following / post counters, the relationship flags and the lock state itself. Locked
    /// accounts stay discoverable in search and suggestions with those fields.
    ///
    /// The details that only appear behind the profile's tabs are withheld: website, gender
    /// and date of birth are sent only to viewers who may open the profile's content, which
    /// is the same rule that gates the posts, liked posts, communities and social lists.
    /// </summary>
    public static class UserVisibility
    {
        /// <summary>
        /// Whether <paramref name="viewerId"/> may see the content of the profile owned by
        /// <paramref name="ownerId"/>. Callers that only have the relationship at hand can
        /// pass it as <paramref name="viewerFollowsOwner"/> instead of re-querying it.
        /// </summary>
        public static bool CanViewContent(
            ProfileVisibility visibility,
            Guid ownerId,
            Guid viewerId,
            bool viewerFollowsOwner) =>
            visibility == ProfileVisibility.Public ||
            ownerId == viewerId ||
            (visibility == ProfileVisibility.Followers && viewerFollowsOwner);

        public static void StripLockedDetails(UserProfileDto profile, bool canViewContent)
        {
            if (canViewContent)
                return;

            profile.Website = null;
            profile.Gender = null;
            profile.DateOfBirth = null;
        }

        public static void StripLockedDetails(SearchUserDto result, bool canViewContent)
        {
            if (canViewContent)
                return;

            result.Website = null;
            result.Gender = null;
            result.DateOfBirth = null;
        }
    }
}
