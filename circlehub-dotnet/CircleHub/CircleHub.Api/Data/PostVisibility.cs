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
                return posts.Where(p => p.CommunityId == null);

            var viewer = viewerId.Value;

            return posts.Where(p =>
                p.CommunityId == null ||
                p.Community!.Visibility == CommunityVisibility.Public ||
                p.Community!.AdminId == viewer ||
                p.Community!.Members.Any(m => m.UserId == viewer));
        }
    }
}
