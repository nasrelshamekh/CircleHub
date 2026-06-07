import { Link, MapPin, Network } from "lucide-react";

import CommunityCardItem from "@/components/communitycard/CommunityCardItem";
import { useCommunities } from "@/hooks/useCommunities";

export default function ProfileInfoPanels({ user }) {
  const { communities } = useCommunities();
  const skills = user.skills || [];
  const mutualConnections = user.mutualConnections || [];
  const mutualConnectionsCount = mutualConnections.length;
  const userCommunities = communities.filter((community) => {
    const members = community.members || [];
    const isMember = members.some((member) => member.id === user.id);
    const isAdmin = community.admin.id === user.id;

    return isMember || isAdmin;
  });

  return (
    <aside className="space-y-5">
      <div className="content-card-padded">
        <h2 className="type-title-lg text-primary">
          Skills & Interests
        </h2>

        {skills.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="type-label-sm rounded-full bg-(--active) px-3 py-1.5 text-(--primary)"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="type-body-sm-readable mt-4 text-secondary">
            No skills or interests added yet.
          </p>
        )}

        <div className="type-body-sm mt-5 space-y-3 text-secondary">
          <p className="flex items-center gap-2">
            <MapPin size={18} />
            {user.location}
          </p>

          <p className="flex items-center gap-2">
            <Link size={18} />
            circlehub.dev/{user.username}
          </p>
        </div>
      </div>

      <div className="content-card-padded">
        <h2 className="type-title-lg text-primary">
          Mutual Connections
        </h2>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex -space-x-3">
            {mutualConnections.slice(0, 4).map((mutualUser) => (
              <img
                key={mutualUser.id}
                src={mutualUser.avatar}
                alt={mutualUser.name}
                className="h-10 w-10 rounded-full border-2 border-(--surface-lowest) object-cover"
              />
            ))}
          </div>

          <p className="type-body-sm text-primary">
            {mutualConnectionsCount} mutual connections
          </p>
        </div>
      </div>

      <div className="content-card-padded">
        <h2 className="type-title-lg text-primary">
          Communities
        </h2>

        {userCommunities.length > 0 ? (
          <div className="mt-4 space-y-3">
            {userCommunities.map((community) => {
              const isAdmin = community.admin.id === user.id;

              return (
                <CommunityCardItem
                  key={community.id}
                  community={community}
                  displayOnly
                  showAdminBadge={isAdmin}
                />
              );
            })}
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl bg-(--surface-low) px-4 py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
              <Network size={22} />
            </div>

            <h3 className="type-label-md text-primary">No communities yet</h3>

            <p className="type-body-sm-readable mt-2 text-secondary">
              Communities joined by this user will appear here.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
