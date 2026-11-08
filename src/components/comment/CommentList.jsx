import { useMemo } from "react";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import { useAuth } from "@/hooks/useAuth";

function nestComments(flatComments) {
  if (!flatComments || flatComments.length === 0) return [];
  if (!flatComments.some((c) => Boolean(c.parentCommentId))) {
    return flatComments;
  }
  const map = new Map();
  flatComments.forEach((c) => {
    map.set(c.id, { ...c, replies: c.replies ? [...c.replies] : [] });
  });
  const roots = [];
  flatComments.forEach((c) => {
    const item = map.get(c.id);
    if (c.parentCommentId && map.has(c.parentCommentId)) {
      const parent = map.get(c.parentCommentId);
      if (!parent.replies.some((r) => r.id === item.id)) {
        parent.replies.push(item);
      }
    } else {
      roots.push(item);
    }
  });
  return roots.length > 0 ? roots.reverse() : flatComments;
}

export default function CommentList({ post }) {
  const { userData } = useAuth();
  const postComments = useMemo(() => nestComments(post.comments || []), [post.comments]);

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
