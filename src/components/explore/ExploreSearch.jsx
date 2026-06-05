import { Search, X } from "lucide-react";

export default function ExploreSearch({ searchQuery, setSearchQuery }) {
    
  return (
    <div className="content-card-padded">
      <div className="flex items-center gap-3">
        <Search size={20} className="text-secondary" />

        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search posts, people, or communities..." 
        className="input-surface type-body-sm flex-1 bg-transparent text-primary outline-none placeholder:text-(--text-secondary) gap-3 rounded-lg px-4 py-3 "/>

        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery("")} className="icon-button-soft flex h-8 w-8 items-center justify-center" aria-label="Clear search">
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
