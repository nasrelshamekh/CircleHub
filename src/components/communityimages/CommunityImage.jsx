import communityPlaceholder from "@/assets/community-placeholder.svg";

export default function CommunityImage({
    src,
    alt = "Community image",
    className = "",
    ...props
}) {
    return (
        <img
            src={src || communityPlaceholder}
            alt={alt}
            className={className}
            onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = communityPlaceholder;
            }}
            {...props}
        />
    );
}