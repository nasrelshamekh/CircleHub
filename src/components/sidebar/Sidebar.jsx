import SidebarNav from './SidebarNav'
import { ArrowLeftToLine, ArrowRightToLine, CirclePlus } from 'lucide-react'
import { useState } from 'react'
import { CreatePostModal } from '../createpost/CreatePostModal'
import { useAuth } from '@/hooks/useAuth'
import { useSidebar } from '@/hooks/useSidebar'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'

export default function Sidebar() {

    const [open, setOpen] = useState(false)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [imageFile, setImageFile] = useState(null)
    const { userData } = useAuth();
    const { isSidebarExpanded, toggleSidebar } = useSidebar();

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
    }

    function handleOpenChange(isOpen) {
        setOpen(isOpen);

        if (!isOpen) {
            handleRemovePhoto();
        }
    }

    return (
        <>
            <aside className="content-card sticky top-24 mx-2 my-4 flex h-[calc(100vh-7rem)] flex-col justify-between overflow-hidden p-4">

                <button
                    type="button"
                    onClick={toggleSidebar}
                    className={`absolute top-3 p-2 icon-button-soft ${isSidebarExpanded ? "right-3" : "left-1/2 -translate-x-1/2"
                        }`}
                    aria-label={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
                    aria-expanded={isSidebarExpanded}
                    title={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                            key={isSidebarExpanded ? "collapse" : "expand"}
                            initial={{ opacity: 0, scale: 0.8, rotate: -12 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.8, rotate: 12 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="flex"
                        >
                            {isSidebarExpanded ? <ArrowLeftToLine size={20} /> : <ArrowRightToLine size={20} />}
                        </motion.span>
                    </AnimatePresence>
                </button>

                <div className="mt-10 space-y-6">
                    <SidebarNav isExpanded={isSidebarExpanded} />
                </div>

                <CreatePostModal
                    open={open}
                    onOpenChange={handleOpenChange}
                    user={userData}
                    previewUrl={previewUrl}
                    imageFile={imageFile}
                    handlePhotoSelect={handlePhotoSelect}
                    handleRemovePhoto={handleRemovePhoto}
                />
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="button-primary text-md mx-auto flex h-8 w-full shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden"
                    aria-label="Create Post"
                    title={isSidebarExpanded ? undefined : "Create Post"}
                >
                    <CirclePlus size={isSidebarExpanded ? 20 : 22} />
                    <AnimatePresence initial={false}>
                        {isSidebarExpanded && (
                            <motion.span
                                initial={{ width: 0 }}
                                animate={{ width: 90 }}
                                exit={{ width: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="overflow-hidden"
                            >
                                <motion.span
                                    initial={{ opacity: 0, x: -14 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -14 }}
                                    transition={{ duration: 0.18, ease: "easeOut" }}
                                    className="block whitespace-nowrap"
                                >
                                    Create Post
                                </motion.span>
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </aside>
        </>
    )
}
