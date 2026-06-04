import { authContext } from '@/context/AuthContext'
import { useContext } from 'react'

export function useAuth() {
    const context = useContext(authContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}