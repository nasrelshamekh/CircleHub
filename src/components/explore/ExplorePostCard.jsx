import { Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

export default function ExplorePostCard({ post }) {
    const { userData } = useAuth();
    const postOwner = post.author.id === userData.id;
    const author = postOwner ? userData : post.author;

    return (
        <article className="content-card-padded flex min-w-0 flex-col gap-4 overflow-hidden">
            {post.image && (
                <Link to={`/post/${post.id}`} className="-m-5 mb-0 block">
                    <img
                        src={post.image}
                        alt="Post preview"
                        className="h-40 w-full object-cover"
                    />
                </Link>
            )}

            <div className="flex items-start gap-3">
                <Link to={`/profile/${author.username}`} className="shrink-0">
                    <img
                        src={author.avatar}
                        alt={author.name}
                        className="h-11 w-11 rounded-full object-cover"
                    />
                </Link>

                <div className="min-w-0 flex-1">
                    <Link
                        to={`/profile/${author.username}`}
                        className="block truncate text-(length:--text-body-md) font-semibold text-(--text-primary) transition hover:text-(--primary)"
                    >
                        {author.name}
                    </Link>

                    <p className="truncate text-(length:--text-label-sm) text-(--text-secondary)">
                        @{author.username} &bull; {author.role}
                    </p>
                </div>
            </div>

            <Link to={`/post/${post.id}`} className="block">
                <p className="line-clamp-3 text-(length:--text-body-sm) leading-6 text-(--text-secondary)">
                    {post.content}
                </p>
            </Link>

            <div className="flex items-center justify-between gap-3 border-t border-(--border) pt-3">
                <span className="text-(length:--text-label-sm) text-(--text-secondary)">
                    {post.createdAt}
                </span>

                <div className="flex items-center">
                    <Link
                        to="#"
                        aria-label={`Like post. ${post.likesCount} likes`}
                        className="post-action-button gap-1.5 px-2.5 py-2 text-(length:--text-label-sm)"
                    >
                        <Heart size={16} />
                        <span>{post.likesCount}</span>
                    </Link>

                    <Link
                        to={`/post/${post.id}`}
                        aria-label={`View comments. ${post.commentsCount} comments`}
                        className="post-action-button gap-1.5 px-2.5 py-2 text-(length:--text-label-sm)"
                    >
                        <MessageCircle size={16} />
                        <span>{post.commentsCount}</span>
                    </Link>
                </div>
            </div>
        </article>
    );
}
