import { useContext } from "react";

import { sidebarContext } from "@/context/SidebarContext";

export function useSidebar() {
    const context = useContext(sidebarContext);

    if (!context) {
        throw new Error("useSidebar must be used within a SidebarContextProvider");
    }

    return context;
}
