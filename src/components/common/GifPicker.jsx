import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import {
    GIF_CATEGORIES,
    fetchTrendingGifs,
    searchGifs,
} from "@/services/gifService";

export default function GifPicker({ onSelect, onClose, align = "left", className = "" }) {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("trending");
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(true);
    const pickerRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    // Initial load & category changes
    useEffect(() => {
        let isCurrent = true;

        const category = GIF_CATEGORIES.find((c) => c.id === activeCategory);
        const query = category?.query || "";

        const load = query ? searchGifs(query) : fetchTrendingGifs();
        load.then((items) => {
            if (isCurrent) {
                setGifs(items);
                setLoading(false);
            }
        }).catch(() => {
            if (isCurrent) setLoading(false);
        });

        return () => {
            isCurrent = false;
        };
    }, [activeCategory]);

    // Handle search input with debounce
    function handleSearchChange(e) {
        const val = e.target.value;
        setSearch(val);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            setLoading(true);
            const load = val.trim() ? searchGifs(val) : fetchTrendingGifs();
            load.then((items) => {
                setGifs(items);
                setLoading(false);
            }).catch(() => {
                setLoading(false);
            });
        }, 350);
    }

    // Dismiss on click outside or Escape
    useEffect(() => {
        function handleClickOutside(event) {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                onClose?.();
            }
        }

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                onClose?.();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [onClose]);

    return (
        <div
            ref={pickerRef}
            className={`absolute bottom-full mb-2 z-50 flex h-96 w-84 sm:w-96 flex-col rounded-2xl border border-(--border)/40 bg-(--surface-lowest) shadow-2xl backdrop-blur-md overflow-hidden ${
                align === "right" ? "right-0" : "left-0"
            } ${className}`}
            role="dialog"
            aria-label="GIF Picker"
        >
            {/* Header with Search and Close */}
            <div className="p-2.5 pb-1 border-b border-(--border)/40 bg-(--surface-low)/40">
                <div className="flex items-center gap-2 mb-2">
                    <div className="relative flex-1">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Search GIFs via GIPHY..."
                            autoFocus
                            className="w-full rounded-xl border border-(--border)/40 bg-(--surface-container) py-1.5 pl-9 pr-8 text-xs text-primary placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    setLoading(true);
                                    fetchTrendingGifs().then((items) => {
                                        setGifs(items);
                                        setLoading(false);
                                    });
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-secondary hover:text-primary"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close GIF picker"
                        className="rounded-full p-1.5 text-secondary hover:bg-(--surface-container-high) hover:text-primary transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                    {GIF_CATEGORIES.map((cat) => {
                        const isSelected = !search && activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    setActiveCategory(cat.id);
                                    setLoading(true);
                                }}
                                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                                    isSelected
                                        ? "bg-primary text-(--on-primary)"
                                        : "bg-(--surface-container) text-secondary hover:bg-(--surface-container-high) hover:text-primary"
                                }`}
                            >
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* GIF Grid / Loading / Empty */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                {loading ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-secondary">
                        <Loader2 size={24} className="animate-spin text-primary" />
                        <span className="text-xs">Finding GIFs...</span>
                    </div>
                ) : gifs.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center py-12 text-center text-secondary">
                        <p className="text-xs">No GIFs found for "{search}"</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                        {gifs.map((gif) => (
                            <button
                                key={gif.id}
                                type="button"
                                onClick={() => onSelect(gif)}
                                className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-(--surface-container) hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 cursor-pointer"
                            >
                                <img
                                    src={gif.previewUrl}
                                    alt={gif.title}
                                    loading="lazy"
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                                    <span className="text-[10px] text-white line-clamp-1 text-left font-medium">
                                        {gif.title}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer with GIPHY Attribution */}
            <div className="flex items-center justify-between border-t border-(--border)/40 bg-(--surface-low)/50 px-3 py-1.5 text-[10px] text-secondary">
                <span className="font-medium tracking-wide">GIFs</span>
                <span className="font-semibold text-primary/80">Powered by GIPHY</span>
            </div>
        </div>
    );
}
