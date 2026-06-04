import {
    Home,
    Bell,
    Users,
    Compass,
    CircleUser
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";



export default function MobileBottomNav() {
    const { userData } = useAuth();
    const navItems = [
        {
            label: "Home",
            to: "/feed",
            icon: Home,
        },
        {
            label: "Followers",
            to: `/followers/${userData.username}`,
            icon: Users,
        },
        {
            label: "Explore",
            to: "/explore",
            icon: Compass,
        },
        {
            label: "Notifications",
            to: "/notifications",
            icon: Bell,
        },
        {
            label: "Profile",
            to: `/profile/${userData.username}`,
            icon: CircleUser,
        },
    ];

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-50 shadow-sm bg-(--background) px-2 py-2 lg:hidden">
                <div className="mx-auto flex max-w-md items-center justify-between gap-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            className={({ isActive }) => `type-label-sm flex flex-1 flex-col items-center justify-center gap-1 rounded-xl p-2 transition
                            ${isActive ? "sidebar-item active" : "sidebar-item"}`}>
                            <item.icon size={22} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>
        </>
    )
}
