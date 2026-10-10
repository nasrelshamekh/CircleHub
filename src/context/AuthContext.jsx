import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import logo from "@/assets/circlehub-logo.png";
import { authContext } from "@/hooks/useAuth";
import { getCurrentUser } from "@/services/authApi";

export default function AuthContextProvider({ children }) {
    // Ignore any stale cached profile when there is no session; the provider
    // should start in the signed-out state in that case.
    const [userData, setUserData] = useState(() => {
        if (!localStorage.getItem("token")) return null;

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

    // Whether a session existed on the previous render. The persistence effect
    // uses this to only clear the token on an actual sign-out — not on initial
    // mount, where a valid token with a missing profile cache should still get
    // a chance to be verified.
    const hadSessionRef = useRef(Boolean(userData));

    useEffect(() => {
        if (userData) {
            localStorage.setItem("user-data", JSON.stringify(userData));
        } else {
            localStorage.removeItem("user-data");

            if (hadSessionRef.current) {
                localStorage.removeItem("token");
            }
        }

        hadSessionRef.current = Boolean(userData);
    }, [userData]);

    useEffect(() => {
        // No token at mount: nothing to verify. isVerifying already starts
        // false in that case, so the provider falls straight through to the
        // signed-out UI without setting any state here.
        if (!localStorage.getItem("token")) return;

        let ignore = false;

        async function loadCurrentUser() {
            try {
                const { data } = await getCurrentUser();
                if (!ignore) setUserData(data);
            } catch (error) {
                if (ignore) return;
                if (error.response?.status === 401) {
                    localStorage.removeItem("token");
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
