import { NavLink } from "react-router-dom";

export default function SidebarNavItem({
    to,
    icon: Icon,
    label,
    title,
    badge,
}) {
    const isCollapsed = !label;
    const hasBadge = badge > 0;

    return (
        <div>
            <NavLink
                to={to}
                title={isCollapsed ? title : undefined}
                aria-label={
                    isCollapsed
                        ? hasBadge
                            ? `${title}, ${badge} unread`
                            : title
                        : undefined
                }
                className={({ isActive }) =>
                    `relative flex items-center rounded-xl p-2 font-medium transition-colors ${isCollapsed ? 'justify-center' : 'gap-3'} ${isActive ? 'sidebar-item active' : 'sidebar-item'}`
                }
            >
                <Icon size={20} className="shrink-0" />
                {label && <span>{label}</span>}
                {hasBadge &&
                    (isCollapsed ? (
                        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-(--primary)" />
                    ) : (
                        <span className="type-label-sm ml-auto flex min-w-5 items-center justify-center rounded-full bg-(--primary) px-1.5 py-0.5 font-semibold text-(--on-primary)">
                            {badge}
                        </span>
                    ))}
            </NavLink>
        </div>
    )
}
