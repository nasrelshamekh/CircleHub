import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Wifi, WifiOff } from "lucide-react";

import { useChatConnection } from "@/hooks/useChatConnection";

function subscribeOnline(callback) {
    window.addEventListener("online", callback);
    window.addEventListener("offline", callback);
    return () => {
        window.removeEventListener("online", callback);
        window.removeEventListener("offline", callback);
    };
}

function getOnlineSnapshot() {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getServerSnapshot() {
    return true;
}

export default function OfflineBanner() {
    const isOnline = useSyncExternalStore(
        subscribeOnline,
        getOnlineSnapshot,
        getServerSnapshot
    );
    const { status } = useChatConnection();

    // Disconnected when browser has no network, or when SignalR dropped and is reconnecting/offline
    const isDisconnected =
        !isOnline || (status === "reconnecting" || status === "offline");

    const [prevDisconnected, setPrevDisconnected] = useState(isDisconnected);
    const [bannerState, setBannerState] = useState(() =>
        isDisconnected ? "offline" : null
    );

    // Adjust state during render (React 19 pattern) to avoid effect cascading renders
    if (prevDisconnected !== isDisconnected) {
        setPrevDisconnected(isDisconnected);
        if (isDisconnected) {
            setBannerState("offline");
        } else if (bannerState === "offline") {
            setBannerState("restored");
        }
    }

    // Auto-dismiss the "Back online" pill after a brief confirmation period
    useEffect(() => {
        if (bannerState === "restored") {
            const timer = setTimeout(() => {
                setBannerState(null);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [bannerState]);

    return (
        <AnimatePresence>
            {bannerState && (
                <motion.aside
                    key="offline-banner"
                    role="status"
                    aria-live="polite"
                    initial={{ opacity: 0, y: -24, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -24, scale: 0.95 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-60 pointer-events-none"
                >
                    <div
                        className={`flex items-center gap-2.5 rounded-full px-4 py-2 text-xs sm:text-sm font-medium shadow-lg backdrop-blur-md border transition-colors ${
                            bannerState === "restored"
                                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-emerald-500/5"
                                : "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-200 shadow-amber-500/5"
                        }`}
                    >
                        {bannerState === "restored" ? (
                            <>
                                <span className="relative flex h-2 w-2">
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <Wifi size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <span>Back online</span>
                            </>
                        ) : (
                            <>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                </span>
                                <WifiOff size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
                                <span>You&apos;re offline. Reconnecting...</span>
                            </>
                        )}
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}
