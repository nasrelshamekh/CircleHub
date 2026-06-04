import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export default function CommentItem({
  id,
  postId,
  author: { name, avatar, username },
  content,
  createdAt,
  isCommentOwner,
  onDeleteComment,
}) {
  return (
    <div className="flex gap-3">
      <Link to={`/profile/${username}`}>
        <img
          src={avatar}
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
              <DropdownMenuTrigger type="button" className="icon-button-soft border-0 bg-transparent p-2 outline-none">
                <MoreHorizontal size={18} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-20" align="center">
                <DropdownMenuItem variant="destructive" onClick={() => onDeleteComment(postId, id)}>
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
            {createdAt}
          </span>
        </div>
      </div>
    </div>
  );
}
