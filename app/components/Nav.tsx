"use client";

interface NavProps {
  liveCount: number;
  query: string;
  onQueryChange: (value: string) => void;
  lastUpdate: string;
}

export default function Nav({
  liveCount,
  query,
  onQueryChange,
  lastUpdate,
}: NavProps) {
  return (
    <nav className="nav" aria-label="Primary">
      <div className="nav-brand">
        <span className="nav-x" aria-hidden="true">
          x
        </span>
        <div className="nav-massif" role="img" aria-label="Massif"></div>
        <span className="nav-massif-label">Program Pipeline</span>
      </div>

      <div className="nav-search-wrap" role="search">
        <span className="nav-search-icon" aria-hidden="true">
          ⌕
        </span>
        <label htmlFor="navSearch" className="visually-hidden">
          Search pipeline lines
        </label>
        <input
          className="nav-search"
          id="navSearch"
          type="search"
          placeholder="Search SKU, description, estimate..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <div className="nav-meta" aria-live="polite">
        <span>Last Update {lastUpdate}</span>
        <span>
          <span id="liveCount">{liveCount}</span> Active Lines
        </span>
      </div>
    </nav>
  );
}
