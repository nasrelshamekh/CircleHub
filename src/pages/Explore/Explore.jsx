import { useState } from "react";

import users from "@/data/users";
import ExploreSearch from "@/components/explore/ExploreSearch";
import ExploreTabs from "@/components/explore/ExploreTabs";
import { useAuth } from "@/hooks/useAuth";
import { useCommunities } from "@/hooks/useCommunities";
import { usePosts } from "@/hooks/usePosts";
import { getCommunityMembershipToast, updateCommunityMembership } from "@/lib/communityMembership";
import { togglePostLikeInList } from "@/lib/postLikes";
import { toast } from "sonner";

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const { communities, setCommunities } = useCommunities();
  const { userData } = useAuth();
  const { posts, setPosts } = usePosts();

  const normalizedQuery = searchQuery.toLowerCase().trim();
  const followingIds = userData.followingIds || [];
  const displayPosts = posts.map((post) =>
    post.author.id === userData.id
      ? { ...post, author: userData, authorUsername: userData.username }
      : post
  );
  const searchableUsers = users
    .filter((user) => user.id !== userData.id)
    .map((user) => ({
      ...user,
      isFollowing: followingIds.includes(user.id),
    }));

  const filteredPosts = displayPosts.filter((post) => {
    return (
      post.content.toLowerCase().includes(normalizedQuery) ||
      post.author.name.toLowerCase().includes(normalizedQuery)
    );
  });

  const filteredUsers = searchableUsers.filter((user) => {
    return (
      user.name.toLowerCase().includes(normalizedQuery) ||
      user.username.toLowerCase().includes(normalizedQuery) ||
      user.role.toLowerCase().includes(normalizedQuery) ||
      user.location.toLowerCase().includes(normalizedQuery) ||
      user.bio.toLowerCase().includes(normalizedQuery)
    );
  });

  const filteredCommunities = communities.filter((community) => {
    return (
      community.name.toLowerCase().includes(normalizedQuery) ||
      community.category.toLowerCase().includes(normalizedQuery) ||
      community.description.toLowerCase().includes(normalizedQuery) ||
      community.admin.name.toLowerCase().includes(normalizedQuery)
    );
  });

  function handleCommunityMembershipChange(communityId) {
    const selectedCommunity = communities.find((community) => community.id === communityId);

    if (!selectedCommunity) return;

    setCommunities((currentCommunities) =>
      updateCommunityMembership(currentCommunities, communityId, userData)
    );

    toast.success(getCommunityMembershipToast(selectedCommunity));
  }

  function toggleLike(postId) {
    setPosts((currentPosts) =>
      togglePostLikeInList(currentPosts, postId, userData.id)
    );
  }

  return (
    <section className="content-stack max-w-7xl">
      <div className="text-center">
        <h1 className="type-headline-responsive text-primary">
          Explore
        </h1>

        <p className="type-body-md mt-2 text-secondary">
          Search for posts, people, and communities across CircleHub.
        </p>
      </div>

      <ExploreSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <ExploreTabs
        posts={filteredPosts}
        users={filteredUsers}
        communities={filteredCommunities}
        onCommunityMembershipChange={handleCommunityMembershipChange}
        onToggleLike={toggleLike}
        searchQuery={searchQuery}
      />
    </section>
  );
}
