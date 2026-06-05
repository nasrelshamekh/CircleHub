import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import { useAuth } from "@/hooks/useAuth";

export default function CommentList({ post, onAddComment, onDeleteComment }) {
  const { userData } = useAuth();
  const postComments = post.comments || [];

  return (
    <div className="content-card p-5">
      <h3 className="type-title-lg mb-4 text-primary">
        Comments
      </h3>
      <CommentForm onAddComment={onAddComment} postId={post.id} user={userData} />
      {postComments.length > 0 ? (
        <div className="space-y-4">
          {postComments.map((comment) => {
            const isCommentOwner =
              comment.author?.id === userData.id;
            const displayAuthor = isCommentOwner ? userData : comment.author;

            return (
              <CommentItem
                key={comment.id}
                {...comment}
                author={displayAuthor}
                isCommentOwner={isCommentOwner}
                onDeleteComment={onDeleteComment}
              />
            );
          })}
        </div>
      ) : (
        <p className="type-body-sm text-secondary text-center">
          No comments yet. Be the first to comment.
        </p>
      )}
    </div>
  );
}
