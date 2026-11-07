import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useDeleteComment } from "@/hooks/mutations/useDeleteComment";
import Avatar from "@/components/profileimages/Avatar";
import RichText from "@/components/common/RichText";
import MediaLightbox from "@/components/common/MediaLightbox";
import { parseGifContent } from "@/services/gifService";

export default function CommentItem({
  id,
  postId,
  author: { name, avatarUrl, username },
  content,
  createdAt,
  isCommentOwner,
}) {
  const deleteComment = useDeleteComment();
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const { text, gifUrl } = useMemo(() => parseGifContent(content), [content]);

  function handleDelete() {
    if (deleteComment.isPending) return;

    deleteComment.mutate({ postId, commentId: id });
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
        <div className="flex flex-col gap-1 mt-1">
          {text ? (
            <p className="type-body-sm-readable text-secondary whitespace-pre-wrap">
              <RichText content={text} />
            </p>
          ) : null}

          {gifUrl && (
            <div
              onClick={() => setLightboxSrc(gifUrl)}
              className="group relative inline-block self-start overflow-hidden rounded-xl border border-(--border)/50 bg-(--surface-container) cursor-zoom-in max-w-[280px]"
            >
              <img
                src={gifUrl}
                alt="Comment GIF"
                loading="lazy"
                className="max-h-52 w-auto object-cover rounded-xl transition-transform duration-200 group-hover:scale-[1.01]"
              />
              <div className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-xs">
                GIF
              </div>
            </div>
          )}

          <div className="flex items-center justify-end">
            <span className="type-label-sm text-secondary">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>

      <MediaLightbox
        src={lightboxSrc}
        isOpen={Boolean(lightboxSrc)}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}
