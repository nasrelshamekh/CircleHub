/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";

import initialCommunities from "@/data/communities";

export const CommunitiesContext = createContext(null);

export default function CommunitiesContextProvider({ children }) {
    const [communities, setCommunities] = useState(() => {
        const savedCommunities = localStorage.getItem("communities-data");

        if (!savedCommunities) {
            return initialCommunities;
        }

        try {
            return JSON.parse(savedCommunities);
        } catch {
            return initialCommunities;
        }
    });

    useEffect(() => {
        localStorage.setItem("communities-data", JSON.stringify(communities));
    }, [communities]);

    return (
        <CommunitiesContext.Provider
            value={{
                communities,
                setCommunities,
            }}
        >
            {children}
        </CommunitiesContext.Provider>
    );
}
