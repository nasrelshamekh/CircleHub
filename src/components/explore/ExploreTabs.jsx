import { FileText, Users, Network } from "lucide-react";

import ExplorePostCard from "./ExplorePostCard";
import UserResultCard from "./UserResultCard";
import CommunityResultCard from "./CommunityResultCard";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

const tabs = [
    {
        value: "posts",
        label: "Posts",
        icon: FileText,
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

export default function ExploreTabs({ posts, users, communities, onCommunityMembershipChange, onToggleLike, searchQuery }) {
    return (
        <Tabs defaultValue="posts" className="min-w-0">
            <div className="py-2">
                <TabsList className="sm:grid-cols-3">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <TabsTrigger key={tab.value} value={tab.value}>
                                <Icon size={16} />
                                {tab.label}
                            </TabsTrigger>
                        );})}
                </TabsList>
            </div>

            <TabsContent value="posts" className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {posts.length > 0 ? (
                    posts.map((post) => <ExplorePostCard key={post.id} post={post} onToggleLike={onToggleLike} />)
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
                    </div>)}
            </TabsContent>

            <TabsContent value="users" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {users.length > 0 ? (
                    users.map((user) => <UserResultCard key={user.id} user={user} />)
                ) : (
                    <div className="content-card-padded col-span-full flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <Users size={24} />
                        </div>

                        <h3 className="type-title-lg text-primary">No people found</h3>

                        <p className="type-body-sm-readable mt-2 max-w-sm text-secondary">
                            {searchQuery
                                ? "Try searching by name, username, or role."
                                : "Suggested people will appear here."}
                        </p>
                    </div>)}
            </TabsContent>

            <TabsContent value="communities" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {communities.length > 0 ? (
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

                        <h3 className="type-title-lg text-primary">
                            No communities found
                        </h3>

                        <p className="type-body-sm-readable mt-2 max-w-sm text-secondary">
                            {searchQuery
                                ? "Try searching by community name or category."
                                : "Communities will appear here."}
                        </p>
                    </div>)}
            </TabsContent>
        </Tabs>
    );
}
