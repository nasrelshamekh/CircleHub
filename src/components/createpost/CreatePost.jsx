import { Image } from "lucide-react"
import { CreatePostModal } from "./CreatePostModal"
import { useRef, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner";

export default function CreatePost({ onCreatePost }) {

    const [open, setOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInput = useRef(null)
    const { userData } = useAuth();

    function openFileInput() {
        fileInput.current?.click()
    }

    function handlePhotoSelect(event) {
        const file = event.target.files?.[0]
        if (!file) return;

        try {
            const reader = new FileReader();

            reader.onloadend = () => {
                setPreviewUrl(reader.result);
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
        <>
            <div className="content-card flex items-center gap-3 p-4">

                <img src={userData.avatar} alt={userData.name} className="avatar-lg" />

                <button type="button" onClick={() => setOpen(true)} className="input-surface type-body-sm flex-1 rounded-full px-4 py-3 text-left transition hover:bg-(--hover) cursor-pointer">
                    What's on your mind, {userData.name.split(" ")[0]}?
                </button>
                <CreatePostModal onCreatePost={onCreatePost} open={open} onOpenChange={handleOpenChange} user={userData} previewUrl={previewUrl} handlePhotoSelect={handlePhotoSelect} handleRemovePhoto={handleRemovePhoto} />
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
        </>
    )
}
