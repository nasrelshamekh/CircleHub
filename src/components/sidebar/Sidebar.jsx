import SidebarNav from './SidebarNav'
import { ArrowLeftToLine, CirclePlus } from 'lucide-react'
import { useState } from 'react'
import { CreatePostModal } from '../createpost/CreatePostModal'
import { useAuth } from '@/hooks/useAuth'
import { usePosts } from '@/hooks/usePosts'
import { useSidebar } from '@/hooks/useSidebar'
import { motion } from 'motion/react'
import { toast } from 'sonner'

export default function Sidebar() {

    const [open, setOpen] = useState(false)
    const [previewUrl, setPreviewUrl] = useState(null)
    const { userData } = useAuth();
    const { setPosts } = usePosts();
    const { isSidebarExpanded, toggleSidebar } = useSidebar();

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
    }

    function handleOpenChange(isOpen) {
        setOpen(isOpen);

        if (!isOpen) {
            handleRemovePhoto();
        }
    }

    function createPost(newPost) {
        setPosts((currentPosts) => [newPost, ...currentPosts]);
    }

    return (
        <>
            <motion.aside
                layout
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="sticky top-20 mx-auto flex h-[calc(100vh-5rem)] w-full flex-col justify-between overflow-hidden p-4">

                <button
                    type="button"
                    onClick={toggleSidebar}
                    className={`absolute top-3 p-2 icon-button-soft ${isSidebarExpanded ? "right-3" : "right-5"
                        }`}
                    aria-label={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
                    aria-expanded={isSidebarExpanded}
                    title={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}>
                    <motion.span
                        className="block"
                        animate={{ rotate: isSidebarExpanded ? 0 : 180 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <ArrowLeftToLine size={20} />
                    </motion.span>
                </button>

                <div className="mt-10 space-y-6">
                    <SidebarNav isExpanded={isSidebarExpanded} />
                </div>

                <CreatePostModal onCreatePost={createPost} open={open} onOpenChange={handleOpenChange} user={userData} previewUrl={previewUrl} handlePhotoSelect={handlePhotoSelect} handleRemovePhoto={handleRemovePhoto} />
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="button-primary text-md mx-auto flex w-full cursor-pointer items-center justify-center gap-2 py-1"
                    aria-label="Create Post"
                    title={isSidebarExpanded ? undefined : "Create Post"}
                >
                    <CirclePlus size={isSidebarExpanded ? 20 : 22} />
                    {isSidebarExpanded && <span>Create Post</span>}
                </button>
            </motion.aside>
        </>
    )
}
