import { useState } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Send,
} from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { SharePostDialog } from "@/components/messages/SharePostDialog";
import { useBookmarks } from "@/hooks/useBookmarks";

export default function PostActions({ post, onToggleLike }) {

  const navigate = useNavigate();
  const isLiked = post.isLikedByMe;
  const [hasInteracted, setHasInteracted] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(post.id);

  function handleToggleLike() {
    setHasInteracted(true);
    onToggleLike?.(post.id);
  }

  function handleToggleBookmark(e) {
    e.stopPropagation();
    const next = toggleBookmark(post);
    if (next) {
      toast.success("Post saved to bookmarks");
    } else {
      toast.info("Post removed from bookmarks");
    }
  }

  return (
    <>
      <div className="flex items-center pt-3">

        <button
          type="button"
          onClick={handleToggleLike}
          className={`post-action-button ${isLiked ? "text-(--primary)" : ""}`}
          aria-label={isLiked ? `Unlike post. ${post.likesCount} likes` : `Like post. ${post.likesCount} likes`}
          aria-pressed={isLiked}
        >
          <motion.span
            initial={false}
            animate={
              hasInteracted
                ? { scale: isLiked ? [1, 1.3, 1] : [1, 0.85, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex"
          >
            <Heart size={20} className={isLiked ? "fill-current" : ""} />
          </motion.span>
          <span>{post.likesCount}</span>
        </button>

        <button type="button" onClick={() => navigate(`/post/${post.id}`)} className="post-action-button" aria-label={`View comments. ${post.commentsCount} comments`}>
          <MessageCircle size={20} />
          <span>{post.commentsCount}</span>
        </button>

        <button type="button" onClick={() => setShareOpen(true)} className="post-action-button" aria-label="Send post">
          <Send size={20} />
        </button>

        <button
          type="button"
          onClick={handleToggleBookmark}
          className={`post-action-button ml-auto ${bookmarked ? "text-(--primary)" : ""}`}
          aria-label={bookmarked ? "Remove bookmark" : "Save post"}
          aria-pressed={bookmarked}
        >
          <Bookmark size={20} className={bookmarked ? "fill-current" : ""} />
        </button>

      </div>

      <SharePostDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        post={post}
      />
    </>
  )
}
