import { useState } from "react"
import PostHeader from '../postcard/PostHeader'
import PostContent from '../postcard/PostContent'
import PostActions from '../postcard/PostActions'
import { EditPostModal } from '../editpost/EditPostModal'

export default function Post({ post, onDelete, canDelete, onToggleLike }) {
    const [editOpen, setEditOpen] = useState(false);

    return (
        <>
            <div className="content-card-padded gap-4 flex flex-col">

                <PostHeader post={post} onDelete={onDelete} canDelete={canDelete} onEdit={() => setEditOpen(true)} />

                <PostContent post={post} />

                <PostActions post={post} onToggleLike={onToggleLike} />

            </div>

            <EditPostModal open={editOpen} onOpenChange={setEditOpen} post={post} />
        </>
    )
}
