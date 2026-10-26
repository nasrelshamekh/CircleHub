import { Link } from "react-router-dom";
import RichText from "@/components/common/RichText";

export default function PostContent({ post, isDetailsPage = false }) {
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
          <Link
            to={`/post/${post.id}`}
            className="block transition-opacity hover:opacity-85"
          >
            {contentElement}
          </Link>
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
                className="max-h-[520px] max-w-full w-auto h-auto object-contain rounded-2xl transition-transform duration-200 hover:scale-[1.01]"
              />
            </div>
          </Link>
        )
      )}
    </div>
  );
}
