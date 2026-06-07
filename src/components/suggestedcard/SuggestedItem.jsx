import { Link } from "react-router-dom"
import FollowButton from "../followers/FollowButton";

export default function SuggestedItem({ user }) {
    return (
        <div className="flex items-center justify-between rounded-xl p-2">
            <Link to={`/profile/${user.username}`} className="flex items-center gap-3">
                <img
                    src={user.avatar}
                    alt={user.name}
                    className="avatar-lg"
                />

                <div>
                    <h3 className="type-label-md text-primary">
                        {user.name}
                    </h3>

                    <p className="type-label-sm text-secondary">
                        {user.role}
                    </p>
                </div>
            </Link>

            <FollowButton user={user} variant="text" />
        </div>
    )
}
