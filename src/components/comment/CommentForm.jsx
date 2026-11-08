import { useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";

import { useAddComment } from "@/hooks/mutations/useAddComment";
import Avatar from "@/components/profileimages/Avatar";
import GifPicker from "@/components/common/GifPicker";

export default function CommentForm({
    user,
    postId,
    parentCommentId = null,
    replyingTo = null,
    onCancelReply = null,
    onSuccess = null,
    compact = false,
}) {
    const [commentText, setCommentText] = useState("");
    const [selectedGif, setSelectedGif] = useState(null);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const addComment = useAddComment();

    function handleSubmit(event) {
        event?.preventDefault?.();

        const trimmed = commentText.trim();
        if (!trimmed && !selectedGif) {
            toast.error("Please write a comment or attach a GIF.");
            return;
        }

        if (addComment.isPending) return;

        const content = trimmed
            ? selectedGif
                ? `${trimmed}\n${selectedGif.url}`
                : trimmed
            : selectedGif.url;

        addComment.mutate(
            { postId, content, parentCommentId },
            {
                onSuccess: () => {
                    setCommentText("");
                    setSelectedGif(null);
                    setShowGifPicker(false);
                    toast.success(parentCommentId ? "Reply added successfully" : "Comment added successfully");
                    onSuccess?.();
                },
            }
        );
    }

    const canSubmit = Boolean(commentText.trim() || selectedGif);

    return (
        <form onSubmit={handleSubmit} className={`${compact ? "mt-2" : "mb-5"} flex w-full flex-col gap-2.5`}>
            {replyingTo && (
                <div className="flex items-center justify-between rounded-xl bg-(--surface-container) px-3 py-1.5 text-xs text-secondary border border-(--border)/40">
                    <span className="flex items-center gap-1">
                        Replying to <span className="font-semibold text-primary">@{replyingTo.username || replyingTo.name}</span>
                    </span>
                    {onCancelReply && (
                        <button
                            type="button"
                            onClick={onCancelReply}
                            className="p-0.5 text-secondary hover:text-primary transition-colors"
                            aria-label="Cancel reply"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            )}

            <div className="flex gap-3 w-full">
                <Avatar
                    src={user?.avatarUrl}
                    alt={user?.name}
                    className={compact ? "avatar-sm" : "avatar-md"}
                />
                <div className="flex flex-1 flex-col gap-2">
                    <textarea
                        value={commentText}
                        onChange={(event) => setCommentText(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                handleSubmit(event);
                            }
                        }}
                        className={`input-surface type-body-sm rounded-2xl p-3 w-full ${
                            compact ? "min-h-16" : "min-h-22"
                        }`}
                        placeholder={parentCommentId ? "Write a reply..." : "Add a comment..."}
                        disabled={addComment.isPending}
                        autoFocus={Boolean(parentCommentId)}
                    />

                    {/* Selected GIF preview */}
                    {selectedGif && (
                        <div className="relative inline-block self-start overflow-hidden rounded-xl border border-(--border) bg-(--surface-container) max-w-[200px]">
                            <img
                                src={selectedGif.previewUrl || selectedGif.url}
                                alt="Selected GIF"
                                className="h-28 w-full object-cover rounded-xl"
                            />
                            <button
                                type="button"
                                onClick={() => setSelectedGif(null)}
                                aria-label="Remove GIF"
                                className="absolute top-1.5 right-1.5 rounded-full bg-black/70 p-1 text-white hover:bg-black transition-colors"
                            >
                                <X size={14} />
                            </button>
                            <div className="absolute bottom-1 left-1.5 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-xs">
                                GIF
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={`flex items-center justify-between w-full ${compact ? "pl-10" : "pl-12"}`}>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowGifPicker((prev) => !prev)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                            selectedGif || showGifPicker
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-(--border) text-secondary hover:text-primary hover:bg-(--surface-low)"
                        }`}
                        aria-label="Add GIF to comment"
                    >
                        <span>GIF</span>
                    </button>

                    {showGifPicker && (
                        <GifPicker
                            onSelect={(gif) => {
                                setSelectedGif(gif);
                                setShowGifPicker(false);
                            }}
                            onClose={() => setShowGifPicker(false)}
                            align="left"
                        />
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {onCancelReply && (
                        <button
                            type="button"
                            onClick={onCancelReply}
                            className="px-3 py-1.5 text-xs font-semibold text-secondary hover:text-primary transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={addComment.isPending || !canSubmit}
                        className="button-primary type-button flex items-center justify-center gap-2 px-5 py-2 disabled:cursor-not-allowed disabled:opacity-60 text-xs font-semibold"
                    >
                        {addComment.isPending && (
                            <LoaderCircle size={14} className="animate-spin" />
                        )}
                        {addComment.isPending ? "Posting..." : parentCommentId ? "Reply" : "Post"}
                    </button>
                </div>
            </div>
        </form>
    );
}
