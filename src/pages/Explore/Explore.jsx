import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import ExploreSearch from "@/components/explore/ExploreSearch";
import ExploreTabs from "@/components/explore/ExploreTabs";
import { useSearch } from "@/hooks/useSearch";
import { useToggleCommunityMembership } from "@/hooks/mutations/useToggleCommunityMembership";
import { useToggleLike } from "@/hooks/mutations/useToggleLike";

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const urlTab = searchParams.get("tab") || "all";
  const urlSort = searchParams.get("sort") || "latest";

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [activeTab, setActiveTab] = useState(urlTab);
  const [sort, setSort] = useState(urlSort);
  const [mediaOnly, setMediaOnly] = useState(false);

  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  if (prevUrlQuery !== urlQuery) {
    setPrevUrlQuery(urlQuery);
    setSearchQuery(urlQuery);
  }

  const { users, communities, posts, isLoading } = useSearch({
    q: searchQuery,
    type: activeTab,
    sort,
    mediaOnly: mediaOnly || activeTab === "media",
  });

  const toggleMembership = useToggleCommunityMembership();
  const toggleLike = useToggleLike();

  function handleCommunityMembershipChange(communityId) {
    const community = communities.find((c) => c.id === communityId);
    if (!community) return;
    toggleMembership.mutate({ community });
  }

  function handleQueryChange(query) {
    setSearchQuery(query);
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    setSearchParams(params, { replace: true });
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);
    if (tab && tab !== "all") {
      params.set("tab", tab);
    } else {
      params.delete("tab");
    }
    setSearchParams(params, { replace: true });
  }

  function handleSortChange(newSort) {
    setSort(newSort);
    const params = new URLSearchParams(searchParams);
    if (newSort && newSort !== "latest") {
      params.set("sort", newSort);
    } else {
      params.delete("sort");
    }
    setSearchParams(params, { replace: true });
  }

  return (
    <section className="content-stack max-w-7xl">
      <div className="text-center">
        <h1 className="type-headline-responsive text-primary">Explore</h1>

        <p className="type-body-md mt-2 text-secondary">
          Search for posts, people, communities, and media across CircleHub.
        </p>
      </div>

      <ExploreSearch
        searchQuery={searchQuery}
        setSearchQuery={handleQueryChange}
      />

      <ExploreTabs
        posts={posts}
        users={users}
        communities={communities}
        onCommunityMembershipChange={handleCommunityMembershipChange}
        onToggleLike={(id) => toggleLike.mutate(id)}
        searchQuery={searchQuery}
        isLoading={isLoading}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        sort={sort}
        onSortChange={handleSortChange}
        mediaOnly={mediaOnly}
        onMediaOnlyChange={setMediaOnly}
      />
    </section>
  );
}
