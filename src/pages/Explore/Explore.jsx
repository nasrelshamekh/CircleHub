import { useState } from "react";

import ExploreSearch from "@/components/explore/ExploreSearch";
import ExploreTabs from "@/components/explore/ExploreTabs";
import { useSearch } from "@/hooks/useSearch";
import { useToggleCommunityMembership } from "@/hooks/mutations/useToggleCommunityMembership";
import { useToggleLike } from '@/hooks/mutations/useToggleLike'

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const { users, communities, posts, isLoading } = useSearch(searchQuery);
  const toggleMembership = useToggleCommunityMembership();
  const toggleLike = useToggleLike();

  function handleCommunityMembershipChange(communityId) {
    const community = communities.find((c) => c.id === communityId);
    if (!community) return;
    toggleMembership.mutate({ community });
  }

  return (
    <section className="content-stack max-w-7xl">
      <div className="text-center">
        <h1 className="type-headline-responsive text-primary">Explore</h1>

        <p className="type-body-md mt-2 text-secondary">
          Search for posts, people, and communities across CircleHub.
        </p>
      </div>

      <ExploreSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <ExploreTabs
        posts={posts}
        users={users}
        communities={communities}
        onCommunityMembershipChange={handleCommunityMembershipChange}
        onToggleLike={(id) => toggleLike.mutate(id)}
        searchQuery={searchQuery}
        isLoading={isLoading}
      />
    </section>
  );
}
