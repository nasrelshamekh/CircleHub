import localCoverPlaceholder from "@/assets/cover-placeholder.svg";

export const DEFAULT_COVER_PLACEHOLDER = "https://pub-b76e67ff61074ab197c54a2a3b53b763.r2.dev/defaults/cover-placeholder.png";

export default function CoverImage({
    src,
    alt = "Cover image",
    className = "",
    ...props
}) {
    return (
        <img
            src={src || DEFAULT_COVER_PLACEHOLDER}
            alt={alt}
            className={className}
            onError={(e) => {
                if (e.currentTarget.src !== localCoverPlaceholder) {
                    e.currentTarget.src = localCoverPlaceholder;
                } else {
                    e.currentTarget.onerror = null;
                }
            }}
            {...props}
        />
    );
}
