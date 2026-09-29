import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocation } from "react-router-dom";

export default function ScrollToTopButton({ threshold = 300 }) {
    const [isVisible, setIsVisible] = useState(false);
    const { pathname } = useLocation();
    const isLandingPage = pathname === "/";

    useEffect(() => {
        function handleScroll() {
            setIsVisible(window.scrollY > threshold);
        }

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, [threshold]);

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (isLandingPage) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    type="button"
                    onClick={scrollToTop}
                    initial={{ opacity: 0, scale: 0.8, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 12 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    aria-label="Scroll to top"
                    className="fixed bottom-24 right-6 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-(--primary) text-(--on-primary) shadow-(--shadow-md) transition-transform duration-200 ease-out hover:scale-110 active:scale-95 lg:bottom-6"
                >
                    <ArrowUp size={20} />
                </motion.button>
            )}
        </AnimatePresence>
    );
}
