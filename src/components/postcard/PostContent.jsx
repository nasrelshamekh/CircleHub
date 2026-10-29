import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Maximize2 } from "lucide-react";
import RichText from "@/components/common/RichText";
import MediaLightbox from "@/components/common/MediaLightbox";
import PollWidget from "@/components/postcard/PollWidget";

export default function PostContent({ post, isDetailsPage = false }) {
  const navigate = useNavigate();
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const handleContentClick = () => {
    if (!isDetailsPage) {
      navigate(`/post/${post.id}`);
    }
  };

  const images = post.imageUrls?.length > 0
    ? post.imageUrls
    : (post.imageUrl ? [post.imageUrl] : []);

  const contentElement = (
    <p className="type-body-md text-secondary whitespace-pre-line">
      <RichText content={post.content} />
    </p>
  );

  const openLightbox = (src, e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    setLightboxSrc(src);
  };

  const renderGallery = () => {
    if (images.length === 0) return null;

    // Single image
    if (images.length === 1) {
      const src = images[0];
      if (isDetailsPage) {
        return (
          <div
            onClick={(e) => openLightbox(src, e)}
            className="group relative flex justify-center w-full overflow-hidden rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] cursor-zoom-in"
            role="button"
            tabIndex={0}
            aria-label="Open image in full screen"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openLightbox(src, e);
              }
            }}
          >
            <img
              src={src}
              alt="Post full view"
              className="max-h-[72vh] max-w-full w-auto h-auto object-contain rounded-2xl transition-transform duration-200 group-hover:scale-[1.01]"
            />
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md text-white p-2 rounded-full shadow-lg">
              <Maximize2 size={16} />
            </div>
          </div>
        );
      }

      return (
        <Link to={`/post/${post.id}`} className="block overflow-hidden rounded-2xl bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex justify-center w-full">
            <img
              src={src}
              alt="Post preview"
              className="max-h-[520px] max-w-full w-auto h-auto object-contain rounded-2xl"
            />
          </div>
        </Link>
      );
    }

    // 2 images
    if (images.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden h-72 sm:h-80">
          {images.map((src, idx) => (
            <div
              key={idx}
              onClick={(e) => isDetailsPage ? openLightbox(src, e) : navigate(`/post/${post.id}`)}
              className="relative h-full w-full bg-black/[0.03] dark:bg-white/[0.03] overflow-hidden cursor-pointer group"
            >
              <img
                src={src}
                alt={`Gallery image ${idx + 1}`}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </div>
          ))}
        </div>
      );
    }

    // 3 images
    if (images.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden h-80 sm:h-96">
          <div
            onClick={(e) => isDetailsPage ? openLightbox(images[0], e) : navigate(`/post/${post.id}`)}
            className="h-full w-full bg-black/[0.03] dark:bg-white/[0.03] overflow-hidden cursor-pointer group"
          >
            <img
              src={images[0]}
              alt="Gallery image 1"
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </div>
          <div className="grid grid-rows-2 gap-2 h-full">
            {images.slice(1, 3).map((src, idx) => (
              <div
                key={idx}
                onClick={(e) => isDetailsPage ? openLightbox(src, e) : navigate(`/post/${post.id}`)}
                className="h-full w-full bg-black/[0.03] dark:bg-white/[0.03] overflow-hidden cursor-pointer group"
              >
                <img
                  src={src}
                  alt={`Gallery image ${idx + 2}`}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 4 or more images
    return (
      <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden h-80 sm:h-96">
        {images.slice(0, 4).map((src, idx) => {
          const hasMore = idx === 3 && images.length > 4;
          return (
            <div
              key={idx}
              onClick={(e) => isDetailsPage ? openLightbox(src, e) : navigate(`/post/${post.id}`)}
              className="relative h-full w-full bg-black/[0.03] dark:bg-white/[0.03] overflow-hidden cursor-pointer group"
            >
              <img
                src={src}
                alt={`Gallery image ${idx + 1}`}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
              {hasMore && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white font-bold text-xl">
                  +{images.length - 3}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {post.content && (!post.poll || post.content.trim() !== post.poll.question?.trim()) && (
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

      {/* Interactive Poll Widget */}
      {post.poll && (
        <PollWidget postId={post.id} poll={post.poll} />
      )}

      {/* Image Gallery or Single Image */}
      {renderGallery()}

      {/* Lightbox Modal */}
      <MediaLightbox
        src={lightboxSrc}
        alt={post.content?.slice(0, 40) || "Post image"}
        isOpen={Boolean(lightboxSrc)}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}
