import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute() {
    const { userData } = useAuth();
    const location = useLocation();

    if (!userData) {
        return <Navigate to="/signin" replace state={{ from: location }} />;
    }

    return <Outlet />;
}
