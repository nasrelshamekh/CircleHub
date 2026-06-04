import { useState } from "react";

import users from "@/data/users";
import networks from "@/data/network";
import ExploreSearch from "@/components/explore/ExploreSearch";
import ExploreTabs from "@/components/explore/ExploreTabs";
import { useAuth } from "@/hooks/useAuth";
import { useCommunities } from "@/hooks/useCommunities";
import { usePosts } from "@/hooks/usePosts";
import { toast } from "sonner";

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const { communities, setCommunities } = useCommunities();
  const { userData } = useAuth();
  const { posts } = usePosts();

  function handleCommunityMembershipChange(communityId) {
    const selectedCommunity = communities.find((community) => community.id === communityId);
    if (!selectedCommunity) return;

    setCommunities((currentCommunities) =>
      currentCommunities.map((community) => {
        if (community.id !== communityId) return community;

        if (community.membershipStatus === "joined") {
          return {
            ...community,
            membershipStatus: "not_joined",
            members: community.members.filter((member) => member.id !== userData.id),
          };
        }

        if (community.membershipStatus === "requested") {
          return {
            ...community,
            membershipStatus: "not_joined",
            requests: community.requests.filter((request) => request.user.id !== userData.id),
          };
        }

        if (community.visibility === "private") {
          return {
            ...community,
            membershipStatus: "requested",
            requests: [
              ...community.requests,
              {
                id: Date.now(),
                user: userData,
                requestedAt: "Just now",
                note: "Requested to join this community.",
              },
            ],
          };
        }

        return {
          ...community,
          membershipStatus: "joined",
          members: [
            ...community.members,
            {
              ...userData,
              communityRole: "member",
            },
          ],
        };
      })
    );

    if (selectedCommunity.membershipStatus === "joined") {
      toast.success(`You left ${selectedCommunity.name}`);
      return;
    }

    if (selectedCommunity.membershipStatus === "requested") {
      toast.success(`Request cancelled for ${selectedCommunity.name}`);
      return;
    }

    toast.success(
      selectedCommunity.visibility === "private"
        ? `Request sent to ${selectedCommunity.name}`
        : `Joined ${selectedCommunity.name}`
    );
  }

  const normalizedQuery = searchQuery.toLowerCase().trim();
  const currentUserNetwork = networks.find((network) => network.username === userData.username);
  const followingUsers = currentUserNetwork?.following || [];
  const followingUsernames = followingUsers.map((user) => user.username);
  const displayPosts = posts.map((post) =>
    post.author.id === userData.id
      ? { ...post, author: userData, authorUsername: userData.username }
      : post
  );
  const searchableUsers = users
    .filter((user) => user.id !== userData.id)
    .map((user) => ({
      ...user,
      isFollowing: followingUsernames.includes(user.username),
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
        searchQuery={searchQuery}
      />
    </section>
  );
}
