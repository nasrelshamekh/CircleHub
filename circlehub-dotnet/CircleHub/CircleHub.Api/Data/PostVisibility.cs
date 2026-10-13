using CircleHub.Api.Entities;
using CircleHub.Api.Enums;

namespace CircleHub.Api.Data
{
    public static class PostVisibility
    {
        public static IQueryable<Post> WhereVisibleTo(
            this IQueryable<Post> posts,
            Guid? viewerId)
        {
            if (viewerId is null)
            {
                return posts.Where(p =>
                    p.CommunityId == null &&
                    p.Author.ProfileVisibility == ProfileVisibility.Public);
            }

            var viewer = viewerId.Value;

            return posts.Where(p =>
                // The post's community has to let the viewer in...
                (p.CommunityId == null ||
                 p.Community!.Visibility == CommunityVisibility.Public ||
                 p.Community!.AdminId == viewer ||
                 p.Community!.Members.Any(m => m.UserId == viewer)) &&
                // ...and so does the author's profile visibility.
                (p.Author.ProfileVisibility == ProfileVisibility.Public ||
                 p.AuthorId == viewer ||
                 (p.Author.ProfileVisibility == ProfileVisibility.Followers &&
                  p.Author.Followers.Any(f => f.FollowerId == viewer))));
        }
    }
}
