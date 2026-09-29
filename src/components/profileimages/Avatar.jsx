import avatarPlaceholder from "@/assets/avatar-placeholder.svg";

export default function Avatar({
    src,
    alt = "Avatar",
    className = "",
    ...props
}) {
    return (
        <img
            src={src || avatarPlaceholder}
            alt={alt}
            className={className}
            onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = avatarPlaceholder;
            }}
            {...props}
        />
    );
}
