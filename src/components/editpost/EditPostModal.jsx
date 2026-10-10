import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Images, Save, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { useUpdatePost } from "@/hooks/mutations/useUpdatePost"
import Avatar from "@/components/profileimages/Avatar"
import { ACCEPTED_IMAGE_TYPES, validateImageFile } from "@/lib/imageUpload"

export function EditPostModal({ open, onOpenChange, post }) {
    const [content, setContent] = useState(post.content);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const modalFileInput = useRef(null);
    const textareaRef = useRef(null);
    const updatePost = useUpdatePost();

    // Reset the form whenever the dialog opens for a (possibly different) post.
    // Done during render (the "adjust state during render" pattern) instead of
    // inside an effect, so opening the dialog doesn't cascade renders.
    const [formKey, setFormKey] = useState(() => `${post.id}:${open}`);
    if (`${post.id}:${open}` !== formKey) {
        setFormKey(`${post.id}:${open}`);
        setContent(post.content);
        setPreviewUrl(null);
        setImageFile(null);
    }

    // Once the dialog is visible, focus the textarea with the caret at the end.
    useEffect(() => {
        if (!open) return;

        requestAnimationFrame(() => {
            const el = textareaRef.current;
            if (!el) return;

            const length = el.value.length;
            el.focus();
            el.setSelectionRange(length, length);
        });
    }, [open]);

    function handleSubmit() {
        const trimmed = content.trim();

        if (!trimmed) {
            toast.error("Please write something first.");
            return;
        }

        updatePost.mutate(
            {
                postId: post.id,
                content: trimmed,
                imageFile,
            },
            {
                onSuccess: () => {
                    setContent("");
                    setPreviewUrl(null);
                    setImageFile(null);
                    onOpenChange(false);
                },
            }
        );
    }

    function openModalFileInput() {
        modalFileInput.current?.click();
    }

    function handleModalPhotoSelect(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const error = validateImageFile(file);

        if (error) {
            toast.error(error);
            return;
        }

        try {
            const reader = new FileReader();

            reader.onloadend = () => {
                setPreviewUrl(reader.result);
                setImageFile(file);
            };

            reader.onerror = () => {
                toast.error("Could not read the selected image.");
            };

            reader.readAsDataURL(file);
        } catch {
            toast.error("Could not read the selected image.");
        }

        event.target.value = "";
    }

    function handleRemovePhoto() {
        setPreviewUrl(null);
        setImageFile(null);

        if (modalFileInput.current) {
            modalFileInput.current.value = "";
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="content-card max-h-[calc(100vh-2rem)] overflow-y-auto text-primary">
                <DialogHeader>
                    <DialogTitle>Edit Post</DialogTitle>
                    <DialogDescription>
                        Update the text or photo of your post.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-3">
                    <Avatar src={post.author.avatarUrl} alt={post.author.name} className="avatar-md" />
                    <div>
                        <h3 className="type-label-md">{post.author.name}</h3>
                        <p className="type-label-sm text-secondary">
                            Editing your post
                        </p>
                    </div>
                </div>
                <textarea ref={textareaRef} value={content} onChange={(e) => setContent(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} placeholder="Share something new..." className="input-surface type-body-sm min-h-36 w-full resize-none rounded-xl p-3" />
                {(imageFile ? previewUrl : post.imageUrl) &&
                    <div className="relative overflow-hidden rounded-xl">
                        <img
                            src={imageFile ? previewUrl : post.imageUrl}
                            alt="Post preview"
                            className="max-h-64 w-full object-contain sm:max-h-80"
                        />
                        {imageFile && (
                            <button
                                type="button"
                                onClick={handleRemovePhoto}
                                aria-label="Remove selected photo"
                                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-(--primary) transition hover:bg-(--background) cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                }
                <div className="p-3 flex justify-between gap-2">
                    <span className="type-label-md">
                        Update your Post:
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
                    disabled={updatePost.isPending}
                    className="button-primary flex justify-center items-center gap-2 py-3 disabled:opacity-60"
                >
                    <Save size={20} />
                    {updatePost.isPending ? "Saving…" : "Save"}
                </button>
            </DialogContent>
        </Dialog>
    )
}