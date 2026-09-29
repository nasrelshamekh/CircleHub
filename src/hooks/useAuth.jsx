import { createContext, useContext } from 'react'

export const authContext = createContext(null);

export function useAuth() {
    const context = useContext(authContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
