import { Search, X, Hash } from "lucide-react";

const SUGGESTED_TAGS = ["#technology", "#announcements", "#design", "#general", "#photos"];

export default function ExploreSearch({ searchQuery, setSearchQuery }) {
  return (
    <div className="content-card-padded space-y-3">
      <div className="flex items-center gap-3">
        <Search size={20} className="text-secondary shrink-0" />

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search posts, @people, or #tags..."
          className="input-surface type-body-sm flex-1 bg-transparent text-primary outline-none placeholder:text-(--text-secondary) rounded-lg px-4 py-3 border-0"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="icon-button-soft flex h-8 w-8 items-center justify-center shrink-0 border-0"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 custom-scrollbar">
        <span className="type-label-xs text-text-secondary pr-1 flex items-center gap-1 shrink-0">
          <Hash size={13} /> Trending:
        </span>
        {SUGGESTED_TAGS.map((tag) => {
          const isSelected = searchQuery.toLowerCase() === tag.toLowerCase();
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setSearchQuery(isSelected ? "" : tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border-0 shrink-0 ${
                isSelected
                  ? "gradient-primary text-(--button-gradient-text) shadow-xs"
                  : "bg-surface-low hover:bg-surface-high text-text-secondary hover:text-text-primary"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
