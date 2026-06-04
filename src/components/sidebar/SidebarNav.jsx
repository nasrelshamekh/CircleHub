import {
  Home,
  Compass,
  Users,
  Bell,
  Settings,
  CircleUser,
  Network
} from "lucide-react";
import SidebarNavItem from './SidebarNavItem';
import { useAuth } from "@/hooks/useAuth";



export default function SidebarNav({ isExpanded }) {
  const { userData } = useAuth();
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
      label: "Notifications",
      to: "/notifications",
      icon: Bell,
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
          />
        ))}
      </nav>
  )
}
