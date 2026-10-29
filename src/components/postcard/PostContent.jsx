import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Maximize2 } from "lucide-react";
import RichText from "@/components/common/RichText";
import MediaLightbox from "@/components/common/MediaLightbox";

export default function PostContent({ post, isDetailsPage = false }) {
  const navigate = useNavigate();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleContentClick = () => {
    if (!isDetailsPage) {
      navigate(`/post/${post.id}`);
    }
  };

  const contentElement = (
    <p className="type-body-md text-secondary whitespace-pre-line">
      <RichText content={post.content} />
    </p>
  );

  return (
    <div className="flex flex-col gap-4">
      {post.content && (
        isDetailsPage ? (
          contentElement
        ) : (
          <div
            onClick={handleContentClick}
            className="block cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !isDetailsPage) {
                e.preventDefault();
                handleContentClick();
              }
            }}
          >
            {contentElement}
          </div>
        )
      )}

      {post.imageUrl && (
        isDetailsPage ? (
          <>
            <div
              onClick={() => setIsLightboxOpen(true)}
              className="group relative flex justify-center w-full overflow-hidden rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] cursor-zoom-in"
              role="button"
              tabIndex={0}
              aria-label="Open image in full screen"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsLightboxOpen(true);
                }
              }}
            >
              <img
                src={post.imageUrl}
                alt="Post full view"
                className="max-h-[72vh] max-w-full w-auto h-auto object-contain rounded-2xl transition-transform duration-200 group-hover:scale-[1.01]"
              />
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md text-white p-2 rounded-full shadow-lg">
                <Maximize2 size={16} />
              </div>
            </div>

            <MediaLightbox
              src={post.imageUrl}
              alt={post.content?.slice(0, 40) || "Post image"}
              isOpen={isLightboxOpen}
              onClose={() => setIsLightboxOpen(false)}
            />
          </>
        ) : (
          <Link to={`/post/${post.id}`} className="block overflow-hidden rounded-2xl bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="flex justify-center w-full">
              <img
                src={post.imageUrl}
                alt="Post preview"
                className="max-h-[520px] max-w-full w-auto h-auto object-contain rounded-2xl"
              />
            </div>
          </Link>
        )
      )}
    </div>
  );
}
