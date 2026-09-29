import { MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { formatPostDate } from '@/lib/formatDate'
import Avatar from '@/components/profileimages/Avatar'

export default function PostHeader({ post, onDelete, canDelete, onEdit }) {

    const { userData } = useAuth();
    const postOwner = post.author.id === userData.id
    const author = postOwner ? userData : post.author;
    const canDeletePost = canDelete ?? postOwner;
    const showMenu = (postOwner && onEdit) || (canDeletePost && onDelete);

    return (
        <>
            <div className="flex items-start justify-between">

                <Link to={`/profile/${author.username}`} className="flex items-center gap-3">

                    <Avatar src={author.avatarUrl} alt={author.name} className="avatar-lg" />

                    <div>
                        <h3 className="type-label-md text-primary">
                            {author.name}
                        </h3>

                        <p className="type-body-sm text-secondary">
                            {formatPostDate(post.createdAt)}
                        </p>
                    </div>

                </Link>

                {showMenu && (
                    <DropdownMenu>
                        <DropdownMenuTrigger type="button" className="icon-button-soft border-0 bg-transparent p-2 outline-none" aria-label="Open post actions">
                            <MoreHorizontal size={18} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-28" align="center">
                            {postOwner && onEdit && (
                                <DropdownMenuItem key="edit" onClick={() => onEdit(post.id)}>
                                    Edit
                                </DropdownMenuItem>
                            )}
                            {canDeletePost && onDelete && (
                                <DropdownMenuItem key="delete" variant="destructive" onClick={() => onDelete(post.id)}>
                                    Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </>
    )
}
