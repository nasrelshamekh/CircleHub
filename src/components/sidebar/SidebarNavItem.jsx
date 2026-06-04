import { NavLink } from "react-router-dom";

export default function SidebarNavItem({
    to,
    icon: Icon,
    label,
    title,
}) {
    const isCollapsed = !label;

    return (
        <div>
            <NavLink
                to={to}
                title={isCollapsed ? title : undefined}
                aria-label={isCollapsed ? title : undefined}
                className={({ isActive }) =>
                    `flex items-center rounded-xl p-2 font-medium transition-colors ${isCollapsed ? 'justify-center' : 'gap-3'} ${isActive ? 'sidebar-item active' : 'sidebar-item'}`
                }
            >
                <Icon size={20} className="shrink-0" />
                {label && <span>{label}</span>}
            </NavLink>
        </div>
    )
}
