import { Link } from "react-router-dom";
import { MapPin, Users } from "lucide-react";
import FollowButton from "../followers/FollowButton";

export default function UserResultCard({ user }) {
  return (
    <div className="content-card-padded flex min-w-0 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <Link to={`/profile/${user.username}`} className="flex min-w-0 items-start gap-3">
          <img
            src={user.avatar}
            alt={user.name}
            className="h-14 w-14 shrink-0 rounded-full object-cover"
          />

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-(length:--text-body-md) font-semibold text-(--text-primary)">
              {user.name}
            </h3>

            <p className="truncate text-(length:--text-label-sm) font-medium text-(--primary)">
              {user.role}
            </p>

            <p className="truncate text-(length:--text-label-sm) text-(--text-secondary)">
              @{user.username}
            </p>
          </div>
        </Link>

        <FollowButton user={user} />
      </div>

      <p className="line-clamp-2 text-(length:--text-body-sm) leading-6 text-(--text-secondary)">
        {user.bio}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-(length:--text-label-sm) text-(--text-secondary)">
        <span className="flex min-w-0 items-center gap-1.5">
          <MapPin size={15} />
          <span className="truncate">{user.location}</span>
        </span>

        <span className="flex items-center gap-1.5">
          <Users size={15} />
          {user.followersCount.toLocaleString()} followers
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-(--border) pt-3">
        <span className="text-(length:--text-label-sm) text-(--text-secondary)">
          {user.postsCount} posts
        </span>

        <div className="flex items-center gap-2">
          <span className="text-(length:--text-label-sm) text-(--text-secondary)">
            {user.followingCount.toLocaleString()} following
          </span>
        </div>
      </div>
    </div>
  );
}
