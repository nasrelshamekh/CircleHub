import ProfileHeader from "@/components/profile/ProfileHeader"
import ProfileInfoPanels from "@/components/profile/ProfileInfoPanels"
import ProfileTabs from "@/components/profile/ProfileTabs"
import users from "@/data/users"
import { useAuth } from "@/hooks/useAuth"
import { usePosts } from "@/hooks/usePosts"
import { useParams } from "react-router-dom"

export default function Profile() {
    const { username } = useParams();
    const { userData } = useAuth();
    const { posts } = usePosts();
    const routeUser = users.find((user) => user.username === username);
    const user = username === userData.username || routeUser?.id === userData.id ? userData : routeUser;
    const isCurrentUser = user?.id === userData.id;
    const profilePosts = posts.map((post) =>
        post.author.id === userData.id
            ? { ...post, author: userData, authorUsername: userData.username }
            : post
    );

    if (!user) {
        return (
            <section className="content-stack max-w-4xl">
                <div className="content-card-padded text-center">
                    <h1 className="type-headline-md text-primary">Profile not found</h1>
                    <p className="type-body-sm-readable mt-2 text-secondary">
                        The profile you are looking for does not exist.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <>
            <section className="w-full pb-20 lg:pb-0">
                <ProfileHeader user={user} isCurrentUser={isCurrentUser} />

                <div className="mx-auto grid w-full max-w-7xl grid-cols-4 gap-6 p-6">
                    <div className="order-2 lg:order-1 col-span-4 lg:col-span-3">
                        <ProfileTabs user={user} posts={profilePosts} />
                    </div>

                    <div className="order-1 lg:order-2 col-span-4 lg:col-span-1">
                        <ProfileInfoPanels user={user} />
                    </div>

                </div>
            </section>
        </>
    )
}
