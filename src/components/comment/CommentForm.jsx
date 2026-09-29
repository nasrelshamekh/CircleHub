import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { useAddComment } from "@/hooks/mutations/useAddComment";
import Avatar from "@/components/profileimages/Avatar";

export default function CommentForm({ user, postId }) {
    const [commentText, setCommentText] = useState("");
    const addComment = useAddComment();

    function handleSubmit(event) {
        event.preventDefault();

        const trimmed = commentText.trim();
        if (!trimmed) {
            toast.error("Please write a comment first.");
            return;
        }

        if (addComment.isPending) return;

        addComment.mutate(
            { postId, content: trimmed },
            {
                onSuccess: () => {
                    setCommentText("");
                    toast.success("Comment added successfully");
                },
            }
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mb-5 flex w-full flex-col items-end gap-3">
            <div className="flex gap-3 w-full">
                <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    className="avatar-md"
                />
                <textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); handleSubmit(event); } }}
                    className="input-surface type-body-sm min-h-26 rounded-2xl p-3 w-full"
                    placeholder="Add a comment..."
                    disabled={addComment.isPending}
                />
            </div>
            <button
                type="submit"
                disabled={addComment.isPending}
                className="button-primary type-button flex items-center justify-center gap-2 px-5 py-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {addComment.isPending && (
                    <LoaderCircle size={16} className="animate-spin" />
                )}
                {addComment.isPending ? "Posting..." : "Post"}
            </button>
        </form>
    );
}
