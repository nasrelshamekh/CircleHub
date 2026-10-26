import { Image } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner";

import { CreatePostModal } from "./CreatePostModal"
import { useAuth } from "@/hooks/useAuth"
import Avatar from "@/components/profileimages/Avatar"
import { ACCEPTED_IMAGE_TYPES, prepareUploadImage } from "@/lib/imageUpload"

export default function CreatePost({ community }) {
    const [open, setOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const fileInput = useRef(null);
    const { userData } = useAuth();

    function openFileInput() {
        fileInput.current?.click()
    }

    async function handlePhotoSelect(event) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        const { file: processedFile, previewUrl: processedPreview, error } =
            await prepareUploadImage(file);

        if (error) {
            toast.error(error);
            return;
        }

        setPreviewUrl(processedPreview);
        setImageFile(processedFile);
        setOpen(true);
    }

    function handleRemovePhoto() {
        setPreviewUrl(null);
        setImageFile(null);

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

            <button type="button" onClick={() => setOpen(true)} className="input-surface type-body-sm flex-1 rounded-full px-4 py-3 text-left transition hover:bg-(--hover) cursor-pointer">
                {community
                    ? `Share something with ${community.name}`
                    : `What's on your mind, ${userData.name.split(" ")[0]}?`}
            </button>
            <CreatePostModal
                open={open}
                onOpenChange={handleOpenChange}
                user={userData}
                previewUrl={previewUrl}
                imageFile={imageFile}
                handlePhotoSelect={handlePhotoSelect}
                handleRemovePhoto={handleRemovePhoto}
                community={community}
            />
            <button
                type="button"
                onClick={openFileInput}
                className="icon-button text-(--primary) hover:text-(--secondary)"
                aria-label="Add photo"
            >
                <Image size={22} />
            </button>
            <input onChange={handlePhotoSelect} ref={fileInput} type="file" accept={ACCEPTED_IMAGE_TYPES} className="hidden" />
        </div>
    )
}
