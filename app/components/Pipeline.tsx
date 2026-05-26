"use client";

import { useEffect, useMemo, useRef } from "react";
import { PipelineLine, PipelineStatus, STATUS_LABEL } from "@/lib/types";

type FilterKey = "all" | PipelineStatus;

interface PipelineProps {
  data: PipelineLine[];
  filter: FilterKey;
  onFilterChange: (f: FilterKey) => void;
  query: string;
  onClearSearch: () => void;
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "quoted", label: "Quoted" },
  { key: "accepted", label: "Accepted" },
  { key: "production", label: "Production" },
];

export default function Pipeline({
  data,
  filter,
  onFilterChange,
  query,
  onClearSearch,
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

  // Stagger-in observer
  useEffect(() => {
    const root = cardsRef.current;
    if (!root) return;
    const cards = root.querySelectorAll<HTMLElement>(".pcard");
    if (!cards.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const card = entry.target as HTMLElement;
            const i = Array.from(card.parentElement!.children).indexOf(card);
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
  }, [filtered]);

  return (
    <section className="pipeline">
      <div className="pipeline-head">
        <h2>
          All <em>Active Lines</em>
        </h2>
        <div className="pipeline-filters" id="filters">
          {FILTERS.map((f) => {
            const count =
              f.key === "all"
                ? data.length
                : data.filter((r) => r.status === f.key).length;
            const label = f.key === "all" ? `All (${count})` : f.label;
            return (
              <button
                key={f.key}
                className={`fbtn ${filter === f.key ? "active" : ""}`}
                onClick={() => onFilterChange(f.key)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="pipeline-cards" id="pcards" ref={cardsRef}>
        {filtered.length === 0 ? (
          <EmptyState query={query} onClearSearch={onClearSearch} />
        ) : (
          filtered.map((r) => <PipelineCard key={r.est} row={r} />)
        )}
      </div>
    </section>
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
    <div className="empty-state">
      <div className="empty-icon">⎀</div>
      <div className="empty-title">
        {isSearch ? "No matches found" : "No lines match this filter"}
      </div>
      <div className="empty-msg">
        {isSearch ? (
          <>
            Nothing in the pipeline matches <strong>&ldquo;{query}&rdquo;</strong>.
            Try a different search term or clear the search to see all lines.
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

function PipelineCard({ row }: { row: PipelineLine }) {
  let awaitClass = "";
  let awaitText: React.ReactNode = "";
  if (!row.awaitingFrom) {
    awaitClass = "clear";
    awaitText = <strong>Ready to advance</strong>;
  } else if (row.awaitingFrom === "massif") {
    awaitText = (
      <>
        Awaiting <strong>{row.awaitingItem}</strong> from Massif
      </>
    );
  } else {
    awaitClass = "us";
    awaitText = (
      <>
        <strong>{row.awaitingItem}</strong> in progress at Envision
      </>
    );
  }

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
    <div className={`pcard${row.priority ? " priority" : ""}`}>
      <div className="top">
        <div className="est">EST {row.est}</div>
        <div className={`stat ${row.status}`}>{STATUS_LABEL[row.status]}</div>
      </div>
      <div className="name">{row.desc}</div>
      <div className="sku">{row.sku}</div>
      <div className={`await-row ${awaitClass}`}>{awaitText}</div>
      <div className="bottom">
        <div className="qty">{qty}</div>
        {priceHtml}
      </div>
    </div>
  );
}
