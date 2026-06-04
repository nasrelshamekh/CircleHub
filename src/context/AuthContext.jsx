/* eslint-disable react-refresh/only-export-components */
import currentUser from "@/data/currentUser"
import { createContext, useEffect, useState } from 'react'

export const authContext = createContext(null)

export default function AuthContextProvider({ children }) {

    const [userData, setUserData] = useState(() => {
        const savedUserData = localStorage.getItem("user-data");

        if (savedUserData) {
            try {
                return JSON.parse(savedUserData);
            } catch {
                return currentUser;
            }
        }

        return currentUser;
    });

    useEffect(() => {
        localStorage.setItem("user-data", JSON.stringify(userData));
    }, [userData]);

    return (
        <authContext.Provider value={{ userData, setUserData }}>
            {children}
        </authContext.Provider>
    )
}
