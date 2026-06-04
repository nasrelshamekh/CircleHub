import SuggestedItem from './SuggestedItem'
import networks from '@/data/network'
import suggestedUsers from '@/data/suggestedUsers'
import { useAuth } from '@/hooks/useAuth'


export default function SuggestedCard() {

    const { userData } = useAuth();
    const currentUserNetwork = networks.find((network) => network.username === userData.username);
    const followingUsers = currentUserNetwork?.following || [];
    const followingUsernames = followingUsers.map((user) => user.username);
    const filteredUsers = suggestedUsers
        .map((user) => ({
            ...user,
            isFollowing: followingUsernames.includes(user.username),
        }))
        .filter((user) => !user.isFollowing);

    return (
        <>
            <div className="content-card p-4">
                <h2 className="type-title-lg mb-4 text-primary">
                    Suggested People
                </h2>

                <div className="space-y-3">
                    {filteredUsers.map((user) => (
                        <SuggestedItem
                            key={user.id}
                            user={user}
                        />
                    ))}
                </div>
            </div>
        </>
    )
}
