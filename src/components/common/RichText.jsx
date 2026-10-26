import { Link } from "react-router-dom";

// Combined regex to match URLs, @mentions, and #hashtags
const TOKEN_REGEX = /(https?:\/\/[^\s]+|@[a-zA-Z0-9_]{1,30}|#[a-zA-Z0-9_\u0600-\u06FF]+)/g;

export default function RichText({ content, className = "" }) {
    if (!content) return null;

    const parts = content.split(TOKEN_REGEX);

    return (
        <span className={className}>
            {parts.map((part, index) => {
                if (!part) return null;

                // Match URLs
                if (/^https?:\/\//i.test(part)) {
                    let url = part;
                    let trailing = "";
                    const matchTrailing = url.match(/[.,;:!?)]+$/);
                    if (matchTrailing) {
                        trailing = matchTrailing[0];
                        url = url.slice(0, -trailing.length);
                    }

                    return (
                        <span key={index}>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="richtext-url font-medium"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {url}
                            </a>
                            {trailing}
                        </span>
                    );
                }

                // Match @mentions
                if (part.startsWith("@") && part.length > 1) {
                    const username = part.slice(1);
                    return (
                        <Link
                            key={index}
                            to={`/profile/${username}`}
                            className="richtext-link font-semibold"
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
                            className="richtext-link font-medium"
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
