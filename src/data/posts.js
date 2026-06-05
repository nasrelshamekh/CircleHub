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
    likesCount: 0,
    likedBy: [],
  },
  {
    id: 2,
    authorUsername: "nasr.dev",
    content:
      "Today I learned how to structure a React app using reusable layouts like AppLayout and FocusLayout.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    createdAt: "1 hour ago",
    commentsCount: 9,
    likesCount: 1,
    likedBy: ["maya.creates"],
  },
  {
    id: 3,
    authorUsername: "elena.designs",
    content:
      "Started refining a profile card layout today. Small spacing decisions make a big difference.",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
    createdAt: "2 hours ago",
    commentsCount: 5,
    likesCount: 2,
    likedBy: ["karim.builds", "ava.product"],
  },
  {
    id: 4,
    authorUsername: "elena.designs",
    content:
      "Design systems feel much easier to maintain when every component has one clear job.",
    image: null,
    createdAt: "1 day ago",
    commentsCount: 3,
    likesCount: 3,
    likedBy: ["alex.components", "natalie.tokens", "priya.systems"],
  },
  {
    id: 5,
    authorUsername: "davidcodes",
    content:
      "Reusable components save so much time once the app starts growing past a few pages.",
    image: null,
    createdAt: "3 hours ago",
    commentsCount: 12,
    likesCount: 4,
    likedBy: ["leo.frontend", "youssef.codes", "lina.accessible", "ethan.react"],
  },
  {
    id: 6,
    authorUsername: "davidcodes",
    content:
      "Testing a dashboard layout with tighter spacing and clearer visual hierarchy.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    createdAt: "2 days ago",
    commentsCount: 7,
    likesCount: 5,
    likedBy: ["ethan.react", "nasr.dev", "elena.designs", "davidcodes", "maya.creates"],
  },
  {
    id: 7,
    authorUsername: "maya.creates",
    content:
      "Writing down frontend lessons helps me understand what I actually learned.",
    image: null,
    createdAt: "4 hours ago",
    commentsCount: 8,
    likesCount: 6,
    likedBy: ["davidcodes", "maya.creates", "omar.ui", "sophialee.dev", "karim.builds", "ava.product"],
  },
  {
    id: 8,
    authorUsername: "maya.creates",
    content:
      "Shared a quick UI breakdown today about profile pages and social feeds.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    createdAt: "2 days ago",
    commentsCount: 10,
    likesCount: 2,
    likedBy: ["sophialee.dev", "karim.builds"],
  },
  {
    id: 9,
    authorUsername: "omar.ui",
    content:
      "A good edit profile page should make the common actions obvious without feeling crowded.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
    createdAt: "5 hours ago",
    commentsCount: 6,
    likesCount: 5,
    likedBy: ["sarah.design", "alex.components", "natalie.tokens", "priya.systems", "leo.frontend"],
  },
  {
    id: 10,
    authorUsername: "omar.ui",
    content:
      "Buttons, labels, and empty states are tiny details until they are missing.",
    image: null,
    createdAt: "3 days ago",
    commentsCount: 4,
    likesCount: 1,
    likedBy: ["priya.systems"],
  },
  {
    id: 11,
    authorUsername: "sophialee.dev",
    content:
      "React state feels easier when each component owns only the state it really needs.",
    image: null,
    createdAt: "6 hours ago",
    commentsCount: 9,
    likesCount: 4,
    likedBy: ["lina.accessible", "ethan.react", "nasr.dev", "elena.designs"],
  },
  {
    id: 12,
    authorUsername: "sophialee.dev",
    content:
      "Experimenting with image previews and cleanup for file uploads.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    createdAt: "3 days ago",
    commentsCount: 11,
    likesCount: 0,
    likedBy: [],
  },
  {
    id: 13,
    authorUsername: "karim.builds",
    content:
      "Working on a clean API structure before wiring it into the frontend.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    createdAt: "8 hours ago",
    commentsCount: 5,
    likesCount: 6,
    likedBy: ["omar.ui", "sophialee.dev", "karim.builds", "ava.product", "sarah.design", "alex.components"],
  },
  {
    id: 14,
    authorUsername: "karim.builds",
    content:
      "Full-stack projects get easier when the data shape is consistent from the start.",
    image: null,
    createdAt: "4 days ago",
    commentsCount: 7,
    likesCount: 3,
    likedBy: ["ava.product", "sarah.design", "alex.components"],
  },
  {
    id: 15,
    authorUsername: "sarah.design",
    content:
      "Just finished redesigning a feed layout. Really happy with the spacing and readability.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    createdAt: "9 hours ago",
    commentsCount: 8,
    likesCount: 2,
    likedBy: ["natalie.tokens", "priya.systems"],
  },
  {
    id: 16,
    authorUsername: "sarah.design",
    content:
      "Typography can make a simple screen feel much more intentional.",
    image: null,
    createdAt: "4 days ago",
    commentsCount: 5,
    likesCount: 5,
    likedBy: ["youssef.codes", "lina.accessible", "ethan.react", "nasr.dev", "elena.designs"],
  },
  {
    id: 17,
    authorUsername: "michael.frontend",
    content:
      "Component architecture is boring until it saves you from rewriting the same thing five times.",
    image: null,
    createdAt: "10 hours ago",
    commentsCount: 12,
    likesCount: 0,
    likedBy: [],
  },
  {
    id: 18,
    authorUsername: "michael.frontend",
    content:
      "Rebuilding a card grid with better responsive behavior.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    createdAt: "5 days ago",
    commentsCount: 6,
    likesCount: 1,
    likedBy: ["maya.creates"],
  },
  {
    id: 19,
    authorUsername: "emily.motion",
    content:
      "Animations are best when they help the user understand what changed.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    createdAt: "11 hours ago",
    commentsCount: 15,
    likesCount: 2,
    likedBy: ["karim.builds", "ava.product"],
  },
  {
    id: 20,
    authorUsername: "emily.motion",
    content:
      "A subtle modal transition can make the whole interaction feel calmer.",
    image: null,
    createdAt: "5 days ago",
    commentsCount: 4,
    likesCount: 3,
    likedBy: ["alex.components", "natalie.tokens", "priya.systems"],
  },
  {
    id: 21,
    authorUsername: "daniel.community",
    content:
      "Our community meetup this weekend was packed with great project demos.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
    createdAt: "12 hours ago",
    commentsCount: 21,
    likesCount: 4,
    likedBy: ["leo.frontend", "youssef.codes", "lina.accessible", "ethan.react"],
  },
  {
    id: 22,
    authorUsername: "daniel.community",
    content:
      "The best communities make it easy for beginners to ask simple questions.",
    image: null,
    createdAt: "6 days ago",
    commentsCount: 9,
    likesCount: 5,
    likedBy: ["ethan.react", "nasr.dev", "elena.designs", "davidcodes", "maya.creates"],
  },
  {
    id: 23,
    authorUsername: "olivia.darkmode",
    content:
      "Dark mode is finally feeling balanced. Borders and surfaces were the hardest part.",
    image: null,
    createdAt: "13 hours ago",
    commentsCount: 5,
    likesCount: 6,
    likedBy: ["davidcodes", "maya.creates", "omar.ui", "sophialee.dev", "karim.builds", "ava.product"],
  },
  {
    id: 24,
    authorUsername: "olivia.darkmode",
    content:
      "Testing light and dark theme contrast side by side.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    createdAt: "6 days ago",
    commentsCount: 7,
    likesCount: 2,
    likedBy: ["sophialee.dev", "karim.builds"],
  },
  {
    id: 25,
    authorUsername: "james.portfolio",
    content:
      "Currently rebuilding my portfolio with a stronger focus on case studies.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    createdAt: "14 hours ago",
    commentsCount: 18,
    likesCount: 5,
    likedBy: ["sarah.design", "alex.components", "natalie.tokens", "priya.systems", "leo.frontend"],
  },
  {
    id: 26,
    authorUsername: "james.portfolio",
    content:
      "Portfolio pages need less decoration and more clear proof of work.",
    image: null,
    createdAt: "1 week ago",
    commentsCount: 6,
    likesCount: 1,
    likedBy: ["priya.systems"],
  },
  {
    id: 27,
    authorUsername: "sophia.palette",
    content:
      "Does anyone have good recommendations for accessible SaaS dashboard palettes?",
    image: null,
    createdAt: "15 hours ago",
    commentsCount: 26,
    likesCount: 4,
    likedBy: ["lina.accessible", "ethan.react", "nasr.dev", "elena.designs"],
  },
  {
    id: 28,
    authorUsername: "sophia.palette",
    content:
      "Trying a restrained palette with one accent color and stronger neutral contrast.",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
    createdAt: "1 week ago",
    commentsCount: 8,
    likesCount: 0,
    likedBy: [],
  },
  {
    id: 29,
    authorUsername: "alex.components",
    content:
      "Reusable component architecture makes large React projects feel manageable.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    createdAt: "16 hours ago",
    commentsCount: 9,
    likesCount: 6,
    likedBy: ["omar.ui", "sophialee.dev", "karim.builds", "ava.product", "sarah.design", "alex.components"],
  },
  {
    id: 30,
    authorUsername: "alex.components",
    content:
      "The best abstraction is usually the one that removes repeated decisions.",
    image: null,
    createdAt: "1 week ago",
    commentsCount: 5,
    likesCount: 3,
    likedBy: ["ava.product", "sarah.design", "alex.components"],
  },
  {
    id: 31,
    authorUsername: "natalie.tokens",
    content:
      "Spent the afternoon refining spacing tokens. It changed the whole feel of the interface.",
    image: null,
    createdAt: "17 hours ago",
    commentsCount: 7,
    likesCount: 2,
    likedBy: ["natalie.tokens", "priya.systems"],
  },
  {
    id: 32,
    authorUsername: "natalie.tokens",
    content:
      "Documenting token decisions makes future UI work much less mysterious.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    createdAt: "8 days ago",
    commentsCount: 4,
    likesCount: 5,
    likedBy: ["youssef.codes", "lina.accessible", "ethan.react", "nasr.dev", "elena.designs"],
  },
  {
    id: 33,
    authorUsername: "ryan.beta",
    content:
      "Just deployed the first beta version of our student community platform.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    createdAt: "18 hours ago",
    commentsCount: 32,
    likesCount: 0,
    likedBy: [],
  },
  {
    id: 34,
    authorUsername: "ryan.beta",
    content:
      "Beta feedback is messy, but it shows you what users actually notice.",
    image: null,
    createdAt: "8 days ago",
    commentsCount: 11,
    likesCount: 1,
    likedBy: ["maya.creates"],
  },
  {
    id: 35,
    authorUsername: "ava.product",
    content:
      "Good product work starts with deciding what not to build yet.",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
    createdAt: "19 hours ago",
    commentsCount: 10,
    likesCount: 2,
    likedBy: ["karim.builds", "ava.product"],
  },
  {
    id: 36,
    authorUsername: "ava.product",
    content:
      "A focused roadmap is kinder to users and much kinder to the team.",
    image: null,
    createdAt: "9 days ago",
    commentsCount: 6,
    likesCount: 3,
    likedBy: ["alex.components", "natalie.tokens", "priya.systems"],
  },
  {
    id: 37,
    authorUsername: "youssef.codes",
    content:
      "Backend work is mostly making sure the simple path stays reliable.",
    image: null,
    createdAt: "20 hours ago",
    commentsCount: 4,
    likesCount: 4,
    likedBy: ["leo.frontend", "youssef.codes", "lina.accessible", "ethan.react"],
  },
  {
    id: 38,
    authorUsername: "youssef.codes",
    content:
      "Sketching API contracts before coding saved me a lot of rework today.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    createdAt: "9 days ago",
    commentsCount: 3,
    likesCount: 5,
    likedBy: ["ethan.react", "nasr.dev", "elena.designs", "davidcodes", "maya.creates"],
  },
  {
    id: 39,
    authorUsername: "nora.motion",
    content:
      "Motion should explain the interface, not distract from it.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    createdAt: "21 hours ago",
    commentsCount: 8,
    likesCount: 6,
    likedBy: ["davidcodes", "maya.creates", "omar.ui", "sophialee.dev", "karim.builds", "ava.product"],
  },
  {
    id: 40,
    authorUsername: "nora.motion",
    content:
      "A tiny hover transition can make a card feel more responsive.",
    image: null,
    createdAt: "10 days ago",
    commentsCount: 5,
    likesCount: 2,
    likedBy: ["sophialee.dev", "karim.builds"],
  },
  {
    id: 41,
    authorUsername: "leo.frontend",
    content:
      "JavaScript debugging gets easier when you slow down and inspect the data shape first.",
    image: null,
    createdAt: "22 hours ago",
    commentsCount: 6,
    likesCount: 5,
    likedBy: ["sarah.design", "alex.components", "natalie.tokens", "priya.systems", "leo.frontend"],
  },
  {
    id: 42,
    authorUsername: "leo.frontend",
    content:
      "Built a cleaner responsive navbar and finally fixed the avatar squeeze.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    createdAt: "10 days ago",
    commentsCount: 7,
    likesCount: 1,
    likedBy: ["priya.systems"],
  },
  {
    id: 43,
    authorUsername: "priya.systems",
    content:
      "A design system is a product for the people building the product.",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
    createdAt: "23 hours ago",
    commentsCount: 13,
    likesCount: 4,
    likedBy: ["lina.accessible", "ethan.react", "nasr.dev", "elena.designs"],
  },
  {
    id: 44,
    authorUsername: "priya.systems",
    content:
      "Naming tokens well saves more time than people expect.",
    image: null,
    createdAt: "11 days ago",
    commentsCount: 6,
    likesCount: 0,
    likedBy: [],
  },
  {
    id: 45,
    authorUsername: "marcus.cloud",
    content:
      "Deployment pipelines should feel boring in the best possible way.",
    image: null,
    createdAt: "1 day ago",
    commentsCount: 5,
    likesCount: 6,
    likedBy: ["omar.ui", "sophialee.dev", "karim.builds", "ava.product", "sarah.design", "alex.components"],
  },
  {
    id: 46,
    authorUsername: "marcus.cloud",
    content:
      "Added better logs to a flaky service and immediately found the real issue.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    createdAt: "11 days ago",
    commentsCount: 4,
    likesCount: 3,
    likedBy: ["ava.product", "sarah.design", "alex.components"],
  },
  {
    id: 47,
    authorUsername: "lina.accessible",
    content:
      "Accessibility improvements often make the interface better for everyone.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
    createdAt: "1 day ago",
    commentsCount: 9,
    likesCount: 2,
    likedBy: ["natalie.tokens", "priya.systems"],
  },
  {
    id: 48,
    authorUsername: "lina.accessible",
    content:
      "Labels, focus states, and keyboard navigation are not optional polish.",
    image: null,
    createdAt: "12 days ago",
    commentsCount: 7,
    likesCount: 5,
    likedBy: ["youssef.codes", "lina.accessible", "ethan.react", "nasr.dev", "elena.designs"],
  },
  {
    id: 49,
    authorUsername: "ethan.react",
    content:
      "Mobile UI work reminds you very quickly when a layout is too fragile.",
    image: null,
    createdAt: "1 day ago",
    commentsCount: 8,
    likesCount: 0,
    likedBy: [],
  },
  {
    id: 50,
    authorUsername: "ethan.react",
    content:
      "React Native components need the same discipline as web components.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    createdAt: "12 days ago",
    commentsCount: 6,
    likesCount: 1,
    likedBy: ["maya.creates"],
  },
];

const posts = postRows.map((post) => {
  const postComments = comments.filter((comment) => comment.postId === post.id);

  return {
    ...post,
    author: users.find((user) => user.username === post.authorUsername),
    comments: postComments,
    commentsCount: postComments.length,
    likedBy: post.likedBy || [],
    likesCount: (post.likedBy || []).length,
  };
});

export default posts;

