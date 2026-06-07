import SuggestedItem from './SuggestedItem'
import suggestedUsers from '@/data/suggestedUsers'
import { useAuth } from '@/hooks/useAuth'


export default function SuggestedCard() {

    const { userData } = useAuth();
    const followingIds = userData.followingIds || [];
    const filteredUsers = suggestedUsers
        .map((user) => ({
            ...user,
            isFollowing: followingIds.includes(user.id),
        }))
        .filter((user) => !user.isFollowing);

    if (filteredUsers.length === 0) return null;

    return (
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
    )
}
