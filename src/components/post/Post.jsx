import PostHeader from '../postcard/PostHeader'
import PostContent from '../postcard/PostContent'
import PostActions from '../postcard/PostActions'

export default function Post({ post, onDelete, canDelete, onToggleLike }) {
    return (
        <>
            <div className="content-card-padded gap-4 flex flex-col">

                <PostHeader post={post} onDelete={onDelete} canDelete={canDelete} />

                <PostContent post={post} />

                <PostActions post={post} onToggleLike={onToggleLike} />

            </div>
        </>
    )
}
