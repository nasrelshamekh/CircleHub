import communityPostComments from "./communityPostComments";
import users from "./users";

const communityPostRows = [
  {
    id: 101,
    communitySlug: "react-builders",
    authorUsername: "ethan.react",
    content:
      "What patterns are you using lately for keeping component state readable in larger React screens?",
    image: null,
    createdAt: "25 minutes ago",
    commentsCount: 14,
    likesCount: 0,
    likedBy: [],
  },
  {
    id: 102,
    communitySlug: "react-builders",
    authorUsername: "sophialee.dev",
    content:
      "Shared a small hook refactor today. The biggest win was making the event names obvious.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    createdAt: "2 hours ago",
    commentsCount: 9,
    likesCount: 1,
    likedBy: ["maya.creates"],
  },
  {
    id: 103,
    communitySlug: "ui-designers-hub",
    authorUsername: "elena.designs",
    content:
      "A compact card can still feel polished if spacing, hierarchy, and action placement are doing their jobs.",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5",
    createdAt: "1 hour ago",
    commentsCount: 11,
    likesCount: 2,
    likedBy: ["karim.builds", "ava.product"],
  },
  {
    id: 104,
    communitySlug: "student-developers",
    authorUsername: "ryan.beta",
    content:
      "For beginners: pick one small project and finish the first working version before adding extra features.",
    image: null,
    createdAt: "3 hours ago",
    commentsCount: 18,
    likesCount: 3,
    likedBy: ["alex.components", "natalie.tokens", "priya.systems"],
  },
  {
    id: 105,
    communitySlug: "startup-makers",
    authorUsername: "ava.product",
    content:
      "A useful MVP usually answers one sharp question, not every possible future product question.",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd",
    createdAt: "5 hours ago",
    commentsCount: 7,
    likesCount: 4,
    likedBy: ["leo.frontend", "youssef.codes", "lina.accessible", "ethan.react"],
  },
  {
    id: 106,
    communitySlug: "tailwind-css-lab",
    authorUsername: "alex.components",
    content:
      "Token-first Tailwind work gets easier when your CSS variables describe intent instead of exact colors.",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
    createdAt: "6 hours ago",
    commentsCount: 13,
    likesCount: 5,
    likedBy: ["ethan.react", "nasr.dev", "elena.designs", "davidcodes", "maya.creates"],
  },
  {
    id: 107,
    communitySlug: "full-stack-circle",
    authorUsername: "karim.builds",
    content:
      "When the frontend data shape and backend response shape agree early, everything after that moves faster.",
    image: null,
    createdAt: "7 hours ago",
    commentsCount: 10,
    likesCount: 6,
    likedBy: ["davidcodes", "maya.creates", "omar.ui", "sophialee.dev", "karim.builds", "ava.product"],
  },
  {
    id: 108,
    communitySlug: "open-source-friends",
    authorUsername: "priya.systems",
    content:
      "Good contribution docs are part of the product. They decide whether a newcomer feels welcome enough to try.",
    image: "https://images.unsplash.com/photo-1556075798-4825dfaaf498",
    createdAt: "8 hours ago",
    commentsCount: 15,
    likesCount: 2,
    likedBy: ["sophialee.dev", "karim.builds"],
  },
  {
    id: 109,
    communitySlug: "portfolio-reviews",
    authorUsername: "james.portfolio",
    content:
      "Portfolio review tip: show the problem and result before showing the process details.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    createdAt: "9 hours ago",
    commentsCount: 12,
    likesCount: 5,
    likedBy: ["sarah.design", "alex.components", "natalie.tokens", "priya.systems", "leo.frontend"],
  },
  {
    id: 110,
    communitySlug: "react-builders",
    authorUsername: "alex.components",
    content:
      "A tiny pattern that helped today: keep modal state near the feature, but shared layout state in context.",
    image: null,
    createdAt: "10 hours ago",
    commentsCount: 0,
    likesCount: 1,
    likedBy: ["priya.systems"],
  },
  {
    id: 111,
    communitySlug: "full-stack-circle",
    authorUsername: "nasr.dev",
    content:
      "Mock data gets easier when it looks close to the backend response you expect later.",
    image: null,
    createdAt: "11 hours ago",
    commentsCount: 0,
    likesCount: 4,
    likedBy: ["lina.accessible", "ethan.react", "nasr.dev", "elena.designs"],
  },
  {
    id: 112,
    communitySlug: "ui-designers-hub",
    authorUsername: "sarah.design",
    content:
      "Design review note: empty states should explain what belongs there, not apologize for being empty.",
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766",
    createdAt: "13 hours ago",
    commentsCount: 0,
    likesCount: 0,
    likedBy: [],
  },
  {
    id: 113,
    communitySlug: "student-developers",
    authorUsername: "maya.creates",
    content:
      "If you are learning React, build the same feature twice: once messy, once cleaner. The second pass teaches a lot.",
    image: null,
    createdAt: "14 hours ago",
    commentsCount: 0,
    likesCount: 6,
    likedBy: ["omar.ui", "sophialee.dev", "karim.builds", "ava.product", "sarah.design", "alex.components"],
  },
  {
    id: 114,
    communitySlug: "tailwind-css-lab",
    authorUsername: "natalie.tokens",
    content:
      "Naming tokens by purpose instead of color lets dark mode become a swap, not a rewrite.",
    image: null,
    createdAt: "15 hours ago",
    commentsCount: 0,
    likesCount: 3,
    likedBy: ["ava.product", "sarah.design", "alex.components"],
  },
  {
    id: 115,
    communitySlug: "open-source-friends",
    authorUsername: "daniel.community",
    content:
      "A good first issue needs context, expected outcome, and a small enough surface to finish confidently.",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952",
    createdAt: "16 hours ago",
    commentsCount: 0,
    likesCount: 2,
    likedBy: ["natalie.tokens", "priya.systems"],
  },
  {
    id: 116,
    communitySlug: "portfolio-reviews",
    authorUsername: "ava.product",
    content:
      "Case studies are easier to scan when each section answers one question: problem, action, result.",
    image: null,
    createdAt: "18 hours ago",
    commentsCount: 0,
    likesCount: 5,
    likedBy: ["youssef.codes", "lina.accessible", "ethan.react", "nasr.dev", "elena.designs"],
  },
];

const communityPosts = communityPostRows.map((post) => {
  const comments = communityPostComments.filter((comment) => comment.postId === post.id);

  return {
    ...post,
    author: users.find((user) => user.username === post.authorUsername),
    comments,
    commentsCount: comments.length,
    likedBy: post.likedBy || [],
    likesCount: (post.likedBy || []).length,
  };
});

export default communityPosts;

