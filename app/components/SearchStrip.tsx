"use client";

interface SearchStripProps {
  query: string;
  onQueryChange: (value: string) => void;
}

export default function SearchStrip({ query, onQueryChange }: SearchStripProps) {
  return (
    <div className="search-strip">
      <div className="search-strip-inner">
        <div className="nav-search-wrap">
          <span className="nav-search-icon">⌕</span>
          <input
            className="nav-search"
            id="navSearch"
            type="text"
            placeholder="Search SKU, description, estimate..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
