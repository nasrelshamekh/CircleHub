import coverPlaceholder from "@/assets/cover-placeholder.svg";

export default function CoverImage({
    src,
    alt = "Cover image",
    className = "",
    ...props
}) {
    return (
        <img
            src={src || coverPlaceholder}
            alt={alt}
            className={className}
            onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = coverPlaceholder;
            }}
            {...props}
        />
    );
}
