import { createBrowserRouter, Navigate } from "react-router-dom";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicOnlyRoute from "@/components/auth/PublicOnlyRoute";
import AuthLayout from "@/layouts/AuthLayout";
import AppLayout from "@/layouts/AppLayout";
import FocusLayout from "@/layouts/FocusLayout";
import Register from "@/pages/Auth/Register/Register";
import Signin from "@/pages/Auth/Signin/Signin";
import Communities from "@/pages/Communities/Communities";
import CommunitiesDetails from "@/pages/CommunitiesDetails/CommunitiesDetails";
import EditProfile from "@/pages/EditProfile/EditProfile";
import Explore from "@/pages/Explore/Explore";
import Feed from "@/pages/Feed/Feed";
import Followers from "@/pages/Followers/Followers";
import Landing from "@/pages/Landing/Landing";
import ManageCommunity from "@/pages/ManageCommunity/ManageCommunity";
import Notifications from "@/pages/Notifications/Notifications";
import PostDetails from "@/pages/PostDetails/PostDetails";
import Profile from "@/pages/Profile/Profile";

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicOnlyRoute />,
    children: [
      { index: true, element: <Landing /> },
      {
        element: <AuthLayout />,
        children: [
          { path: "register", element: <Register /> },
          { path: "signin", element: <Signin /> },
        ],
      },
    ],
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/feed" replace /> },
          { path: "feed", element: <Feed /> },
        ],
      },
    ],
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <FocusLayout />,
        children: [
          { path: "post/:id", element: <PostDetails /> },
          { path: "profile/:username", element: <Profile /> },
          { path: "explore", element: <Explore /> },
          { path: "settings/profile", element: <EditProfile /> },
          { path: "followers/:username", element: <Followers /> },
          { path: "notifications", element: <Notifications /> },
          { path: "communities", element: <Communities /> },
          { path: "communities/:slug", element: <CommunitiesDetails /> },
          { path: "communities/:slug/manage", element: <ManageCommunity /> },
        ],
      },
    ],
  },
]);

export default router;
