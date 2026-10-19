import Avatar from "@/components/profileimages/Avatar";

/**
 * The body of a "you have a message" toast. It is a button because there is exactly one thing to do with a
 * notification — go and read it — so the whole card is the click target rather than a link tucked inside it.
 */
export default function MessageToast({ name, avatarUrl, preview, onOpen }) {
    return (
        <button
            type="button"
            onClick={onOpen}
            className="flex w-full cursor-pointer items-center gap-3 text-left"
        >
            <Avatar
                src={avatarUrl}
                alt={name}
                className="avatar-md block shrink-0"
            />

            <span className="min-w-0 flex-1">
                <span className="type-label-md block truncate text-primary">
                    {name}
                </span>
                <span className="type-body-sm text-secondary line-clamp-2">
                    {preview}
                </span>
            </span>
        </button>
    );
}
