import { useState } from "react";


export default function CommentForm({ user, postId, onAddComment }) {
    const [commentText, setCommentText] = useState("")

    function handleSubmit(event) {
        event.preventDefault();
        const newComment = {
            id: Date.now(),
            postId,
            author: user,
            content: commentText.trim(),
            createdAt: "Just now",
        };
        onAddComment(postId, newComment);
        setCommentText("")
    }



    return (
        <form onSubmit={handleSubmit} className="mb-5 flex w-full flex-col items-end gap-3">
            <div className="flex gap-3 w-full">
                <img
                    src={user.avatar}
                    alt={user.name}
                    className="avatar-md"
                />
                <textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    className="input-surface type-body-sm min-h-26 rounded-2xl p-3 w-full"
                    placeholder="Add a comment..."
                />
            </div>
            <button type="submit" className="button-primary p-2 w-15">
                Post
            </button>
        </form>
    )
}
