import { Activity, Bell, Compass, Network, Users } from "lucide-react";

export const features = [
  {
    title: "Build your community",
    description:
      "Follow people, discover shared connections, and keep your profile useful.",
    icon: Users,
  },
  {
    title: "Join focused communities",
    description:
      "Find spaces around design, development, products, and creative work.",
    icon: Network,
  },
  {
    title: "Explore without friction",
    description:
      "Search posts, people, and communities from one clean discovery view.",
    icon: Compass,
  },
];

export const floatingCards = [
  {
    label: "3 new notifications",
    detail: "Replies, follows, and community updates",
    icon: Bell,
    className: "right-2 top-22 hidden xl:flex",
    delay: 0.2,
  },
  {
    label: "React Builders",
    detail: "12 posts active today",
    icon: Network,
    className: "right-60 bottom-28 hidden lg:flex",
    delay: 0.45,
  },
  {
    label: "Maya follows you",
    detail: "Shared connection in Frontend Community",
    icon: Users,
    className: "right-18 top-53 hidden xl:flex",
    delay: 0.7,
  },
];

export const stats = [
  { value: "25+", label: "members in your mock network", icon: Users },
  { value: "8", label: "community spaces to explore", icon: Network },
  { value: "Live", label: "feed actions and updates", icon: Activity },
];
