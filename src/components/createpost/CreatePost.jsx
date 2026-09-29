import { Image } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner";

import { CreatePostModal } from "./CreatePostModal"
import { useAuth } from "@/hooks/useAuth"
import Avatar from "@/components/profileimages/Avatar"

export default function CreatePost({ community }) {
    const [open, setOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const fileInput = useRef(null);
    const { userData } = useAuth();

    function openFileInput() {
        fileInput.current?.click()
    }

    function handlePhotoSelect(event) {
        const file = event.target.files?.[0]
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Only image files are allowed.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be 5MB or smaller.");
            return;
        }

        try {
            const reader = new FileReader();

            reader.onloadend = () => {
                setPreviewUrl(reader.result);
                setImageFile(file);
                setOpen(true);
            };

            reader.onerror = () => {
                toast.error("Could not read the selected image.");
            };

            reader.readAsDataURL(file);
        } catch {
            toast.error("Could not read the selected image.");
        }
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
            <input onChange={handlePhotoSelect} ref={fileInput} type="file" accept="image/*" className="hidden" />
        </div>
    )
}
