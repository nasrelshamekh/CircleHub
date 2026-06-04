/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from "react";

export const sidebarContext = createContext(null);

export default function SidebarContextProvider({ children }) {
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

    function toggleSidebar() {
        setIsSidebarExpanded((current) => !current);
    }

    return (
        <sidebarContext.Provider
            value={{
                isSidebarExpanded,
                setIsSidebarExpanded,
                toggleSidebar,
            }}
        >
            {children}
        </sidebarContext.Provider>
    );
}
