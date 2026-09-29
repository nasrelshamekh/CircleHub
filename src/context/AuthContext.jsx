import { useEffect, useState } from "react";
import { motion } from "motion/react";

import logo from "@/assets/circlehub-logo.png";
import { authContext } from "@/hooks/useAuth";
import { getCurrentUser } from "@/services/authApi";

export default function AuthContextProvider({ children }) {
    const [userData, setUserData] = useState(() => {
        try {
            const cached = localStorage.getItem("user-data");
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    });
    const [isVerifying, setIsVerifying] = useState(
        () => Boolean(localStorage.getItem("token"))
    );

    useEffect(() => {
        if (userData) {
            localStorage.setItem("user-data", JSON.stringify(userData));
        } else {
            localStorage.removeItem("user-data");
            localStorage.removeItem("token");
        }
    }, [userData]);

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            setUserData(null);
            setIsVerifying(false);
            return;
        }

        let ignore = false;

        async function loadCurrentUser() {
            try {
                const { data } = await getCurrentUser();
                if (!ignore) setUserData(data);
            } catch (error) {
                if (ignore) return;
                if (error.response?.status === 401) {
                    setUserData(null);
                }
            } finally {
                if (!ignore) setIsVerifying(false);
            }
        }

        loadCurrentUser();
        return () => {
            ignore = true;
        };
    }, []);

    if (isVerifying) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-(--surface-low)">
                <motion.img
                    src={logo}
                    alt="CircleHub"
                    className="w-48"
                    animate={{
                        opacity: [0.5, 1, 0.5],
                        scale: [0.98, 1.02, 0.98],
                    }}
                    transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>
        );
    }

    return (
        <authContext.Provider value={{ userData, setUserData}}>
            {children}
        </authContext.Provider>
    );
}
