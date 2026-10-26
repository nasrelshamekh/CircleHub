import { Link, useNavigate } from "react-router-dom";
import RichText from "@/components/common/RichText";

export default function PostContent({ post, isDetailsPage = false }) {
  const navigate = useNavigate();

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
          <div className="flex justify-center w-full overflow-hidden rounded-2xl bg-black/[0.02] dark:bg-white/[0.02]">
            <img
              src={post.imageUrl}
              alt="Post full view"
              className="max-h-[72vh] max-w-full w-auto h-auto object-contain rounded-2xl"
            />
          </div>
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
