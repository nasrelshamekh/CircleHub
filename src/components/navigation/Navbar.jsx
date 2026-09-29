import logo from '@/assets/circlehub-logo.png'
import { Bell, MessageCircleMore, Moon, Network, Sun } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NavLink, useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'
import Avatar from '@/components/profileimages/Avatar'
import { toast } from 'sonner'

export default function Navbar() {
    const { toggleTheme, theme } = useTheme();
    const { userData, setUserData } = useAuth();
    const navigate = useNavigate();

    function handleSignout() {
        setUserData(null);
        toast.success("Signed out successfully.");
        navigate("/signin", { replace: true });
    }

    return (
        <>
            <nav className='lg:sticky lg:top-0 lg:z-50'>
                <div className="flex h-20 justify-between items-center gap-4 px-6 py-3 bg-(--surface)">
                    <NavLink to="/feed" className="min-w-0 shrink">
                        <img src={logo} alt="CircleHub Logo" className='w-40 max-w-full lg:w-50' />
                    </NavLink>
                    <div className='flex shrink-0 items-center gap-3'>
                        <button type="button" className='icon-button' aria-label="Open messages">
                            <MessageCircleMore size={22} />
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/notifications")}
                            className='icon-button'
                            aria-label="Open notifications"
                        >
                            <Bell size={22} />
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/communities")}
                            className='icon-button lg:hidden'
                            aria-label="Open communities"
                        >
                            <Network size={22} />
                        </button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex shrink-0 items-center gap-2 rounded-full"
                                    aria-label="Open account menu"
                                >
                                    <span className="hidden max-w-40 truncate lg:inline-block type-label-md">{userData.name}</span>
                                    <span className="size-10 shrink-0 overflow-hidden rounded-full">
                                        <Avatar src={userData.avatarUrl} alt={userData.name} className="size-10 rounded-full object-cover cursor-pointer" />
                                    </span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-40" align="start">
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel className="type-label-md">My Account</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                        <NavLink className="icon-button" to={`/profile/${userData.username}`}>
                                            Profile
                                        </NavLink>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <NavLink className="icon-button" to="/settings/profile">
                                            Settings
                                        </NavLink>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={toggleTheme}>
                                        {theme === "dark" ? "Light Mode" : "Dark Mode"}
                                        {theme === "dark" ? <Sun size={16} className="ml-auto" /> : <Moon size={16} className="ml-auto" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleSignout}>
                                        Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                    </div>
                </div>
            </nav>
        </>
    )
}
