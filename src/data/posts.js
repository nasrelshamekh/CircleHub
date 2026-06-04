import comments from "./comments";
import users from "./users";

const postRows = [
  {
    id: 1,
    authorUsername: "nasr.dev",
    content:
      "Finished building the Profile page structure for CircleHub. It now has a cover image, profile header, stats, tabs, media, and posts section.",
    image: null,
    createdAt: "30 minutes ago",
    commentsCount: 6,
    likesCount: 42,
    likedBy: ["davidcodes", "maya.creates", "omar.ui"],
  },
  {
    id: 2,
    authorUsername: "nasr.dev",
    content:
      "Today I learned how to structure a React app using reusable layouts like AppLayout and FocusLayout.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    createdAt: "1 hour ago",
    commentsCount: 9,
    likesCount: 58,
    likedBy: ["elena.designs", "sophialee.dev", "karim.builds"],
  },
  {
    id: 3,
    authorUsername: "elena.designs",
    content:
      "Started refining a profile card layout today. Small spacing decisions make a big difference.",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
    createdAt: "2 hours ago",
    commentsCount: 5,
    likesCount: 34,
    likedBy: ["nasr.dev", "davidcodes", "maya.creates"],
  },
  {
    id: 4,
    authorUsername: "elena.designs",
    content:
      "Design systems feel much easier to maintain when every component has one clear job.",
    image: null,
    createdAt: "1 day ago",
    commentsCount: 3,
    likesCount: 27,
    likedBy: ["omar.ui", "sophialee.dev", "ava.product"],
  },
  {
    id: 5,
    authorUsername: "davidcodes",
    content:
      "Reusable components save so much time once the app starts growing past a few pages.",
    image: null,
    createdAt: "3 hours ago",
    commentsCount: 12,
    likesCount: 45,
    likedBy: ["nasr.dev", "elena.designs", "karim.builds"],
  },
  {
    id: 6,
    authorUsername: "davidcodes",
    content:
      "Testing a dashboard layout with tighter spacing and clearer visual hierarchy.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    createdAt: "2 days ago",
    commentsCount: 7,
    likesCount: 61,
    likedBy: ["maya.creates", "omar.ui", "sophialee.dev"],
  },
  {
    id: 7,
    authorUsername: "maya.creates",
    content:
      "Writing down frontend lessons helps me understand what I actually learned.",
    image: null,
    createdAt: "4 hours ago",
    commentsCount: 8,
    likesCount: 39,
    likedBy: ["nasr.dev", "elena.designs", "davidcodes"],
  },
  {
    id: 8,
    authorUsername: "maya.creates",
    content:
      "Shared a quick UI breakdown today about profile pages and social feeds.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    createdAt: "2 days ago",
    commentsCount: 10,
    likesCount: 67,
    likedBy: ["omar.ui", "sophialee.dev", "karim.builds"],
  },
  {
    id: 9,
    authorUsername: "omar.ui",
    content:
      "A good edit profile page should make the common actions obvious without feeling crowded.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
    createdAt: "5 hours ago",
    commentsCount: 6,
    likesCount: 31,
    likedBy: ["nasr.dev", "maya.creates", "elena.designs"],
  },
  {
    id: 10,
    authorUsername: "omar.ui",
    content:
      "Buttons, labels, and empty states are tiny details until they are missing.",
    image: null,
    createdAt: "3 days ago",
    commentsCount: 4,
    likesCount: 29,
    likedBy: ["davidcodes", "sophialee.dev", "ava.product"],
  },
  {
    id: 11,
    authorUsername: "sophialee.dev",
    content:
      "React state feels easier when each component owns only the state it really needs.",
    image: null,
    createdAt: "6 hours ago",
    commentsCount: 9,
    likesCount: 52,
    likedBy: ["nasr.dev", "davidcodes", "karim.builds"],
  },
  {
    id: 12,
    authorUsername: "sophialee.dev",
    content:
      "Experimenting with image previews and cleanup for file uploads.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    createdAt: "3 days ago",
    commentsCount: 11,
    likesCount: 74,
    likedBy: ["elena.designs", "maya.creates", "omar.ui"],
  },
  {
    id: 13,
    authorUsername: "karim.builds",
    content:
      "Working on a clean API structure before wiring it into the frontend.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    createdAt: "8 hours ago",
    commentsCount: 5,
    likesCount: 33,
    likedBy: ["nasr.dev", "sophialee.dev", "davidcodes"],
  },
  {
    id: 14,
    authorUsername: "karim.builds",
    content:
      "Full-stack projects get easier when the data shape is consistent from the start.",
    image: null,
    createdAt: "4 days ago",
    commentsCount: 7,
    likesCount: 48,
    likedBy: ["elena.designs", "omar.ui", "maya.creates"],
  },
  {
    id: 15,
    authorUsername: "sarah.design",
    content:
      "Just finished redesigning a feed layout. Really happy with the spacing and readability.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    createdAt: "9 hours ago",
    commentsCount: 8,
    likesCount: 34,
    likedBy: ["nasr.dev", "elena.designs", "davidcodes"],
  },
  {
    id: 16,
    authorUsername: "sarah.design",
    content:
      "Typography can make a simple screen feel much more intentional.",
    image: null,
    createdAt: "4 days ago",
    commentsCount: 5,
    likesCount: 36,
    likedBy: ["maya.creates", "sophialee.dev", "omar.ui"],
  },
  {
    id: 17,
    authorUsername: "michael.frontend",
    content:
      "Component architecture is boring until it saves you from rewriting the same thing five times.",
    image: null,
    createdAt: "10 hours ago",
    commentsCount: 12,
    likesCount: 45,
    likedBy: ["nasr.dev", "karim.builds", "davidcodes"],
  },
  {
    id: 18,
    authorUsername: "michael.frontend",
    content:
      "Rebuilding a card grid with better responsive behavior.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    createdAt: "5 days ago",
    commentsCount: 6,
    likesCount: 41,
    likedBy: ["elena.designs", "maya.creates", "omar.ui"],
  },
  {
    id: 19,
    authorUsername: "emily.motion",
    content:
      "Animations are best when they help the user understand what changed.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    createdAt: "11 hours ago",
    commentsCount: 15,
    likesCount: 67,
    likedBy: ["nasr.dev", "sophialee.dev", "davidcodes"],
  },
  {
    id: 20,
    authorUsername: "emily.motion",
    content:
      "A subtle modal transition can make the whole interaction feel calmer.",
    image: null,
    createdAt: "5 days ago",
    commentsCount: 4,
    likesCount: 28,
    likedBy: ["maya.creates", "nora.motion", "alex.components"],
  },
  {
    id: 21,
    authorUsername: "daniel.community",
    content:
      "Our community meetup this weekend was packed with great project demos.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
    createdAt: "12 hours ago",
    commentsCount: 21,
    likesCount: 89,
    likedBy: ["nasr.dev", "ryan.beta", "sarah.design"],
  },
  {
    id: 22,
    authorUsername: "daniel.community",
    content:
      "The best communities make it easy for beginners to ask simple questions.",
    image: null,
    createdAt: "6 days ago",
    commentsCount: 9,
    likesCount: 53,
    likedBy: ["elena.designs", "maya.creates", "omar.ui"],
  },
  {
    id: 23,
    authorUsername: "olivia.darkmode",
    content:
      "Dark mode is finally feeling balanced. Borders and surfaces were the hardest part.",
    image: null,
    createdAt: "13 hours ago",
    commentsCount: 5,
    likesCount: 28,
    likedBy: ["nasr.dev", "sophia.palette", "natalie.tokens"],
  },
  {
    id: 24,
    authorUsername: "olivia.darkmode",
    content:
      "Testing light and dark theme contrast side by side.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    createdAt: "6 days ago",
    commentsCount: 7,
    likesCount: 44,
    likedBy: ["davidcodes", "emily.motion", "alex.components"],
  },
  {
    id: 25,
    authorUsername: "james.portfolio",
    content:
      "Currently rebuilding my portfolio with a stronger focus on case studies.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    createdAt: "14 hours ago",
    commentsCount: 18,
    likesCount: 73,
    likedBy: ["nasr.dev", "sarah.design", "michael.frontend"],
  },
  {
    id: 26,
    authorUsername: "james.portfolio",
    content:
      "Portfolio pages need less decoration and more clear proof of work.",
    image: null,
    createdAt: "1 week ago",
    commentsCount: 6,
    likesCount: 39,
    likedBy: ["elena.designs", "davidcodes", "maya.creates"],
  },
  {
    id: 27,
    authorUsername: "sophia.palette",
    content:
      "Does anyone have good recommendations for accessible SaaS dashboard palettes?",
    image: null,
    createdAt: "15 hours ago",
    commentsCount: 26,
    likesCount: 41,
    likedBy: ["nasr.dev", "olivia.darkmode", "natalie.tokens"],
  },
  {
    id: 28,
    authorUsername: "sophia.palette",
    content:
      "Trying a restrained palette with one accent color and stronger neutral contrast.",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
    createdAt: "1 week ago",
    commentsCount: 8,
    likesCount: 46,
    likedBy: ["elena.designs", "omar.ui", "sarah.design"],
  },
  {
    id: 29,
    authorUsername: "alex.components",
    content:
      "Reusable component architecture makes large React projects feel manageable.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    createdAt: "16 hours ago",
    commentsCount: 9,
    likesCount: 58,
    likedBy: ["nasr.dev", "davidcodes", "sophialee.dev"],
  },
  {
    id: 30,
    authorUsername: "alex.components",
    content:
      "The best abstraction is usually the one that removes repeated decisions.",
    image: null,
    createdAt: "1 week ago",
    commentsCount: 5,
    likesCount: 35,
    likedBy: ["maya.creates", "karim.builds", "michael.frontend"],
  },
  {
    id: 31,
    authorUsername: "natalie.tokens",
    content:
      "Spent the afternoon refining spacing tokens. It changed the whole feel of the interface.",
    image: null,
    createdAt: "17 hours ago",
    commentsCount: 7,
    likesCount: 36,
    likedBy: ["nasr.dev", "sophia.palette", "olivia.darkmode"],
  },
  {
    id: 32,
    authorUsername: "natalie.tokens",
    content:
      "Documenting token decisions makes future UI work much less mysterious.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    createdAt: "8 days ago",
    commentsCount: 4,
    likesCount: 31,
    likedBy: ["elena.designs", "alex.components", "priya.systems"],
  },
  {
    id: 33,
    authorUsername: "ryan.beta",
    content:
      "Just deployed the first beta version of our student community platform.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    createdAt: "18 hours ago",
    commentsCount: 32,
    likesCount: 120,
    likedBy: ["nasr.dev", "daniel.community", "ava.product"],
  },
  {
    id: 34,
    authorUsername: "ryan.beta",
    content:
      "Beta feedback is messy, but it shows you what users actually notice.",
    image: null,
    createdAt: "8 days ago",
    commentsCount: 11,
    likesCount: 65,
    likedBy: ["davidcodes", "michael.frontend", "karim.builds"],
  },
  {
    id: 35,
    authorUsername: "ava.product",
    content:
      "Good product work starts with deciding what not to build yet.",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
    createdAt: "19 hours ago",
    commentsCount: 10,
    likesCount: 77,
    likedBy: ["nasr.dev", "ryan.beta", "priya.systems"],
  },
  {
    id: 36,
    authorUsername: "ava.product",
    content:
      "A focused roadmap is kinder to users and much kinder to the team.",
    image: null,
    createdAt: "9 days ago",
    commentsCount: 6,
    likesCount: 49,
    likedBy: ["elena.designs", "davidcodes", "sarah.design"],
  },
  {
    id: 37,
    authorUsername: "youssef.codes",
    content:
      "Backend work is mostly making sure the simple path stays reliable.",
    image: null,
    createdAt: "20 hours ago",
    commentsCount: 4,
    likesCount: 24,
    likedBy: ["nasr.dev", "karim.builds", "marcus.cloud"],
  },
  {
    id: 38,
    authorUsername: "youssef.codes",
    content:
      "Sketching API contracts before coding saved me a lot of rework today.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    createdAt: "9 days ago",
    commentsCount: 3,
    likesCount: 30,
    likedBy: ["davidcodes", "michael.frontend", "ethan.react"],
  },
  {
    id: 39,
    authorUsername: "nora.motion",
    content:
      "Motion should explain the interface, not distract from it.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    createdAt: "21 hours ago",
    commentsCount: 8,
    likesCount: 57,
    likedBy: ["nasr.dev", "emily.motion", "olivia.darkmode"],
  },
  {
    id: 40,
    authorUsername: "nora.motion",
    content:
      "A tiny hover transition can make a card feel more responsive.",
    image: null,
    createdAt: "10 days ago",
    commentsCount: 5,
    likesCount: 38,
    likedBy: ["maya.creates", "alex.components", "sophia.palette"],
  },
  {
    id: 41,
    authorUsername: "leo.frontend",
    content:
      "JavaScript debugging gets easier when you slow down and inspect the data shape first.",
    image: null,
    createdAt: "22 hours ago",
    commentsCount: 6,
    likesCount: 43,
    likedBy: ["nasr.dev", "davidcodes", "sophialee.dev"],
  },
  {
    id: 42,
    authorUsername: "leo.frontend",
    content:
      "Built a cleaner responsive navbar and finally fixed the avatar squeeze.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    createdAt: "10 days ago",
    commentsCount: 7,
    likesCount: 52,
    likedBy: ["elena.designs", "omar.ui", "michael.frontend"],
  },
  {
    id: 43,
    authorUsername: "priya.systems",
    content:
      "A design system is a product for the people building the product.",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
    createdAt: "23 hours ago",
    commentsCount: 13,
    likesCount: 91,
    likedBy: ["nasr.dev", "natalie.tokens", "elena.designs"],
  },
  {
    id: 44,
    authorUsername: "priya.systems",
    content:
      "Naming tokens well saves more time than people expect.",
    image: null,
    createdAt: "11 days ago",
    commentsCount: 6,
    likesCount: 58,
    likedBy: ["sophia.palette", "alex.components", "olivia.darkmode"],
  },
  {
    id: 45,
    authorUsername: "marcus.cloud",
    content:
      "Deployment pipelines should feel boring in the best possible way.",
    image: null,
    createdAt: "1 day ago",
    commentsCount: 5,
    likesCount: 40,
    likedBy: ["nasr.dev", "youssef.codes", "karim.builds"],
  },
  {
    id: 46,
    authorUsername: "marcus.cloud",
    content:
      "Added better logs to a flaky service and immediately found the real issue.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    createdAt: "11 days ago",
    commentsCount: 4,
    likesCount: 37,
    likedBy: ["davidcodes", "michael.frontend", "ethan.react"],
  },
  {
    id: 47,
    authorUsername: "lina.accessible",
    content:
      "Accessibility improvements often make the interface better for everyone.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
    createdAt: "1 day ago",
    commentsCount: 9,
    likesCount: 62,
    likedBy: ["nasr.dev", "priya.systems", "sophia.palette"],
  },
  {
    id: 48,
    authorUsername: "lina.accessible",
    content:
      "Labels, focus states, and keyboard navigation are not optional polish.",
    image: null,
    createdAt: "12 days ago",
    commentsCount: 7,
    likesCount: 54,
    likedBy: ["elena.designs", "omar.ui", "natalie.tokens"],
  },
  {
    id: 49,
    authorUsername: "ethan.react",
    content:
      "Mobile UI work reminds you very quickly when a layout is too fragile.",
    image: null,
    createdAt: "1 day ago",
    commentsCount: 8,
    likesCount: 59,
    likedBy: ["nasr.dev", "leo.frontend", "sophialee.dev"],
  },
  {
    id: 50,
    authorUsername: "ethan.react",
    content:
      "React Native components need the same discipline as web components.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    createdAt: "12 days ago",
    commentsCount: 6,
    likesCount: 47,
    likedBy: ["davidcodes", "alex.components", "michael.frontend"],
  },
];

const posts = postRows.map((post) => {
  const postComments = comments.filter((comment) => comment.postId === post.id);

  return {
    ...post,
    author: users.find((user) => user.username === post.authorUsername),
    comments: postComments,
    commentsCount: postComments.length,
  };
});

export default posts;
