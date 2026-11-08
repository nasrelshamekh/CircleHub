import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { ChevronDown, ChevronUp, Heart, MoreHorizontal, Reply } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useDeleteComment } from "@/hooks/mutations/useDeleteComment";
import { useToggleCommentLike } from "@/hooks/mutations/useToggleCommentLike";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/profileimages/Avatar";
import RichText from "@/components/common/RichText";
import MediaLightbox from "@/components/common/MediaLightbox";
import { parseGifContent } from "@/services/gifService";
import CommentForm from "./CommentForm";

export default function CommentItem({
  id,
  postId,
  author = {},
  content,
  createdAt,
  isCommentOwner,
  parentAuthorName = null,
  likesCount = 0,
  isLiked = false,
  replies = [],
  depth = 0,
}) {
  const { userData } = useAuth();
  const deleteComment = useDeleteComment();
  const toggleLike = useToggleCommentLike();
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const { name = "", avatarUrl = null, username = "" } = author || {};
  const { text, gifUrl } = useMemo(() => parseGifContent(content), [content]);

  function handleDelete() {
    if (deleteComment.isPending) return;
    deleteComment.mutate({ postId, commentId: id });
  }

  function handleToggleLike() {
    if (toggleLike.isPending) return;
    toggleLike.mutate({ postId, commentId: id });
  }

  const effectiveIsOwner = isCommentOwner ?? (author?.id === userData?.id);

  return (
    <div className="flex flex-col w-full">
      <div className="flex gap-3">
        <Link to={`/profile/${username}`}>
          <Avatar
            src={avatarUrl}
            alt={name}
            className={depth > 0 ? "avatar-sm" : "avatar-md"}
          />
        </Link>

        <div className="input-surface flex-1 rounded-2xl p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link to={`/profile/${username}`} className="type-label-md text-primary font-semibold hover:underline">
                {name}
              </Link>
              {parentAuthorName && depth > 0 && (
                <span className="text-xs text-secondary">
                  replying to <span className="font-medium text-primary">@{parentAuthorName}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="type-label-sm text-secondary text-xs">
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </span>

              {effectiveIsOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    type="button"
                    className="icon-button-soft border-0 bg-transparent p-1 outline-none"
                    aria-label="Open comment actions"
                  >
                    <MoreHorizontal size={16} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-24" align="end">
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
          </div>

          <div className="flex flex-col gap-1 mt-1.5">
            {text ? (
              <p className="type-body-sm-readable text-secondary whitespace-pre-wrap">
                <RichText content={text} />
              </p>
            ) : null}

            {gifUrl && (
              <div
                onClick={() => setLightboxSrc(gifUrl)}
                className="group relative inline-block self-start overflow-hidden rounded-xl border border-(--border)/50 bg-(--surface-container) cursor-zoom-in max-w-[280px] mt-1"
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
          </div>

          {/* Action Row: Like + Reply */}
          <div className="flex items-center gap-4 mt-2.5 pt-1 border-t border-(--border)/30">
            <button
              type="button"
              onClick={handleToggleLike}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                isLiked ? "text-(--primary)" : "text-secondary hover:text-primary"
              }`}
              aria-label={isLiked ? "Unlike comment" : "Like comment"}
            >
              <Heart
                size={14}
                className={isLiked ? "fill-current text-(--primary)" : ""}
              />
              <span>{likesCount > 0 ? likesCount : "Like"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReplying((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-primary transition-colors"
              aria-label="Reply to comment"
            >
              <Reply size={14} />
              <span>Reply</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inline Reply Composer */}
      {isReplying && (
        <div className="pl-12 mt-2 w-full">
          <CommentForm
            postId={postId}
            user={userData}
            parentCommentId={id}
            replyingTo={{ name, username }}
            onCancelReply={() => setIsReplying(false)}
            onSuccess={() => {
              setIsReplying(false);
              setShowReplies(true);
            }}
            compact
          />
        </div>
      )}

      {/* Collapsible Nested Replies */}
      {replies && replies.length > 0 && (
        <div className="pl-12 mt-2 w-full">
          {!showReplies ? (
            <button
              type="button"
              onClick={() => setShowReplies(true)}
              className="flex items-center gap-2 text-xs font-semibold text-secondary hover:text-primary transition-colors py-1 group"
              aria-expanded={false}
            >
              <div className="w-5 h-[1.5px] bg-(--border) group-hover:bg-primary transition-colors" />
              <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
              <span>
                View {replies.length} {replies.length === 1 ? "reply" : "replies"}
              </span>
            </button>
          ) : (
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setShowReplies(false)}
                className="flex items-center gap-2 text-xs font-semibold text-secondary hover:text-primary transition-colors py-1 mb-2 group"
                aria-expanded={true}
              >
                <div className="w-5 h-[1.5px] bg-(--border) group-hover:bg-primary transition-colors" />
                <ChevronUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                <span>
                  Hide {replies.length === 1 ? "reply" : "replies"}
                </span>
              </button>

              <div className="pl-4 md:pl-6 border-l-2 border-(--border)/60 space-y-3">
                {replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    {...reply}
                    postId={postId}
                    depth={depth + 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <MediaLightbox
        src={lightboxSrc}
        isOpen={Boolean(lightboxSrc)}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}
