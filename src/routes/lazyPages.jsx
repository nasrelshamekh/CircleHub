import { lazy } from "react";

export const Register = lazy(() => import("@/pages/Auth/Register/Register"));
export const Signin = lazy(() => import("@/pages/Auth/Signin/Signin"));
export const Communities = lazy(() =>
  import("@/pages/Communities/Communities")
);
export const CommunitiesDetails = lazy(() =>
  import("@/pages/CommunitiesDetails/CommunitiesDetails")
);
export const EditProfile = lazy(() =>
  import("@/pages/EditProfile/EditProfile")
);
export const Explore = lazy(() => import("@/pages/Explore/Explore"));
export const Feed = lazy(() => import("@/pages/Feed/Feed"));
export const Followers = lazy(() => import("@/pages/Followers/Followers"));
export const ForgotPassword = lazy(() =>
  import("@/pages/ForgotPassword/ForgotPassword")
);
export const Landing = lazy(() => import("@/pages/Landing/Landing"));
export const ManageCommunity = lazy(() =>
  import("@/pages/ManageCommunity/ManageCommunity")
);
export const Messages = lazy(() => import("@/pages/Messages/Messages"));
export const Notifications = lazy(() =>
  import("@/pages/Notifications/Notifications")
);
export const NotFound = lazy(() => import("@/pages/NotFound/NotFound"));
export const PostDetails = lazy(() =>
  import("@/pages/PostDetails/PostDetails")
);
export const Profile = lazy(() => import("@/pages/Profile/Profile"));
export const ResetPassword = lazy(() =>
  import("@/pages/ResetPassword/ResetPassword")
);
export const VerifyEmail = lazy(() =>
  import("@/pages/VerifyEmail/VerifyEmail")
);
