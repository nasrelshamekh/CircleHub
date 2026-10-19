import {
  Home,
  Compass,
  Users,
  Bell,
  Settings,
  CircleUser,
  Network,
  MessageCircleMore
} from "lucide-react";
import SidebarNavItem from './SidebarNavItem';
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";



export default function SidebarNav({ isExpanded }) {
  const { userData } = useAuth();
  const unreadCount = useUnreadMessages();
  const unreadNotifications = useUnreadNotifications();
  const navItems = [
    {
      label: "Home",
      to: "/feed",
      icon: Home,
    },
    {
      label: "Profile",
      to: `/profile/${userData.username}`,
      icon: CircleUser,
    },
    {
      label: "Explore",
      to: "/explore",
      icon: Compass,
    },
    {
      label: "Followers",
      to: `/followers/${userData.username}`,
      icon: Users,
    },
    {
      label: "Communities",
      to: `/communities`,
      icon: Network,
    },
    {
      label: "Messages",
      to: "/messages",
      icon: MessageCircleMore,
      badge: unreadCount,
    },
    {
      label: "Notifications",
      to: "/notifications",
      icon: Bell,
      badge: unreadNotifications,
    },
    {
      label: "Settings",
      to: "/settings/profile",
      icon: Settings,
    },
  ];

  return (
    <nav className="space-y-5">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.label}
            to={item.to}
            icon={item.icon}
            label={isExpanded ? item.label : undefined}
            title={item.label}
            badge={item.badge}
          />
        ))}
      </nav>
  )
}
