import communityCoverPlaceholder from "@/assets/community-cover-placeholder.svg";

export default function CommunityCoverImage({
    src,
    alt = "Community cover image",
    className = "",
    ...props
}) {
    return (
        <img
            src={src || communityCoverPlaceholder}
            alt={alt}
            className={className}
            onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = communityCoverPlaceholder;
            }}
            {...props}
        />
    );
}