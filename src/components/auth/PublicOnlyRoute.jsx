import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

export default function PublicOnlyRoute() {
    const { userData } = useAuth();

    if (userData) {
        return <Navigate to="/feed" replace />;
    }

    return <Outlet />;
}
