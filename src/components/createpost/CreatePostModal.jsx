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

export function CreatePostModal({ onCreatePost, open, onOpenChange, user, previewUrl, handlePhotoSelect, handleRemovePhoto, community }) {

    const [content, setContent] = useState("");

    function handleSubmit() {
        try {
            if (!content.trim() && !previewUrl) {
                toast.error("Please write something or add a photo first.");
                return;
            }

            const newPost = {
                id: Date.now(),
                communitySlug: community?.slug,
                authorUsername: user.username,
                author: user,
                content: content.trim(),
                image: previewUrl,
                createdAt: "Just now",
                comments: [],
                commentsCount: 0,
                likesCount: 0,
                likedBy: [],
            };

            onCreatePost(newPost);

            setContent("");
            handleRemovePhoto();
            onOpenChange(false);

            toast.success(community ? "Community post created successfully." : "Post created successfully.");
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong while creating your post.");
        }
    }

    const modalFileInput = useRef(null)

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
                    <img src={user.avatar} alt={user.name} className="avatar-md" />
                    <div>
                        <h3 className="type-label-md">{user.name}</h3>
                        <p className="type-label-sm text-secondary">
                            {community ? `Posting in ${community.name}` : "Posting publicly"}
                        </p>
                    </div>
                </div>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={community ? `Share something with ${community.name}` : `What's on your mind, ${user.name.split(" ")[0]}?`} className="input-surface type-body-sm min-h-36 w-full resize-none rounded-xl p-3" />
                {previewUrl &&
                    <>
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
                    </>
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
                    <input onChange={handleModalPhotoSelect} ref={modalFileInput} type="file" accept="image/*" className="hidden" />
                </div>
                <button type="button" onClick={handleSubmit} className="button-primary flex justify-center items-center gap-2 py-3">
                    <CirclePlus size={20} />
                    Post
                </button>
            </DialogContent>
        </Dialog>
    )
}
