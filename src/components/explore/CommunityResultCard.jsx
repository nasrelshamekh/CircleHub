import { Link } from "react-router-dom";
import { Check, Clock, FileText, Hash, Lock, Settings, ShieldUser, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";

export default function CommunityResultCard({ community, onMembershipChange }) {
  const { userData } = useAuth();
  const isJoined = community.membershipStatus === "joined";
  const isRequested = community.membershipStatus === "requested";
  const isPrivate = community.visibility === "private";
  const isAdmin = community.admin.id === userData.id;
  const displayAdmin = isAdmin ? userData : community.admin;
  const actionLabel = isAdmin ? "Manage" : isJoined ? "Leave" : isRequested ? "Requested" : isPrivate ? "Request" : "Join";
  const membersCount = community.members.length;
  const { communityPosts } = useCommunityPosts();
  const postsCount = communityPosts.filter((post) => post.communitySlug === community.slug).length;

  return (
    <div className="content-card-padded flex min-w-0 flex-col gap-4 overflow-hidden">
      <div className="flex items-start gap-4">
        <Link to={`/communities/${community.slug}`} className="shrink-0">
          <img
            src={community.image}
            alt={community.name}
            className="h-20 w-20 rounded-lg object-cover sm:h-24 sm:w-24"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <Link
              to={`/communities/${community.slug}`}
              className="min-w-0 text-(length:--text-body-md) font-semibold text-(--text-primary) transition hover:text-(--primary)"
            >
              <span className="block truncate">{community.name}</span>
            </Link>

            <span className="type-label-sm shrink-0 rounded-full bg-(--active) px-3 py-1 text-(--primary)">
              {community.category}
            </span>
          </div>

          <p className="mt-1 flex items-center gap-1.5 text-(length:--text-label-sm) text-(--text-secondary)">
            <Hash size={14} />
            {community.slug}
          </p>
        </div>
      </div>

      <p className="line-clamp-2 text-(length:--text-body-sm) leading-6 text-(--text-secondary)">
        {community.description}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-(length:--text-label-sm) text-(--text-secondary)">
        <span className="flex items-center gap-1.5">
          <Users size={15} />
          {membersCount} members
        </span>

        <span className="flex items-center gap-1.5">
          <FileText size={15} />
          {postsCount} posts
        </span>

        <span className="flex items-center gap-1.5">
          {isPrivate ? <Lock size={15} /> : <Hash size={15} />}
          {isPrivate ? "Private" : "Public"}
        </span>
      </div>

      <Link
        to={`/profile/${displayAdmin.username}`}
        className="flex min-w-0 items-center gap-2 rounded-lg bg-(--surface-low) px-3 py-2 transition hover:bg-(--hover)"
      >
        <img
          src={displayAdmin.avatar}
          alt={displayAdmin.name}
          className="h-8 w-8 shrink-0 rounded-full object-cover"
        />

        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-(length:--text-label-sm) font-semibold text-(--text-primary)">
            <ShieldUser size={14} />
            Admin
          </p>
          <p className="truncate text-(length:--text-label-sm) text-(--text-secondary)">
            {displayAdmin.name} &bull; {displayAdmin.role}
          </p>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-3 border-t border-(--border) pt-3">
        <span className="text-(length:--text-label-sm) text-(--text-secondary)">
          {isAdmin
            ? "Managed by you"
            : isJoined
            ? "You're a member"
            : isRequested
              ? "Waiting for approval"
              : isPrivate
                ? "Approval required"
                : "Open community"}
        </span>

        {isAdmin ? (
          <Link
            to={`/communities/${community.slug}/manage`}
            className="button-primary flex shrink-0 items-center justify-center gap-2 px-4 py-2 text-(length:--text-label-sm) font-medium"
          >
            <Settings size={15} />
            {actionLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onMembershipChange(community.id)}
            className={`flex cursor-pointer shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-(length:--text-label-sm) font-medium transition ${
              isJoined
                ? "bg-(--surface-low) text-(--error) hover:bg-(--error-container) hover:text-(--on-error-container)"
                : isRequested
                  ? "bg-(--surface-low) text-(--text-secondary) hover:bg-(--hover) hover:text-(--primary)"
                  : "button-primary"
            }`}
          >
            {isJoined && <Check size={15} />}
            {isRequested && <Clock size={15} />}
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
