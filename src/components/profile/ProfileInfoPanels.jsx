import { motion } from "motion/react";
import { ChevronDown, ChevronUp, Link as LinkIcon, MapPin, Network } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

import CommunityCardItem from "@/components/communitycard/CommunityCardItem";
import { useCommunities } from "@/hooks/useCommunities";

const CONNECTIONS_PREVIEW_LIMIT = 5;

export default function ProfileInfoPanels({
  user,
  connections = [],
  connectionsTitle = "Mutual Connections",
}) {
  const { communities } = useCommunities();
  const [showAllConnections, setShowAllConnections] = useState(false);
  const skills = user.skills || [];
  const connectionsCount = connections.length;
  const previewConnections = connections.slice(0, CONNECTIONS_PREVIEW_LIMIT);
  const extraConnections = connections.slice(CONNECTIONS_PREVIEW_LIMIT);
  const hasMoreConnections = connectionsCount > CONNECTIONS_PREVIEW_LIMIT;
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
            <LinkIcon size={18} />
            circlehub.dev/{user.username}
          </p>
        </div>
      </div>

      <div className="content-card-padded">
        <h2 className="type-title-lg text-primary">
          {connectionsTitle}
        </h2>

        {connectionsCount > 0 ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex -space-x-3">
                {previewConnections.map((connectionUser) => (
                  <Link
                    key={connectionUser.id}
                    to={`/profile/${connectionUser.username}`}
                    aria-label={`View ${connectionUser.name}'s profile`}
                    title={connectionUser.name}
                    className="transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)"
                  >
                    <img
                      src={connectionUser.avatar}
                      alt={connectionUser.name}
                      className="h-10 w-10 rounded-full border-2 border-(--surface-lowest) object-cover"
                    />
                  </Link>
                ))}
              </div>

              <p className="type-body-sm text-primary">
                {connectionsCount} {connectionsCount === 1 ? "connection" : "connections"}
              </p>
            </div>

            {hasMoreConnections && (
              <motion.div
                initial={false}
                animate={{
                  gridTemplateRows: showAllConnections ? "1fr" : "0fr",
                  opacity: showAllConnections ? 1 : 0,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`grid ${showAllConnections ? "" : "pointer-events-none"}`}
                aria-hidden={!showAllConnections}
                inert={!showAllConnections}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-wrap gap-2 pt-1">
                    {extraConnections.map((connectionUser) => (
                      <Link
                        key={connectionUser.id}
                        to={`/profile/${connectionUser.username}`}
                        aria-label={`View ${connectionUser.name}'s profile`}
                        title={connectionUser.name}
                        className="transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)"
                      >
                        <img
                          src={connectionUser.avatar}
                          alt={connectionUser.name}
                          className="h-10 w-10 rounded-full border-2 border-(--surface-lowest) object-cover"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {hasMoreConnections && (
              <button
                type="button"
                onClick={() => setShowAllConnections((isShowingAll) => !isShowingAll)}
                aria-expanded={showAllConnections}
                className="type-label-sm flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-(--surface-low) px-3 py-2 text-(--primary) transition-colors duration-200 hover:bg-(--hover)"
              >
                {showAllConnections ? "Show less" : `Show ${connectionsCount - CONNECTIONS_PREVIEW_LIMIT} more`}
                {showAllConnections ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>
        ) : (
          <p className="type-body-sm-readable mt-4 text-secondary">
            No connections to show yet.
          </p>
        )}
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
