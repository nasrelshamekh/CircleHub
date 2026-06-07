import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicOnlyRoute from './components/auth/PublicOnlyRoute';
import PostDetails from './pages/PostDetails/PostDetails'
import Feed from './pages/Feed/Feed'
import FocusLayout from './layouts/FocusLayout';
import Profile from './pages/Profile/Profile';
import Explore from './pages/Explore/Explore';
import EditProfile from './pages/EditProfile/EditProfile';
import Followers from './pages/Followers/Followers';
import Communities from './pages/Communities/Communities';
import CommunitiesDetails from './pages/CommunitiesDetails/CommunitiesDetails';
import ManageCommunity from './pages/ManageCommunity/ManageCommunity';
import Notifications from './pages/Notifications/Notifications';
import AuthLayout from './layouts/AuthLayout';
import Register from './pages/Auth/Register/Register';
import Signin from './pages/Auth/Signin/Signin';

function App() {

  const router = createBrowserRouter([
    {
      path: "/",
      element: <PublicOnlyRoute />,
      children: [
        {
          element: <AuthLayout />,
          children: [
            { index: true, element: <Navigate to="/signin" replace /> },
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
            { path: "communities/:slug/manage", element: <ManageCommunity /> }
          ],
        },
      ],
    },
  ]);

  return (
    <>
      
        <RouterProvider router={router} />
      
      
    </>
  )
}

export default App
