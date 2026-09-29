import SuggestedItem from './SuggestedItem'
import { useSuggestedUsers } from '@/hooks/useSuggestedUsers'

const SUGGESTED_PEOPLE_LIMIT = 5;

export default function SuggestedCard() {
    const { suggestedUsers } = useSuggestedUsers();

    const visibleUsers = suggestedUsers.slice(0, SUGGESTED_PEOPLE_LIMIT);

    if (visibleUsers.length === 0) return null;

    return (
        <div className="content-card p-4">
            <h2 className="type-title-lg mb-4 text-primary">
                Suggested People
            </h2>

            <div className="space-y-3">
                {visibleUsers.map((user) => (
                    <SuggestedItem
                        key={user.id}
                        user={user}
                    />
                ))}
            </div>
        </div>
    )
}
