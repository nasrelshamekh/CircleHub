import { Users, UserCheck } from "lucide-react";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

import FollowUserCard from "./FollowUserCard";

export default function FollowersTabs({
    followers,
    following,
    activeTab = "followers",
    onTabChange,
}) {
    return (
        <Tabs value={activeTab} onValueChange={onTabChange} className="min-w-0">
            <div className="py-2">
                <TabsList className="sm:grid-cols-2">
                    <TabsTrigger value="followers">
                        <Users size={16} />
                        Followers
                    </TabsTrigger>

                    <TabsTrigger value="following">
                        <UserCheck size={16} />
                        Following
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent
                value="followers"
                className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
                {followers.length > 0 ? (
                    followers.map((user) => (
                        <FollowUserCard key={user.id} user={user} />
                    ))
                ) : (
                    <div className="content-card-padded col-span-full flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <Users size={24} />
                        </div>

                        <h3 className="type-title-lg text-primary">
                            No followers yet
                        </h3>

                        <p className="type-body-sm-readable mt-2 max-w-sm text-secondary">
                            People will appear here when this profile has followers.
                        </p>
                    </div>
                )}
            </TabsContent>

            <TabsContent
                value="following"
                className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
                {following.length > 0 ? (
                    following.map((user) => (
                        <FollowUserCard key={user.id} user={user} />
                    ))
                ) : (
                    <div className="content-card-padded col-span-full flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <UserCheck size={24} />
                        </div>

                        <h3 className="type-title-lg text-primary">
                            No following yet
                        </h3>

                        <p className="type-body-sm-readable mt-2 max-w-sm text-secondary">
                            People will appear here when this profile is following someone.
                        </p>
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
}
