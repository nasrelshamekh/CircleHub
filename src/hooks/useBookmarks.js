import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const BOOKMARKS_EVENT = "circlehub:bookmarks-changed";

export function useBookmarks() {
    const { userData } = useAuth();
    const storageKey = userData?.id ? `circlehub_bookmarks_${userData.id}` : null;

    const getSaved = useCallback(() => {
        if (!storageKey) return [];
        try {
            const raw = localStorage.getItem(storageKey);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }, [storageKey]);

    const [bookmarks, setBookmarks] = useState(getSaved);
    const [prevStorageKey, setPrevStorageKey] = useState(storageKey);
    if (prevStorageKey !== storageKey) {
        setPrevStorageKey(storageKey);
        setBookmarks(getSaved());
    }

    useEffect(() => {
        function handleSync() {
            setBookmarks(getSaved());
        }
        window.addEventListener(BOOKMARKS_EVENT, handleSync);
        return () => window.removeEventListener(BOOKMARKS_EVENT, handleSync);
    }, [getSaved]);

    const isBookmarked = useCallback(
        (postId) => bookmarks.some((p) => p.id === postId),
        [bookmarks]
    );

    const toggleBookmark = useCallback(
        (post) => {
            if (!storageKey || !post) return false;
            const current = getSaved();
            const exists = current.some((p) => p.id === post.id);
            let updated;
            if (exists) {
                updated = current.filter((p) => p.id !== post.id);
            } else {
                updated = [post, ...current];
            }
            try {
                localStorage.setItem(storageKey, JSON.stringify(updated));
            } catch {
                // ignore
            }
            setBookmarks(updated);
            window.dispatchEvent(
                new CustomEvent(BOOKMARKS_EVENT, {
                    detail: { postId: post.id, isBookmarked: !exists },
                })
            );
            return !exists;
        },
        [storageKey, getSaved]
    );

    return {
        bookmarks,
        isBookmarked,
        toggleBookmark,
    };
}
