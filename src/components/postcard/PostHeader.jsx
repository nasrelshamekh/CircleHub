import { Copy, MoreHorizontal, Pencil, Share2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { formatPostDate } from "@/lib/formatDate";
import Avatar from "@/components/profileimages/Avatar";

export default function PostHeader({ post, onDelete, canDelete, onEdit }) {
    const { userData } = useAuth();
    const postOwner = post.author.id === userData?.id;
    const author = postOwner ? userData : post.author;
    const canDeletePost = canDelete ?? postOwner;

    async function handleCopyLink() {
        try {
            const url = `${window.location.origin}/post/${post.id}`;
            await navigator.clipboard.writeText(url);
            toast.success("Post link copied to clipboard!");
        } catch {
            toast.error("Could not copy link");
        }
    }

    async function handleShare() {
        const url = `${window.location.origin}/post/${post.id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Post by ${author.name} on CircleHub`,
                    text: post.content ? post.content.slice(0, 100) : "Check out this post on CircleHub",
                    url,
                });
            } catch {
                // User cancelled share dialog
            }
        } else {
            handleCopyLink();
        }
    }

    return (
        <div className="flex items-start justify-between">
            <Link to={`/profile/${author.username}`} className="flex items-center gap-3">
                <Avatar src={author.avatarUrl} alt={author.name} className="avatar-lg" />
                <div>
                    <h3 className="type-label-md text-primary">{author.name}</h3>
                    <p className="type-body-sm text-secondary">{formatPostDate(post.createdAt)}</p>
                </div>
            </Link>

            <DropdownMenu>
                <DropdownMenuTrigger
                    type="button"
                    className="icon-button-soft border-0 bg-transparent p-2 outline-none"
                    aria-label="Open post actions"
                >
                    <MoreHorizontal size={18} />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-36" align="end">
                    <DropdownMenuItem key="copy-link" onClick={handleCopyLink} className="flex items-center gap-2">
                        <Copy size={15} />
                        Copy link
                    </DropdownMenuItem>

                    <DropdownMenuItem key="share" onClick={handleShare} className="flex items-center gap-2">
                        <Share2 size={15} />
                        Share post
                    </DropdownMenuItem>

                    {postOwner && onEdit && (
                        <DropdownMenuItem key="edit" onClick={() => onEdit(post.id)} className="flex items-center gap-2">
                            <Pencil size={15} />
                            Edit
                        </DropdownMenuItem>
                    )}

                    {canDeletePost && onDelete && (
                        <DropdownMenuItem
                            key="delete"
                            variant="destructive"
                            onClick={() => onDelete(post.id)}
                            className="flex items-center gap-2"
                        >
                            <Trash2 size={15} />
                            Delete
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
