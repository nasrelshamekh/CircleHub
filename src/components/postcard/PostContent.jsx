import { Link } from "react-router-dom";

export default function PostContent({ post, isDetailsPage = false }) {
  const contentElement = (
    <p className="type-body-md text-secondary whitespace-pre-line">
      {post.content}
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
          <img
            src={post.imageUrl}
            alt="Post full view"
            className="w-full rounded-2xl h-auto object-contain max-h-none"
          />
        ) : (
          <Link to={`/post/${post.id}`} className="block overflow-hidden rounded-2xl">
            <img
              src={post.imageUrl}
              alt="Post preview"
              className="w-full rounded-2xl object-cover max-h-125 transition-transform duration-200 hover:scale-[1.01]"
            />
          </Link>
        )
      )}
    </div>
  );
}
