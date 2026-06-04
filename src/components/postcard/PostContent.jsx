import { Link } from "react-router-dom"

export default function PostContent({ post }) {

  return (
    <>
      <div className="flex flex-col gap-4">

        <p className="type-body-md text-secondary">
          {post.content}
        </p>

        {post.image && (
          <Link to={`/post/${post.id}`}>
            <img src={post.image} alt="Post" className="w-full rounded-2xl object-cover max-h-125" />
          </Link>)}

      </div>
    </>
  )
}
