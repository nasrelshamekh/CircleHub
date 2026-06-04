import {
  Heart,
  MessageCircle,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PostActions({ post }) {

  const navigate = useNavigate()

  return (
    <>
      <div className="flex items-center pt-3">

        <button type="button" className="post-action-button">
          <Heart size={20} />
          <span>{post.likesCount}</span>
        </button>

        <button type="button" onClick={() => navigate(`/post/${post.id}`)} className="post-action-button">
          <MessageCircle size={20} />
          <span>{post.commentsCount}</span>
        </button>

        <button type="button" className="post-action-button">
          <Send size={20} />
        </button>

      </div>
    </>
  )
}
