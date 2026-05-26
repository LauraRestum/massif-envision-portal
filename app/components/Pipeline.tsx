"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PipelineLine,
  PipelineStatus,
  STATUS_LABEL,
  isVariant,
  parentEstOf,
} from "@/lib/types";

type FilterKey = "all" | PipelineStatus;
export type ViewMode = "cards" | "table";
export type SortKey = "est" | "desc" | "status" | "awaiting" | "qty" | "price";
export type SortDir = "asc" | "desc";

interface PipelineProps {
  data: PipelineLine[];
  filter: FilterKey;
  onFilterChange: (f: FilterKey) => void;
  query: string;
  onClearSearch: () => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSortChange: (key: SortKey, dir: SortDir) => void;
}

const STATUS_ORDER: Record<PipelineStatus, number> = {
  pending: 0,
  quoted: 1,
  accepted: 2,
  production: 3,
};

type GroupKey = "massif" | "envision" | "ready";

const GROUP_LABEL: Record<GroupKey, string> = {
  massif: "Waiting on Massif",
  envision: "In progress at Envision",
  ready: "Ready to advance",
};

const GROUP_ORDER: GroupKey[] = ["massif", "envision", "ready"];

function groupOf(row: PipelineLine): GroupKey {
  if (row.awaitingFrom === "massif") return "massif";
  if (row.awaitingFrom === "envision") return "envision";
  return "ready";
}

/** Pair each parent with its variants. Orphan variants (no parent in set) stay flat. */
function nestVariants(rows: PipelineLine[]): {
  parent: PipelineLine;
  variants: PipelineLine[];
}[] {
  const byEst = new Map<string, PipelineLine>();
  for (const r of rows) byEst.set(r.est, r);

  const groups: {
    parent: PipelineLine;
    variants: PipelineLine[];
  }[] = [];
  const consumedAsVariant = new Set<string>();

  // First pass: variants whose parent is present get attached
  for (const r of rows) {
    const pEst = parentEstOf(r.est);
    if (pEst && byEst.has(pEst)) {
      consumedAsVariant.add(r.est);
    }
  }

  for (const r of rows) {
    if (consumedAsVariant.has(r.est)) continue;
    const variants = rows
      .filter((v) => parentEstOf(v.est) === r.est)
      .sort((a, b) => a.est.localeCompare(b.est, undefined, { numeric: true }));
    groups.push({ parent: r, variants });
  }
  return groups;
}

