import { Link } from "react-router-dom";

import Avatar from "@/components/profileimages/Avatar";

export default function SharedPostCard({ post }) {
    if (!post) {
        return (
            <div className="mt-2 rounded-xl border border-(--border) bg-(--surface-low) px-3 py-2">
                <p className="type-body-sm text-secondary">
                    This post is no longer available.
                </p>
            </div>
        );
    }

    return (
        <Link
            to={`/post/${post.id}`}
            className="mt-2 block overflow-hidden rounded-xl border border-(--border) bg-(--surface-container) transition-colors hover:bg-(--surface-high)"
        >
            <div className="flex items-center gap-2 px-3 py-2">
                <Avatar
                    src={post.author.avatarUrl}
                    alt={post.author.name}
                    className="size-7 shrink-0 rounded-full object-cover"
                />

                <div className="min-w-0">
                    <p className="type-label-sm truncate text-primary">
                        {post.author.name}
                    </p>
                    <p className="type-label-sm truncate text-secondary">
                        @{post.author.username}
                    </p>
                </div>
            </div>

            {post.content && (
                <p className="type-body-sm line-clamp-3 px-3 pb-2 text-secondary">
                    {post.content}
                </p>
            )}

            {post.imageUrl && (
                <img
                    src={post.imageUrl}
                    alt="Shared post"
                    className="max-h-60 w-full object-cover"
                />
            )}
        </Link>
    );
}
