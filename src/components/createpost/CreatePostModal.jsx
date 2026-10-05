import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { CirclePlus, Images, X } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { useCreatePost } from "@/hooks/mutations/useCreatePost"
import Avatar from "@/components/profileimages/Avatar"
import { ACCEPTED_IMAGE_TYPES } from "@/lib/imageUpload"

export function CreatePostModal({ open, onOpenChange, user, previewUrl, imageFile, handlePhotoSelect, handleRemovePhoto, community }) {
    const [content, setContent] = useState("");
    const modalFileInput = useRef(null);
    const createPost = useCreatePost();

    function handleSubmit() {
        const trimmed = content.trim();

        if (!trimmed && !imageFile) {
            toast.error("Please write something or add a photo first.");
            return;
        }

        createPost.mutate(
            {
                content: trimmed,
                communityId: community?.id,
                imageFile,
            },
            {
                onSuccess: () => {
                    setContent("");
                    handleRemovePhoto();
                    onOpenChange(false);
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="content-card max-h-[calc(100vh-2rem)] overflow-y-auto text-primary">
                <DialogHeader>
                    <DialogTitle>{community ? `Post in ${community.name}` : "Create Post"}</DialogTitle>
                    <DialogDescription>
                        {community
                            ? `Share an update, thought, or photo with ${community.name}.`
                            : "Share an update, thought, or photo with your CircleHub community."}
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
                <textarea value={content} onChange={(e) => setContent(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} placeholder={community ? `Share something with ${community.name}` : `What's on your mind, ${user.name.split(" ")[0]}?`} className="input-surface type-body-sm min-h-36 w-full resize-none rounded-xl p-3" />
                {previewUrl &&
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
                }
                <div className="p-3 flex justify-between gap-2">
                    <span className="type-label-md">
                        Add to your Post:
                    </span>
                    <button
                        type="button"
                        onClick={openModalFileInput}
                        className="icon-button text-(--primary) hover:text-(--secondary)"
                        aria-label="Add photo"
                    >
                        <Images size={22} />
                    </button>
                    <input onChange={handleModalPhotoSelect} ref={modalFileInput} type="file" accept={ACCEPTED_IMAGE_TYPES} className="hidden" />
                </div>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={createPost.isPending}
                    className="button-primary flex justify-center items-center gap-2 py-3 disabled:opacity-60"
                >
                    <CirclePlus size={20} />
                    {createPost.isPending ? "Postingâ€¦" : "Post"}
                </button>
            </DialogContent>
        </Dialog>
    )
}
