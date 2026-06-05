import { MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'

export default function PostHeader({ post, onDelete, canDelete }) {

    const { userData } = useAuth();
    const postOwner = post.author.id === userData.id
    const author = postOwner ? userData : post.author;
    const canDeletePost = canDelete ?? postOwner;

    return (
        <>
            <div className="flex items-start justify-between">

                <Link to={`/profile/${author.username}`} className="flex items-center gap-3">

                    <img src={author.avatar} alt={author.name} className="avatar-lg" />

                    <div>
                        <h3 className="type-label-md text-primary">
                            {author.name}
                        </h3>

                        <p className="type-body-sm text-secondary">
                            {post.createdAt}
                        </p>
                    </div>

                </Link>

                {canDeletePost && onDelete && (
                    <DropdownMenu>
                        <DropdownMenuTrigger type="button" className="icon-button-soft border-0 bg-transparent p-2 outline-none" aria-label="Open post actions">
                            <MoreHorizontal size={18} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-20" align="center">
                            <DropdownMenuItem variant="destructive" onClick={() => onDelete(post.id)}>
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </>
    )
}
