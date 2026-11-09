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
import { ACCEPTED_IMAGE_TYPES, prepareUploadImage } from "@/lib/imageUpload"

export function CreatePostModal({
    open,
    onOpenChange,
    user,
    images: externalImages,
    setImages: externalSetImages,
    handleRemovePhoto,
    community
}) {
    const [content, setContent] = useState("");
    const [showPoll, setShowPoll] = useState(false);
    const [pollQuestion, setPollQuestion] = useState("");
    const [pollOptions, setPollOptions] = useState(["", ""]);
    const [pollDurationDays, setPollDurationDays] = useState(1);
    const [localImages, setLocalImages] = useState([]);

    const modalFileInput = useRef(null);
    const contentInputRef = useRef(null);
    const createPost = useCreatePost();
    const navigate = useNavigate();

    // Sync external images if provided, or fallback to localImages
    const images = externalImages ?? localImages;
    const updateImages = externalSetImages ?? setLocalImages;

    function resetForm() {
        setContent("");
        setShowPoll(false);
        setPollQuestion("");
        setPollOptions(["", ""]);
        setPollDurationDays(1);
        updateImages([]);
        handleRemovePhoto?.();
    }

    function removeSingleImage(index) {
        updateImages(images.filter((_, idx) => idx !== index));
        handleRemovePhoto?.(index);
    }

    function handleSubmit() {
        const trimmed = content.trim();
        const filesToSend = images.map((i) => i.file).filter(Boolean);

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
        } else {
            if (!trimmed) {
                if (filesToSend.length > 0) {
                    toast.error("Please write something in your post before sharing photos.");
                } else {
                    toast.error("Please write something, add a photo, or create a poll first.");
                }
                contentInputRef.current?.focus();
                return;
            }
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
                imageFiles: filesToSend,
                imageFile: filesToSend[0] || null,
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
        if (images.length >= 4) {
            toast.error("Maximum 4 photos allowed per post.");
            return;
        }
        modalFileInput.current?.click();
    }

    async function handleModalPhotoSelect(event) {
        const files = Array.from(event.target.files || []);
        event.target.value = "";
        if (files.length === 0) return;

        const remaining = 4 - images.length;
        if (remaining <= 0) {
            toast.error("Maximum 4 photos allowed per post.");
            return;
        }

        const toProcess = files.slice(0, remaining);
        const processed = [];

        for (const file of toProcess) {
            const { file: processedFile, previewUrl: processedPreview, error } =
                await prepareUploadImage(file);

            if (error) {
                toast.error(error);
                return;
            }

            if (processedFile && processedPreview) {
                processed.push({ file: processedFile, previewUrl: processedPreview });
            }
        }

        if (processed.length > 0) {
            updateImages([...images, ...processed].slice(0, 4));
        }
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
                    ref={contentInputRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                        images.length > 0
                            ? "Add a caption or description for your photos..."
                            : (community ? `Share something with ${community.name}` : `What's on your mind, ${user.name.split(" ")[0]}?`)
                    }
                    className="input-surface type-body-sm min-h-28 w-full resize-none rounded-xl p-3 border-0 focus-visible:ring-1 focus-visible:ring-(--primary)"
                />

                {/* Poll Builder */}
                {showPoll && (
                    <div className="rounded-xl bg-surface-low p-4 space-y-3 border-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={18} className="text-(--primary)" />
                                <span className="type-label-sm font-semibold text-text-primary">Community Poll</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPoll(false)}
                                className="icon-button-soft p-1 text-text-secondary hover:text-text-primary rounded-md border-0"
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
                            className="input-surface type-body-sm w-full rounded-lg px-3 py-2 text-text-primary bg-surface-lowest border-0"
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
                                        className="input-surface type-body-sm flex-1 rounded-lg px-3 py-1.5 text-text-primary bg-surface-lowest border-0"
                                    />
                                    {pollOptions.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOption(idx)}
                                            className="icon-button-soft p-1 text-text-secondary hover:text-error transition-colors border-0"
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
                                className="flex items-center gap-1.5 text-xs font-semibold text-(--primary) hover:underline pt-1 cursor-pointer border-0 bg-transparent"
                            >
                                <Plus size={14} />
                                Add option ({pollOptions.length}/6)
                            </button>
                        )}

                        <div className="flex items-center justify-between pt-2 text-xs text-text-secondary">
                            <span>Poll duration:</span>
                            <div className="flex gap-1.5">
                                {[1, 3, 7].map((days) => (
                                    <button
                                        key={days}
                                        type="button"
                                        onClick={() => setPollDurationDays(days)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border-0 ${
                                            pollDurationDays === days
                                                ? "gradient-primary text-(--button-gradient-text) shadow-xs"
                                                : "bg-surface-low hover:bg-surface-high text-text-secondary"
                                        }`}
                                    >
                                        {days} {days === 1 ? "day" : "days"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Multi-Image Previews */}
                {images.length > 0 && (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-text-secondary px-1">
                            <span className="font-medium">Photos ({images.length}/4)</span>
                            {images.length < 4 && (
                                <button
                                    type="button"
                                    onClick={openModalFileInput}
                                    className="text-xs font-semibold text-(--primary) hover:underline cursor-pointer flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add photo
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2.5 overflow-x-auto py-1 custom-scrollbar">
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-surface-low ring-1 ring-border/40 group"
                                >
                                    <img
                                        src={img.previewUrl}
                                        alt={`Selected preview ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeSingleImage(idx)}
                                        aria-label={`Remove photo ${idx + 1}`}
                                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors cursor-pointer border-0 shadow-xs"
                                        title="Remove photo"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}

                            {images.length < 4 && (
                                <button
                                    type="button"
                                    onClick={openModalFileInput}
                                    className="flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 flex-col items-center justify-center rounded-xl bg-surface-low hover:bg-surface-high border-2 border-dashed border-border/60 hover:border-(--primary) text-text-secondary hover:text-(--primary) transition-colors cursor-pointer"
                                    title="Add another photo"
                                >
                                    <Plus size={20} />
                                    <span className="text-[11px] font-medium mt-1">Add photo</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="p-3 flex justify-between items-center gap-2">
                    <span className="type-label-md text-text-secondary">
                        Add to your post:
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowPoll((prev) => !prev)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border-0 ${
                                showPoll
                                    ? "bg-(--primary)/15 text-(--primary)"
                                    : "bg-surface-low hover:bg-surface-high text-text-secondary hover:text-text-primary"
                            }`}
                            title={showPoll ? "Discard poll" : "Add a poll"}
                        >
                            <BarChart3 size={16} />
                            <span>Poll</span>
                        </button>

                        <button
                            type="button"
                            onClick={openModalFileInput}
                            disabled={images.length >= 4}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border-0 ${
                                images.length > 0
                                    ? "bg-(--primary)/15 text-(--primary)"
                                    : "bg-surface-low hover:bg-surface-high text-text-secondary hover:text-text-primary"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            aria-label="Add photo"
                            title={images.length >= 4 ? "Maximum 4 photos reached" : "Add photos"}
                        >
                            <Images size={16} />
                            <span>Photo {images.length > 0 ? `(${images.length}/4)` : ""}</span>
                        </button>
                    </div>
                    <input
                        onChange={handleModalPhotoSelect}
                        ref={modalFileInput}
                        type="file"
                        multiple
                        accept={ACCEPTED_IMAGE_TYPES}
                        className="hidden"
                    />
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
