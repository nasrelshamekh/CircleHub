import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useDeleteComment } from "@/hooks/mutations/useDeleteComment";
import Avatar from "@/components/profileimages/Avatar";

export default function CommentItem({
  id,
  postId,
  author: { name, avatarUrl, username },
  content,
  createdAt,
  isCommentOwner,
}) {
  const deleteComment = useDeleteComment();

  function handleDelete() {
    if (deleteComment.isPending) return;

    deleteComment.mutate(
      { postId, commentId: id });
  }

  return (
    <div className="flex gap-3">
      <Link to={`/profile/${username}`}>
        <Avatar
          src={avatarUrl}
          alt={name}
          className="avatar-md"
        />
      </Link>

      <div className="input-surface flex-1 rounded-2xl p-3">
        <div className="flex items-center justify-between gap-3">
          <Link to={`/profile/${username}`} className="type-label-md text-primary">
            {name}
          </Link>
          {isCommentOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger type="button" className="icon-button-soft border-0 bg-transparent p-2 outline-none" aria-label="Open comment actions">
                <MoreHorizontal size={18} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-20" align="center">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteComment.isPending}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="type-body-sm-readable mt-1 text-secondary">
            {content}
          </p>
          <span className="type-label-sm text-secondary">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
