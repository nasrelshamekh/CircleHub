import { FileText, Image, Info, Users } from "lucide-react";
import { Link } from "react-router-dom";

import CreatePost from "@/components/createpost/CreatePost";
import PostCard from "@/components/post/Post";
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
        value: "members",
        label: "Members",
        icon: Users,
    },
    {
        value: "media",
        label: "Media",
        icon: Image,
    },
    {
        value: "about",
        label: "About",
        icon: Info,
    },
];

export default function CommunityTabs({
    community,
    members,
    posts,
    userData,
    canManagePosts,
    onDeletePost,
    canCreatePost,
    onCreatePost,
}) {
    const mediaPosts = posts.filter((post) => post.image);

    return (
        <Tabs defaultValue="posts" className="min-w-0">
            <div className="py-2">
                <TabsList>
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

            <TabsContent value="posts" className="space-y-5">
                {canCreatePost && (
                    <CreatePost onCreatePost={onCreatePost} community={community} />
                )}

                {posts.length > 0 ? (
                    posts.map((post) => {
                        const isPostOwner = post.author.id === userData.id;
                        const canDeletePost = canManagePosts || isPostOwner;

                        return (
                            <PostCard
                                key={post.id}
                                post={post}
                                onDelete={canDeletePost ? onDeletePost : undefined}
                                canDelete={canDeletePost}
                            />
                        );
                    })
                ) : (
                    <div className="content-card-padded flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <FileText size={24} />
                        </div>

                        <h3 className="type-title-lg text-primary">No posts yet</h3>
                        <p className="type-body-sm-readable mt-2 max-w-sm text-secondary">
                            Community posts will appear here.
                        </p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="members">
                <div className="content-card-padded">
                    <h2 className="type-title-lg mb-4 text-primary">Members</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {members.map((member) => {
                            const displayMember =
                                member.id === userData.id ? userData : member;

                            return (
                                <Link
                                    key={member.id}
                                    to={`/profile/${displayMember.username}`}
                                    className="flex min-w-0 items-center gap-3 rounded-xl bg-(--surface-low) p-3 transition hover:bg-(--hover)"
                                >
                                    <img
                                        src={displayMember.avatar}
                                        alt={displayMember.name}
                                        className="avatar-lg"
                                    />
                                    <div className="min-w-0">
                                        <h3 className="type-label-md truncate text-primary">
                                            {displayMember.name}
                                        </h3>
                                        <p className="type-label-sm truncate text-secondary">
                                            {displayMember.role}
                                        </p>
                                        <p className="type-label-sm truncate text-secondary">
                                            {displayMember.location}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="media">
                {mediaPosts.length > 0 ? (
                    <div className="content-card-padded">
                        <h2 className="type-title-lg mb-4 text-primary">Media</h2>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {mediaPosts.map((post) => (
                                <Link key={post.id} to={`/post/${post.id}`}>
                                    <img
                                        src={post.image}
                                        alt="Community post media"
                                        className="aspect-square w-full rounded-lg object-cover"
                                    />
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="content-card-padded flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <Image size={24} />
                        </div>

                        <h3 className="type-title-lg text-primary">No media yet</h3>
                        <p className="type-body-sm-readable mt-2 max-w-sm text-secondary">
                            Photo and image posts will appear here.
                        </p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="about">
                <div className="content-card-padded">
                    <h2 className="type-headline-md mb-2 text-(--primary)">About</h2>
                    <p className="type-body-md max-w-2xl text-secondary">
                        {community.description}
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                            <span className="type-label-md w-32 text-(--primary)">Name:</span>
                            <span className="type-body-sm-readable flex-1 text-secondary">
                                {community.name}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                            <span className="type-label-md w-32 text-(--primary)">Slug:</span>
                            <span className="type-body-sm-readable flex-1 text-secondary">
                                {community.slug}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                            <span className="type-label-md w-32 text-(--primary)">Category:</span>
                            <span className="type-body-sm-readable flex-1 text-secondary">
                                {community.category}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                            <span className="type-label-md w-32 text-(--primary)">Visibility:</span>
                            <span className="type-body-sm-readable flex-1 text-secondary">
                                {community.visibility === "private" ? "Private" : "Public"}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                            <span className="type-label-md w-32 text-(--primary)">Members:</span>
                            <span className="type-body-sm-readable flex-1 text-secondary">
                                {members.length}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                            <span className="type-label-md w-32 text-(--primary)">Posts:</span>
                            <span className="type-body-sm-readable flex-1 text-secondary">
                                {posts.length}
                            </span>
                        </div>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    );
}
