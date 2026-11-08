import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import { useAuth } from "@/hooks/useAuth";

export default function CommentList({ post }) {
  const { userData } = useAuth();
  const postComments = post.comments || [];

  return (
    <div className="content-card p-5">
      <h3 className="type-title-lg mb-4 text-primary">
        Comments {post.commentsCount ? `(${post.commentsCount})` : ""}
      </h3>
      <CommentForm postId={post.id} user={userData} />
      {postComments.length > 0 ? (
        <div className="space-y-4">
          {postComments.map((comment) => (
            <CommentItem
              key={comment.id}
              {...comment}
              postId={post.id}
              depth={0}
            />
          ))}
        </div>
      ) : (
        <p className="type-body-sm text-secondary text-center">
          No comments yet. Be the first to comment.
        </p>
      )}
    </div>
  );
}
