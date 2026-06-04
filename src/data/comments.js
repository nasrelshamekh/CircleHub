import users from "./users";

const commentRows = [
  {
    id: 1,
    postId: 1,
    authorUsername: "davidcodes",
    content:
      "The spacing looks really clean. The feed feels much easier to read now.",
    createdAt: "1 hour ago",
  },
  {
    id: 2,
    postId: 1,
    authorUsername: "maya.creates",
    content: "Nice work! The layout already feels like a real social app.",
    createdAt: "45 minutes ago",
  },
  {
    id: 3,
    postId: 1,
    authorUsername: "omar.ui",
    content: "The card spacing is solid. Maybe add a small hover effect later.",
    createdAt: "20 minutes ago",
  },
  {
    id: 4,
    postId: 2,
    authorUsername: "sarah.design",
    content:
      "Exactly. Reusable components save so much time when the project grows.",
    createdAt: "4 hours ago",
  },
  {
    id: 5,
    postId: 2,
    authorUsername: "elena.designs",
    content:
      "Component architecture is one of the biggest differences between small projects and scalable apps.",
    createdAt: "3 hours ago",
  },
  {
    id: 6,
    postId: 2,
    authorUsername: "karim.builds",
    content:
      "This is why separating layout components from feature components matters.",
    createdAt: "2 hours ago",
  },
  {
    id: 7,
    postId: 3,
    authorUsername: "alex.components",
    content:
      "Framer Motion makes small interactions feel premium when used carefully.",
    createdAt: "55 minutes ago",
  },
  {
    id: 8,
    postId: 3,
    authorUsername: "sophialee.dev",
    content:
      "Just don't overdo animations. Subtle transitions are usually enough.",
    createdAt: "40 minutes ago",
  },
  {
    id: 9,
    postId: 3,
    authorUsername: "ryan.beta",
    content: "Animations are great for modals, dropdowns, and page transitions.",
    createdAt: "18 minutes ago",
  },
  {
    id: 10,
    postId: 4,
    authorUsername: "natalie.tokens",
    content:
      "Community meetups are always inspiring. You leave with so many ideas.",
    createdAt: "2 hours ago",
  },
  {
    id: 11,
    postId: 4,
    authorUsername: "james.portfolio",
    content:
      "That sounds awesome. I love seeing what other developers are building.",
    createdAt: "1 hour ago",
  },
  {
    id: 12,
    postId: 4,
    authorUsername: "emily.motion",
    content: "This is exactly the kind of thing CircleHub should highlight.",
    createdAt: "35 minutes ago",
  },
  {
    id: 13,
    postId: 5,
    authorUsername: "michael.frontend",
    content:
      "Dark mode always makes apps feel more polished when the colors are done right.",
    createdAt: "6 hours ago",
  },
  {
    id: 14,
    postId: 5,
    authorUsername: "maya.creates",
    content:
      "The hardest part is making borders and surfaces visible without too much contrast.",
    createdAt: "5 hours ago",
  },
  {
    id: 15,
    postId: 6,
    authorUsername: "olivia.darkmode",
    content:
      "Spacing and typography can completely change how professional a portfolio feels.",
    createdAt: "7 hours ago",
  },
  {
    id: 16,
    postId: 6,
    authorUsername: "davidcodes",
    content: "React + Tailwind is a great combo for portfolio projects.",
    createdAt: "6 hours ago",
  },
  {
    id: 17,
    postId: 6,
    authorUsername: "elena.designs",
    content: "Focus on consistency. That matters more than fancy effects.",
    createdAt: "5 hours ago",
  },
  {
    id: 18,
    postId: 7,
    authorUsername: "ryan.beta",
    content:
      "Try checking Radix colors or Tailwind palettes. They're usually accessible and balanced.",
    createdAt: "10 hours ago",
  },
  {
    id: 19,
    postId: 7,
    authorUsername: "natalie.tokens",
    content:
      "Indigo, violet, slate, and cyan usually work well together for SaaS dashboards.",
    createdAt: "9 hours ago",
  },
  {
    id: 20,
    postId: 7,
    authorUsername: "karim.builds",
    content: "Make sure you test contrast in both light and dark modes.",
    createdAt: "8 hours ago",
  },
  {
    id: 21,
    postId: 8,
    authorUsername: "sarah.design",
    content: "Reusable components make updates so much easier later.",
    createdAt: "12 hours ago",
  },
  {
    id: 22,
    postId: 8,
    authorUsername: "emily.motion",
    content:
      "The best feeling is changing one component and seeing the whole app improve.",
    createdAt: "11 hours ago",
  },
  {
    id: 23,
    postId: 9,
    authorUsername: "sophia.palette",
    content:
      "Spacing tokens are underrated. They make the app feel consistent without thinking too much.",
    createdAt: "22 hours ago",
  },
  {
    id: 24,
    postId: 9,
    authorUsername: "alex.components",
    content: "Once spacing is consistent, the UI immediately feels calmer.",
    createdAt: "20 hours ago",
  },
  {
    id: 25,
    postId: 10,
    authorUsername: "daniel.community",
    content: "Congrats on the beta launch! That's a huge milestone.",
    createdAt: "23 hours ago",
  },
  {
    id: 26,
    postId: 10,
    authorUsername: "olivia.darkmode",
    content:
      "Student community platforms can be really powerful when the UX is simple.",
    createdAt: "21 hours ago",
  },
  {
    id: 27,
    postId: 10,
    authorUsername: "michael.frontend",
    content:
      "Nice! I'd love to see how you handle groups and discussions next.",
    createdAt: "18 hours ago",
  },
];

const comments = commentRows.map((comment) => ({
  ...comment,
  author: users.find((user) => user.username === comment.authorUsername),
}));

export default comments;
