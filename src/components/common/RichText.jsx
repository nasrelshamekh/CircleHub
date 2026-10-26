import { Link } from "react-router-dom";

// Combined regex to match URLs, @mentions, and #hashtags
const TOKEN_REGEX = /(https?:\/\/[^\s]+|@[a-zA-Z0-9_]+|#[a-zA-Z0-9_]+)/g;

export default function RichText({ content, className = "" }) {
    if (!content) return null;

    const parts = content.split(TOKEN_REGEX);

    return (
        <span className={className}>
            {parts.map((part, index) => {
                if (!part) return null;

                // Match URLs
                if (/^https?:\/\//i.test(part)) {
                    return (
                        <a
                            key={index}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-(--primary) hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </a>
                    );
                }

                // Match @mentions
                if (part.startsWith("@") && part.length > 1) {
                    const username = part.slice(1);
                    return (
                        <Link
                            key={index}
                            to={`/profile/${username}`}
                            className="font-semibold text-(--primary) hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </Link>
                    );
                }

                // Match #hashtags
                if (part.startsWith("#") && part.length > 1) {
                    const tag = part.slice(1);
                    return (
                        <Link
                            key={index}
                            to={`/explore?q=${encodeURIComponent(tag)}`}
                            className="font-medium text-(--primary) hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </Link>
                    );
                }

                // Plain text
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
}
