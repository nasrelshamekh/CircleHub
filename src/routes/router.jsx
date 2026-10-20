import { Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

import ScrollToTop from "@/components/scrolltotop/ScrollToTop";
import ScrollToTopButton from "@/components/ui/ScrollToTopButton";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicOnlyRoute from "@/components/auth/PublicOnlyRoute";
import AuthLayout from "@/layouts/AuthLayout";
import AppLayout from "@/layouts/AppLayout";
import FocusLayout from "@/layouts/FocusLayout";
import {
  Communities,
  CommunitiesDetails,
  EditProfile,
  Explore,
  Feed,
  Followers,
  ForgotPassword,
  Landing,
  ManageCommunity,
  Messages,
  Notifications,
  NotFound,
  PostDetails,
  Profile,
  Register,
  ResetPassword,
  Signin,
  VerifyEmail,
} from "./lazyPages";

const router = createBrowserRouter([
  {
    element: (
      <>
        <ScrollToTop />
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
        <ScrollToTopButton />
      </>
    ),
    children: [
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
              { path: "forgot-password", element: <ForgotPassword /> },
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
              { path: "messages", element: <Messages /> },
              { path: "messages/:id", element: <Messages /> },
            ],
          },
        ],
      },
      {
        path: "verify-email",
        element: <VerifyEmail />,
      },
      {
        path: "reset-password",
        element: <ResetPassword />,
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
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
