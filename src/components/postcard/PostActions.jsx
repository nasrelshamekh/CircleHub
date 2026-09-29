import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Send,
} from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

export default function PostActions({ post, onToggleLike }) {

  const navigate = useNavigate();
  const isLiked = post.isLikedByMe;
  const [hasInteracted, setHasInteracted] = useState(false);

  function handleToggleLike() {
    setHasInteracted(true);
    onToggleLike?.(post.id);
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

        <button type="button" className="post-action-button" aria-label="Share post">
          <Send size={20} />
        </button>

      </div>
    </>
  )
}
