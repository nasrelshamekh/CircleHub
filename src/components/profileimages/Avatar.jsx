import localAvatarPlaceholder from "@/assets/avatar-placeholder.svg";

export const DEFAULT_AVATAR_PLACEHOLDER = "https://pub-b76e67ff61074ab197c54a2a3b53b763.r2.dev/defaults/avatar-placeholder.png";

export default function Avatar({
    src,
    alt = "Avatar",
    className = "",
    ...props
}) {
    return (
        <img
            src={src || DEFAULT_AVATAR_PLACEHOLDER}
            alt={alt}
            className={className}
            onError={(e) => {
                if (e.currentTarget.src !== localAvatarPlaceholder) {
                    e.currentTarget.src = localAvatarPlaceholder;
                } else {
                    e.currentTarget.onerror = null;
                }
            }}
            {...props}
        />
    );
}
