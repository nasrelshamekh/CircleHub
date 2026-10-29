import {
    FileText,
    Users,
    Network,
    Images,
    Compass,
    Clock,
    Flame,
    ArrowRight,
} from "lucide-react";

import ExplorePostCard from "./ExplorePostCard";
import UserResultCard from "./UserResultCard";
import CommunityResultCard from "./CommunityResultCard";
import ExplorePostCardSkeleton from "@/components/Skeletons/ExplorePostCardSkeleton";
import UserResultCardSkeleton from "@/components/Skeletons/UserResultCardSkeleton";
import CommunityResultCardSkeleton from "@/components/Skeletons/CommunityResultCardSkeleton";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

const tabs = [
    {
        value: "all",
        label: "All",
        icon: Compass,
    },
    {
        value: "posts",
        label: "Posts",
        icon: FileText,
    },
    {
        value: "media",
        label: "Media",
        icon: Images,
    },
    {
        value: "users",
        label: "People",
        icon: Users,
    },
    {
        value: "communities",
        label: "Communities",
        icon: Network,
    },
];

const SKELETON_COUNT = 6;

export default function ExploreTabs({
    posts,
    users,
    communities,
    onCommunityMembershipChange,
    onToggleLike,
    searchQuery,
    isLoading,
    activeTab = "all",
    onTabChange,
    sort = "latest",
    onSortChange,
    mediaOnly = false,
    onMediaOnlyChange,
}) {
    const showPostSkeletons = isLoading && posts.length === 0;
    const showUserSkeletons = isLoading && users.length === 0;
    const showCommunitySkeletons = isLoading && communities.length === 0;

    const mediaPosts = posts.filter(
        (p) => p.imageUrl || (p.imageUrls && p.imageUrls.length > 0)
    );

    const hasAnyResults =
        posts.length > 0 || users.length > 0 || communities.length > 0;

    return (
        <Tabs
            value={activeTab}
            onValueChange={onTabChange}
            className="min-w-0"
        >
            <div className="py-2">
                <TabsList className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <TabsTrigger key={tab.value} value={tab.value}>
                                <Icon size={16} />
                                {tab.label}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </div>

            {/* Filter & Sort Toolbar */}
            {(activeTab === "all" || activeTab === "posts" || activeTab === "media") && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 pb-2">
                    <div className="flex items-center gap-1.5">
                        <span className="type-label-xs text-text-secondary pr-1">Sort:</span>
                        <button
                            type="button"
                            onClick={() => onSortChange?.("latest")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border-0 ${
                                sort === "latest"
                                    ? "gradient-primary text-(--button-gradient-text) shadow-xs"
                                    : "bg-surface-low hover:bg-surface-high text-text-secondary"
                            }`}
                        >
                            <Clock size={13} />
                            <span>Latest</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onSortChange?.("top")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border-0 ${
                                sort === "top"
                                    ? "gradient-primary text-(--button-gradient-text) shadow-xs"
                                    : "bg-surface-low hover:bg-surface-high text-text-secondary"
                            }`}
                        >
                            <Flame size={13} />
                            <span>Top</span>
                        </button>
                    </div>

                    {activeTab === "posts" && (
                        <button
                            type="button"
                            onClick={() => onMediaOnlyChange?.(!mediaOnly)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border-0 ${
                                mediaOnly
                                    ? "bg-(--primary)/15 text-(--primary) ring-1 ring-(--primary)"
                                    : "bg-surface-low hover:bg-surface-high text-text-secondary"
                            }`}
                            title="Filter posts with photos"
                        >
                            <Images size={14} />
                            <span>Photos only</span>
                        </button>
                    )}
                </div>
            )}

            {/* All (Aggregated Overview) */}
            <TabsContent value="all" className="space-y-8">
                {isLoading && !hasAnyResults ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                            <ExplorePostCardSkeleton key={i} />
                        ))}
                    </div>
                ) : !hasAnyResults ? (
                    <div className="content-card-padded col-span-full flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <Compass size={24} />
                        </div>
                        <h3 className="type-title-lg text-primary">No results found</h3>
                        <p className="type-body-sm-readable mt-2 max-w-sm text-secondary">
                            {searchQuery
                                ? `No matches found for "${searchQuery}". Try different keywords or filters.`
                                : "Explore content across CircleHub."}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Matched People Snippet */}
                        {users.length > 0 && (
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="type-label-lg font-bold text-primary flex items-center gap-2">
                                        <Users size={18} className="text-(--primary)" /> People
                                    </h2>
                                    {users.length > 3 && (
                                        <button
                                            type="button"
                                            onClick={() => onTabChange?.("users")}
                                            className="type-label-sm text-(--primary) hover:underline cursor-pointer border-0 bg-transparent flex items-center gap-1"
                                        >
                                            View all ({users.length}) <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {users.slice(0, 3).map((user) => (
                                        <UserResultCard key={user.id} user={user} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Matched Communities Snippet */}
                        {communities.length > 0 && (
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="type-label-lg font-bold text-primary flex items-center gap-2">
                                        <Network size={18} className="text-(--primary)" /> Communities
                                    </h2>
                                    {communities.length > 3 && (
                                        <button
                                            type="button"
                                            onClick={() => onTabChange?.("communities")}
                                            className="type-label-sm text-(--primary) hover:underline cursor-pointer border-0 bg-transparent flex items-center gap-1"
                                        >
                                            View all ({communities.length}) <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {communities.slice(0, 3).map((community) => (
                                        <CommunityResultCard
                                            key={community.id}
                                            community={community}
                                            onMembershipChange={onCommunityMembershipChange}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Posts */}
                        {posts.length > 0 && (
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="type-label-lg font-bold text-primary flex items-center gap-2">
                                        <FileText size={18} className="text-(--primary)" /> Posts
                                    </h2>
                                    {posts.length > 6 && (
                                        <button
                                            type="button"
                                            onClick={() => onTabChange?.("posts")}
                                            className="type-label-sm text-(--primary) hover:underline cursor-pointer border-0 bg-transparent flex items-center gap-1"
                                        >
                                            View all ({posts.length}) <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                    {posts.map((post) => (
                                        <ExplorePostCard
                                            key={post.id}
                                            post={post}
                                            onToggleLike={onToggleLike}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </TabsContent>

            {/* Posts */}
            <TabsContent value="posts" className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {showPostSkeletons ? (
                    Array.from({ length: SKELETON_COUNT }, (_, i) => (
                        <ExplorePostCardSkeleton key={i} />
                    ))
                ) : posts.length > 0 ? (
                    posts.map((post) => (
                        <ExplorePostCard key={post.id} post={post} onToggleLike={onToggleLike} />
                    ))
                ) : (
                    <div className="content-card-padded col-span-full flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <FileText size={24} />
                        </div>
                        <h3 className="type-title-lg text-primary">No posts found</h3>
                        <p className="type-body-sm-readable mt-2 max-w-sm text-secondary">
                            {searchQuery
                                ? "Try searching for another keyword or author."
                                : "Posts will appear here when available."}
                        </p>
                    </div>
                )}
            </TabsContent>

            {/* Media */}
            <TabsContent value="media" className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {showPostSkeletons ? (
                    Array.from({ length: SKELETON_COUNT }, (_, i) => (
                        <ExplorePostCardSkeleton key={i} />
                    ))
                ) : mediaPosts.length > 0 ? (
                    mediaPosts.map((post) => (
                        <ExplorePostCard key={post.id} post={post} onToggleLike={onToggleLike} />
                    ))
                ) : (
                    <div className="content-card-padded col-span-full flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <Images size={24} />
                        </div>
                        <h3 className="type-title-lg text-primary">No media posts found</h3>
                        <p className="type-body-sm-readable mt-2 max-w-sm text-secondary">
                            {searchQuery
                                ? "No posts with photos or galleries matched your search."
                                : "Posts with photos or galleries will appear here."}
                        </p>
                    </div>
                )}
            </TabsContent>

            {/* People */}
            <TabsContent value="users" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {showUserSkeletons ? (
                    Array.from({ length: SKELETON_COUNT }, (_, i) => (
                        <UserResultCardSkeleton key={i} />
                    ))
                ) : users.length > 0 ? (
                    users.map((user) => <UserResultCard key={user.id} user={user} />)
                ) : (
                    <div className="content-card-padded col-span-full flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <Users size={24} />
                        </div>
                        <h3 className="type-title-lg text-primary">No people found</h3>
                        <p className="type-body-sm-readable mt-2 max-w-sm text-secondary">
                            {searchQuery
                                ? "Try searching by name, username, or job title."
                                : "Suggested people will appear here."}
                        </p>
                    </div>
                )}
            </TabsContent>

            {/* Communities */}
            <TabsContent value="communities" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {showCommunitySkeletons ? (
                    Array.from({ length: SKELETON_COUNT }, (_, i) => (
                        <CommunityResultCardSkeleton key={i} />
                    ))
                ) : communities.length > 0 ? (
                    communities.map((community) => (
                        <CommunityResultCard
                            key={community.id}
                            community={community}
                            onMembershipChange={onCommunityMembershipChange}
                        />
                    ))
                ) : (
                    <div className="content-card-padded col-span-full flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <Network size={24} />
                        </div>
                        <h3 className="type-title-lg text-primary">No communities found</h3>
                        <p className="type-body-sm-readable mt-2 max-w-sm text-secondary">
                            {searchQuery
                                ? "Try searching by community name or category."
                                : "Communities will appear here."}
                        </p>
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
}
