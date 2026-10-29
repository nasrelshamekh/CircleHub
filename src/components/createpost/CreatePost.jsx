import { Image } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner";

import { CreatePostModal } from "./CreatePostModal"
import { useAuth } from "@/hooks/useAuth"
import Avatar from "@/components/profileimages/Avatar"
import { ACCEPTED_IMAGE_TYPES, prepareUploadImage } from "@/lib/imageUpload"

export default function CreatePost({ community }) {
    const [open, setOpen] = useState(false);
    const [images, setImages] = useState([]);
    const fileInput = useRef(null);
    const { userData } = useAuth();

    function openFileInput() {
        fileInput.current?.click();
    }

    async function handlePhotoSelect(event) {
        const files = Array.from(event.target.files || []);
        event.target.value = "";
        if (files.length === 0) return;

        const remaining = 4 - images.length;
        if (remaining <= 0) {
            toast.error("You can upload up to 4 photos.");
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
            setImages((prev) => [...prev, ...processed].slice(0, 4));
            setOpen(true);
        }
    }

    function handleRemovePhoto(index) {
        if (typeof index === "number") {
            setImages((prev) => prev.filter((_, idx) => idx !== index));
        } else {
            setImages([]);
        }

        if (fileInput.current) {
            fileInput.current.value = "";
        }
    }

    function handleOpenChange(isOpen) {
        setOpen(isOpen);

        if (!isOpen) {
            handleRemovePhoto();
        }
    }

    return (
        <div className="content-card flex items-center gap-3 p-4">
            <Avatar src={userData.avatarUrl} alt={userData.name} className="avatar-lg" />

            <button
                type="button"
                onClick={() => setOpen(true)}
                className="input-surface type-body-sm flex-1 rounded-full px-4 py-3 text-left transition hover:bg-(--hover) cursor-pointer"
            >
                {community
                    ? `Share something with ${community.name}`
                    : `What's on your mind, ${userData.name.split(" ")[0]}?`}
            </button>
            <CreatePostModal
                open={open}
                onOpenChange={handleOpenChange}
                user={userData}
                images={images}
                setImages={setImages}
                handleRemovePhoto={handleRemovePhoto}
                community={community}
            />
            <button
                type="button"
                onClick={openFileInput}
                className="icon-button text-(--primary) hover:text-(--secondary)"
                aria-label="Add photo"
                title="Add photos"
            >
                <Image size={22} />
            </button>
            <input
                onChange={handlePhotoSelect}
                ref={fileInput}
                type="file"
                multiple
                accept={ACCEPTED_IMAGE_TYPES}
                className="hidden"
            />
        </div>
    )
}
