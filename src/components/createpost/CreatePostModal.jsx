import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { CirclePlus, Images, X, BarChart3, Plus } from "lucide-react"
import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { useCreatePost } from "@/hooks/mutations/useCreatePost"
import Avatar from "@/components/profileimages/Avatar"
import { ACCEPTED_IMAGE_TYPES } from "@/lib/imageUpload"

export function CreatePostModal({ open, onOpenChange, user, previewUrl, imageFile, handlePhotoSelect, handleRemovePhoto, community }) {
    const [content, setContent] = useState("");
    const [showPoll, setShowPoll] = useState(false);
    const [pollQuestion, setPollQuestion] = useState("");
    const [pollOptions, setPollOptions] = useState(["", ""]);
    const [pollDurationDays, setPollDurationDays] = useState(1);

    const modalFileInput = useRef(null);
    const createPost = useCreatePost();
    const navigate = useNavigate();

    function resetForm() {
        setContent("");
        setShowPoll(false);
        setPollQuestion("");
        setPollOptions(["", ""]);
        setPollDurationDays(1);
        handleRemovePhoto();
    }

    function handleSubmit() {
        const trimmed = content.trim();

        if (showPoll) {
            if (!pollQuestion.trim()) {
                toast.error("Please enter a question for your poll.");
                return;
            }
            const valid = pollOptions.map((o) => o.trim()).filter(Boolean);
            if (valid.length < 2) {
                toast.error("A poll needs at least two options.");
                return;
            }
        } else if (!trimmed && !imageFile) {
            toast.error("Please write something or add a photo first.");
            return;
        }

        const pollPayload = showPoll
            ? {
                  question: pollQuestion.trim(),
                  options: pollOptions.map((o) => o.trim()).filter(Boolean),
                  durationDays: pollDurationDays,
              }
            : null;

        createPost.mutate(
            {
                content: trimmed || (showPoll ? pollQuestion.trim() : ""),
                communityId: community?.id,
                imageFile,
                poll: pollPayload,
            },
            {
                onSuccess: () => {
                    resetForm();
                    onOpenChange(false);

                    if (!community) {
                        navigate("/feed");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                },
            }
        );
    }

    function openModalFileInput() {
        modalFileInput.current?.click();
    }

    function handleModalPhotoSelect(event) {
        handlePhotoSelect?.(event);
        event.target.value = "";
    }

    const handleOptionChange = (index, value) => {
        setPollOptions((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const handleAddOption = () => {
        if (pollOptions.length >= 6) return;
        setPollOptions((prev) => [...prev, ""]);
    };

    const handleRemoveOption = (index) => {
        if (pollOptions.length <= 2) return;
        setPollOptions((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
            <DialogContent className="content-card max-h-[calc(100vh-2rem)] overflow-y-auto text-primary">
                <DialogHeader>
                    <DialogTitle>{community ? `Post in ${community.name}` : "Create Post"}</DialogTitle>
                    <DialogDescription>
                        {community
                            ? `Share an update, thought, photo, or poll with ${community.name}.`
                            : "Share an update, thought, photo, or poll with your CircleHub community."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-3">
                    <Avatar src={user.avatarUrl} alt={user.name} className="avatar-md" />
                    <div>
                        <h3 className="type-label-md">{user.name}</h3>
                        <p className="type-label-sm text-secondary">
                            {community ? `Posting in ${community.name}` : "Posting publicly"}
                        </p>
                    </div>
                </div>

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={community ? `Share something with ${community.name}` : `What's on your mind, ${user.name.split(" ")[0]}?`}
                    className="input-surface type-body-sm min-h-28 w-full resize-none rounded-xl p-3"
                />

                {/* Poll Builder */}
                {showPoll && (
                    <div className="rounded-xl border border-border/80 bg-surface-lowest/70 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={18} className="text-(--primary)" />
                                <span className="type-label-sm font-semibold">Community Poll</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPoll(false)}
                                className="text-secondary hover:text-primary p-1 rounded-md"
                                title="Remove poll"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <input
                            type="text"
                            value={pollQuestion}
                            onChange={(e) => setPollQuestion(e.target.value)}
                            placeholder="Ask a question..."
                            maxLength={200}
                            className="input-surface type-body-sm w-full rounded-lg px-3 py-2 text-primary"
                        />

                        <div className="space-y-2">
                            {pollOptions.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                        placeholder={`Option ${idx + 1}`}
                                        maxLength={100}
                                        className="input-surface type-body-sm flex-1 rounded-lg px-3 py-1.5 text-primary"
                                    />
                                    {pollOptions.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOption(idx)}
                                            className="text-secondary hover:text-red-500 p-1"
                                            title="Delete option"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {pollOptions.length < 6 && (
                            <button
                                type="button"
                                onClick={handleAddOption}
                                className="flex items-center gap-1.5 text-xs font-semibold text-(--primary) hover:underline pt-1"
                            >
                                <Plus size={14} />
                                Add option
                            </button>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-secondary">
                            <span>Poll duration:</span>
                            <div className="flex gap-1.5">
                                {[1, 3, 7].map((days) => (
                                    <button
                                        key={days}
                                        type="button"
                                        onClick={() => setPollDurationDays(days)}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                            pollDurationDays === days
                                                ? "bg-(--primary) text-white"
                                                : "bg-surface hover:bg-border/40 text-secondary"
                                        }`}
                                    >
                                        {days} {days === 1 ? "day" : "days"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {previewUrl && (
                    <div className="relative overflow-hidden rounded-xl">
                        <img
                            src={previewUrl}
                            alt="Selected preview"
                            className="max-h-64 w-full object-contain sm:max-h-80"
                        />
                        <button
                            type="button"
                            onClick={handleRemovePhoto}
                            aria-label="Remove selected photo"
                            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-(--primary) transition hover:bg-(--background) cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                <div className="p-3 flex justify-between items-center gap-2 border-t border-border/40">
                    <span className="type-label-md">
                        Add to your post:
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowPoll((prev) => !prev)}
                            className={`p-2 rounded-xl transition-colors ${
                                showPoll
                                    ? "bg-(--primary)/15 text-(--primary)"
                                    : "text-secondary hover:text-primary hover:bg-surface"
                            }`}
                            title="Add a poll"
                        >
                            <BarChart3 size={20} />
                        </button>

                        <button
                            type="button"
                            onClick={openModalFileInput}
                            className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-surface transition-colors"
                            aria-label="Add photo"
                            title="Add photo"
                        >
                            <Images size={20} />
                        </button>
                    </div>
                    <input onChange={handleModalPhotoSelect} ref={modalFileInput} type="file" accept={ACCEPTED_IMAGE_TYPES} className="hidden" />
                </div>

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={createPost.isPending}
                    className="button-primary flex justify-center items-center gap-2 py-3 disabled:opacity-60"
                >
                    <CirclePlus size={20} />
                    {createPost.isPending ? "Posting…" : "Post"}
                </button>
            </DialogContent>
        </Dialog>
    )
}
