import {
    Home,
    Users,
    Compass,
    CircleUser,
    CirclePlus
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CreatePostModal } from "@/components/createpost/CreatePostModal";

export default function MobileBottomNav() {
    const { userData } = useAuth();
    const [open, setOpen] = useState(false);
    const [images, setImages] = useState([]);
    const navItems = [
        {
            label: "Home",
            to: "/feed",
            icon: Home,
        },
        {
            label: "Explore",
            to: "/explore",
            icon: Compass,
        },
        {
            label: "Create",
            action: true,
            icon: CirclePlus,
        },
        {
            label: "Followers",
            to: `/followers/${userData.username}`,
            icon: Users,
        },
        {
            label: "Profile",
            to: `/profile/${userData.username}`,
            icon: CircleUser,
        },
    ];

    function handleRemovePhoto(index) {
        if (typeof index === "number") {
            setImages((prev) => prev.filter((_, idx) => idx !== index));
        } else {
            setImages([]);
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
            <CreatePostModal
                open={open}
                onOpenChange={handleOpenChange}
                user={userData}
                images={images}
                setImages={setImages}
                handleRemovePhoto={handleRemovePhoto}
            />
            <nav className="fixed bottom-0 left-0 right-0 z-50 shadow-sm bg-(--background) px-2 py-2 lg:hidden">
                <div className="mx-auto flex max-w-md items-center justify-between gap-2">
                    {navItems.map((item) => (
                        item.action ? (
                            <button
                                key={item.label}
                                type="button"
                                onClick={() => setOpen(true)}
                                aria-label={item.label}
                                className="type-label-sm sidebar-item flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl p-2 transition">
                                <item.icon size={22} />
                                <span>{item.label}</span>
                            </button>
                        ) : (
                            <NavLink
                                key={item.label}
                                to={item.to}
                                className={({ isActive }) => `type-label-sm flex flex-1 flex-col items-center justify-center gap-1 rounded-xl p-2 transition
                            ${isActive ? "sidebar-item active" : "sidebar-item"}`}>
                                <item.icon size={22} />
                                <span>{item.label}</span>
                            </NavLink>
                        )
                    ))}
                </div>
            </nav>
        </>
    )
}
