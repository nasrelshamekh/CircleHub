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
                {/* The count sits on the icon, not at the end of the row: it is the badge's job to be found
                    by the icon the reader already looks at, and pinning it to the icon keeps Messages and
                    Notifications reading the same way whether or not the sidebar is expanded. The wrapper is
                    what the badge is positioned against, exactly like the navbar's icon buttons. */}
                <span className="relative shrink-0">
                    <Icon size={20} />
                    {hasBadge && (
                        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--primary) px-1 text-[10px] leading-none font-semibold text-(--on-primary)">
                            {badge}
                        </span>
                    )}
                </span>
                {label && <span>{label}</span>}
            </NavLink>
        </div>
    )
}
