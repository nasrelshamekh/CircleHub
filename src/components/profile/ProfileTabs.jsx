import { Grid2X2, Heart, Image, Info } from "lucide-react";

import PostCard from "@/components/post/Post";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Link } from "react-router-dom";

const tabs = [
    {
        value: "posts",
        label: "Posts",
        icon: Grid2X2,
    },
    {
        value: "media",
        label: "Media",
        icon: Image,
    },
    {
        value: "liked",
        label: "Liked",
        icon: Heart,
    },
    {
        value: "about",
        label: "About",
        icon: Info,
    },
];

export default function ProfileTabs({ user, posts, onToggleLike }) {
    const userPosts = posts.filter((post) => post.author.id === user.id);
    const mediaPosts = posts.filter((post) => post.author.id === user.id && post.image);
    const likedPosts = posts.filter((post) => post.likedBy?.includes(user.id));

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
                {userPosts.length > 0 ? (
                    userPosts.map((post) => <PostCard key={post.id} post={post} onToggleLike={onToggleLike} />)
                ) : (
                    <div className="content-card-padded flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <Grid2X2 size={24} />
                        </div>

                        <h3 className="type-title-lg text-primary">
                            No posts yet
                        </h3>

                        <p className="type-body-sm-readable mt-2 max-w-sm text-secondary">
                            Posts shared by this user will appear here.
                        </p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="media">
                {mediaPosts.length > 0 ? (
                    <div className="content-card-padded">
                        <h2 className="type-title-lg mb-4 text-primary">
                            Media
                        </h2>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {mediaPosts.map((post) => (
                                <img
                                    key={post.id}
                                    src={post.image}
                                    alt="Post media"
                                    className="aspect-square w-full rounded-lg object-cover"
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="content-card-padded flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <Image size={24} />
                        </div>

                        <h3 className="type-title-lg text-primary">
                            No media yet
                        </h3>

                        <p className="type-body-sm-readable mt-2 max-w-sm text-secondary">
                            Photo and image posts will appear here.
                        </p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="liked" className="space-y-5">
                {likedPosts.length > 0 ? (
                    likedPosts.map((post) => <PostCard key={post.id} post={post} onToggleLike={onToggleLike} />)
                ) : (
                    <div className="content-card-padded flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <Heart size={24} />
                        </div>

                        <h3 className="type-title-lg text-primary">
                            No liked posts yet
                        </h3>

                        <p className="type-body-sm-readable mt-2 max-w-sm text-secondary">
                            Liked posts will appear here.
                        </p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="about">
                <div className="content-card-padded">
                    <h2 className="type-headline-md mb-2 text-(--primary)">
                        About
                    </h2>

                    <p className="type-body-md max-w-2xl text-secondary">
                        {user.bio}
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                        {/* DETAILS LEFT */}
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                                <span className="type-label-md w-32 text-(--primary)">
                                    Full Name:
                                </span>

                                <span className="type-body-sm-readable flex-1 text-secondary">
                                    {user.name}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                                <span className="type-label-md w-32 text-(--primary)">
                                    Username:
                                </span>

                                <span className="type-body-sm-readable flex-1 break-all text-secondary">
                                    @{user.username}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                                <span className="type-label-md w-32 text-(--primary)">
                                    Gender:
                                </span>

                                <span className="type-body-sm-readable flex-1 text-secondary">
                                    {user.gender === "male" ? "Male" : "Female"}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                                <span className="type-label-md w-32 text-(--primary)">
                                    Email:
                                </span>

                                <span className="type-body-sm-readable flex-1 break-all text-secondary">
                                    {user.email}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                                <span className="type-label-md w-32 text-(--primary)">
                                    Date of Birth:
                                </span>

                                <span className="type-body-sm-readable flex-1 text-secondary">
                                    {new Date(user.dateOfBirth).toLocaleString("en-US", {
                                        dateStyle: "long",
                                    })}
                                </span>
                            </div>
                        </div>

                        {/* DETAILS RIGHT */}
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                                <span className="type-label-md w-32 text-(--primary)">
                                    Role:
                                </span>

                                <span className="type-body-sm-readable flex-1 text-secondary">
                                    {user.role}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                                <span className="type-label-md w-32 text-(--primary)">
                                    Location:
                                </span>

                                <span className="type-body-sm-readable flex-1 text-secondary">
                                    {user.location}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                                <span className="type-label-md w-32 text-(--primary)">
                                    Joined:
                                </span>

                                <span className="type-body-sm-readable flex-1 text-secondary">
                                    {user.joinedAt}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                                <span className="type-label-md w-32 text-(--primary)">
                                    Website:
                                </span>

                                <Link to="#" className="type-body-sm-readable flex-1 break-all font-medium text-(--primary) transition hover:underline">
                                    {user.website}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    );
}