export default function Pipeline({
  data,
  filter,
  onFilterChange,
  query,
  onClearSearch,
  view,
  onViewChange,
  sortKey,
  sortDir,
  onSortChange,
}: PipelineProps) {
  const cardsRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return data.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return (r.est + " " + r.desc + " " + r.sku).toLowerCase().includes(q);
    });
  }, [data, filter, query]);

  const nestedAll = useMemo(() => nestVariants(filtered), [filtered]);

  const grouped = useMemo(() => {
    const groups: Record<
      GroupKey,
      { parent: PipelineLine; variants: PipelineLine[] }[]
    > = { massif: [], envision: [], ready: [] };
    for (const item of nestedAll) groups[groupOf(item.parent)].push(item);
    for (const key of GROUP_ORDER) {
      groups[key].sort((a, b) => {
        if (!!b.parent.priority !== !!a.parent.priority)
          return b.parent.priority ? 1 : -1;
        return a.parent.est.localeCompare(b.parent.est, undefined, {
          numeric: true,
        });
      });
    }
    return groups;
  }, [nestedAll]);

  const groupedCounts = useMemo(() => {
    const counts: Record<GroupKey, number> = { massif: 0, envision: 0, ready: 0 };
    for (const item of nestedAll) {
      counts[groupOf(item.parent)] += 1 + item.variants.length;
    }
    return counts;
  }, [nestedAll]);

  const sortedFlat = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "est":
          cmp = a.est.localeCompare(b.est, undefined, { numeric: true });
          break;
        case "desc":
          cmp = a.desc.localeCompare(b.desc);
          break;
        case "status":
          cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
          break;
        case "awaiting":
          cmp = (a.awaitingFrom ?? "zzz").localeCompare(b.awaitingFrom ?? "zzz");
          break;
        case "qty":
          cmp = (a.annualQty ?? -1) - (b.annualQty ?? -1);
          break;
        case "price":
          cmp = (a.price ?? -1) - (b.price ?? -1);
          break;
      }
      return cmp * dir;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // Stagger-in observer (cards view only)
  useEffect(() => {
    if (view !== "cards") return;
    const root = cardsRef.current;
    if (!root) return;
    const cards = root.querySelectorAll<HTMLElement>(".pcard");
    if (!cards.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const card = entry.target as HTMLElement;
            const parent = card.parentElement;
            if (!parent) return;
            const i = Array.from(parent.children).indexOf(card);
            card.style.transitionDelay = i * 50 + "ms";
            card.classList.add("in-view");
            obs.unobserve(card);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    cards.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, [filtered, view]);

  const handleHeaderClick = (key: SortKey) => {
    if (sortKey === key) {
      onSortChange(key, sortDir === "asc" ? "desc" : "asc");
    } else {
      onSortChange(key, key === "qty" || key === "price" ? "desc" : "asc");
    }
  };

  const ariaSort = (key: SortKey): "ascending" | "descending" | "none" =>
    sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none";

  return (
    <section className="pipeline" id="pipeline" aria-labelledby="pipeline-h">
      <div className="pipeline-head">
        <h2 id="pipeline-h">
          All <span className="accent">Active Lines</span>
        </h2>
        <div className="pipeline-tools">
          {filter !== "all" && (
            <button
              type="button"
              className="fbtn fbtn-reset"
              onClick={() => onFilterChange("all")}
              aria-label="Clear status filter"
            >
              ✕ {filter} filter
            </button>
          )}
          <div
            className="view-toggle"
            role="tablist"
            aria-label="View as cards or table"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "cards"}
              className={`vbtn ${view === "cards" ? "active" : ""}`}
              onClick={() => onViewChange("cards")}
            >
              Cards
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "table"}
              className={`vbtn ${view === "table" ? "active" : ""}`}
              onClick={() => onViewChange("table")}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState query={query} onClearSearch={onClearSearch} />
      ) : view === "cards" ? (
        <div className="pipeline-groups" ref={cardsRef}>
          {GROUP_ORDER.map((g) => {
            const items = grouped[g];
            if (items.length === 0) return null;
            return (
              <div key={g} className={`pgroup pgroup-${g}`}>
                <div className="pgroup-head">
                  <span
                    className={`pgroup-dot pgroup-dot-${g}`}
                    aria-hidden="true"
                  />
                  <h3 className="pgroup-title">{GROUP_LABEL[g]}</h3>
                  <span className="pgroup-count">{groupedCounts[g]}</span>
                </div>
                <div className="pipeline-cards">
                  {items.map(({ parent, variants }) => (
                    <PipelineCard
                      key={parent.est}
                      row={parent}
                      variants={variants}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="pipeline-table-wrap">
          <table className="pipeline-table">
            <thead>
              <tr>
                <Th
                  sortKey="est"
                  current={sortKey}
                  dir={sortDir}
                  onClick={handleHeaderClick}
                  ariaSort={ariaSort("est")}
                >
                  EST
                </Th>
                <Th
                  sortKey="desc"
                  current={sortKey}
                  dir={sortDir}
                  onClick={handleHeaderClick}
                  ariaSort={ariaSort("desc")}
                >
                  Description
                </Th>
                <th scope="col">SKU</th>
                <Th
                  sortKey="status"
                  current={sortKey}
                  dir={sortDir}
                  onClick={handleHeaderClick}
                  ariaSort={ariaSort("status")}
                >
                  Status
                </Th>
                <Th
                  sortKey="awaiting"
                  current={sortKey}
                  dir={sortDir}
                  onClick={handleHeaderClick}
                  ariaSort={ariaSort("awaiting")}
                >
                  Awaiting
                </Th>
                <Th
                  sortKey="qty"
                  current={sortKey}
                  dir={sortDir}
                  onClick={handleHeaderClick}
                  ariaSort={ariaSort("qty")}
                  align="right"
                >
                  Annual Qty
                </Th>
                <Th
                  sortKey="price"
                  current={sortKey}
                  dir={sortDir}
                  onClick={handleHeaderClick}
                  ariaSort={ariaSort("price")}
                  align="right"
                >
                  Price
                </Th>
              </tr>
            </thead>
            <tbody>
              {sortedFlat.map((r) => {
                const variant = isVariant(r.est);
                const pEst = variant ? parentEstOf(r.est) : null;
                return (
                  <tr
                    key={r.est}
                    className={`${r.priority ? "is-priority" : ""} ${
                      variant ? "is-variant" : ""
                    }`.trim()}
                  >
                    <td className="t-est">
                      {variant && (
                        <span className="t-variant-mark" aria-hidden="true">
                          ↳
                        </span>
                      )}
                      {r.priority && (
                        <span className="t-priority" title="Priority">
                          ★
                        </span>
                      )}
                      EST {r.est}
                      {variant && pEst && (
                        <span className="t-variant-of">of {pEst}</span>
                      )}
                    </td>
                    <td className="t-desc">{r.desc}</td>
                    <td className="t-sku">{r.sku}</td>
                    <td>
                      <span className={`status-chip s-${r.status}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td>
                      <AwaitingChip row={r} compact />
                    </td>
                    <td className="t-num">
                      {r.annualQty ? r.annualQty.toLocaleString() : "—"}
                    </td>
                    <td className="t-num">
                      {r.price ? `$${r.price.toFixed(2)}` : "TBD"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Th({
  sortKey,
  current,
  dir,
  onClick,
  ariaSort,
  align,
  children,
}: {
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
  ariaSort: "ascending" | "descending" | "none";
  align?: "right";
  children: React.ReactNode;
}) {
  const isActive = current === sortKey;
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`${align === "right" ? "t-right " : ""}${
        isActive ? "is-sorted" : ""
      }`}
    >
      <button type="button" className="th-sort" onClick={() => onClick(sortKey)}>
        {children}
        <span className="th-sort-ind" aria-hidden="true">
          {isActive ? (dir === "asc" ? "▲" : "▼") : "▾"}
        </span>
      </button>
    </th>
  );
}

function AwaitingChip({
  row,
  compact = false,
}: {
  row: PipelineLine;
  compact?: boolean;
}) {
  if (!row.awaitingFrom) {
    return (
      <span className={`await-chip await-clear${compact ? " compact" : ""}`}>
        <span className="await-dot" aria-hidden="true" />
        Ready to advance
      </span>
    );
  }
  const isMassif = row.awaitingFrom === "massif";
  return (
    <span
      className={`await-chip ${isMassif ? "await-massif" : "await-envision"}${
        compact ? " compact" : ""
      }`}
    >
      <span className="await-dot" aria-hidden="true" />
      <span className="await-who">{isMassif ? "Massif" : "Envision"}</span>
      <span className="await-sep" aria-hidden="true">
        ·
      </span>
      <span className="await-what">{row.awaitingItem}</span>
    </span>
  );
}

function EmptyState({
  query,
  onClearSearch,
}: {
  query: string;
  onClearSearch: () => void;
}) {
  const isSearch = query.trim().length > 0;
  return (
    <div className="empty-state" role="status">
      <div className="empty-icon" aria-hidden="true">
        ⎀
      </div>
      <div className="empty-title">
        {isSearch ? "No matches found" : "No lines match this filter"}
      </div>
      <div className="empty-msg">
        {isSearch ? (
          <>
            Nothing in the pipeline matches{" "}
            <strong>&ldquo;{query}&rdquo;</strong>. Try a different search term
            or clear the search to see all lines.
          </>
        ) : (
          "Try a different status filter to see active opportunities."
        )}
      </div>
      {isSearch && (
        <button className="empty-action" onClick={onClearSearch}>
          Clear Search
        </button>
      )}
    </div>
  );
}

function PipelineCard({
  row,
  variants,
}: {
  row: PipelineLine;
  variants: PipelineLine[];
}) {
  const [expanded, setExpanded] = useState(false);
  const hasVariants = variants.length > 0;

  const qty = row.annualQty ? (
    <>
      <strong>{row.annualQty.toLocaleString()}</strong> units / yr
    </>
  ) : (
    "Volume TBD"
  );
  const priceHtml = row.price ? (
    <span className="price">${row.price.toFixed(2)}</span>
  ) : (
    <span className="price tbd">TBD</span>
  );

  return (
    <article
      className={`pcard${row.priority ? " priority" : ""}${
        hasVariants ? " has-variants" : ""
      }`}
    >
      <div className="top">
        <div className="est">EST {row.est}</div>
        <div className={`stat ${row.status}`}>{STATUS_LABEL[row.status]}</div>
      </div>
      <div className="name">{row.desc}</div>
      <div className="sku">{row.sku}</div>
      <div className="await-row-wrap">
        <AwaitingChip row={row} />
      </div>
      <div className="bottom">
        <div className="qty">{qty}</div>
        {priceHtml}
      </div>

      {hasVariants && (
        <div className={`variants${expanded ? " open" : ""}`}>
          <button
            type="button"
            className="variants-toggle"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={`variants-${row.est}`}
          >
            <span className="variants-chev" aria-hidden="true">
              {expanded ? "▾" : "▸"}
            </span>
            {variants.length} variant{variants.length === 1 ? "" : "s"}
          </button>
          {expanded && (
            <ul className="variants-list" id={`variants-${row.est}`}>
              {variants.map((v) => (
                <li key={v.est} className="variant-row">
                  <span className="variant-est">EST {v.est}</span>
                  <span className="variant-desc">{v.desc}</span>
                  <AwaitingChip row={v} compact />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}
