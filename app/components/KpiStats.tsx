"use client";

import { useEffect, useRef } from "react";
import type { PipelineLine, PipelineStatus } from "@/lib/types";

type FilterKey = "all" | PipelineStatus;

interface KpiStatsProps {
  data: PipelineLine[];
  filter: FilterKey;
  onFilterChange: (f: FilterKey) => void;
}

interface StatDef {
  key: FilterKey;
  cls: string;
  label: string;
}

const STATS: StatDef[] = [
  { key: "pending", cls: "s-pending", label: "Pending" },
  { key: "quoted", cls: "s-quoted", label: "Quoted" },
  { key: "accepted", cls: "s-accepted", label: "Accepted" },
  { key: "review", cls: "s-review", label: "In Review" },
  { key: "production", cls: "s-production", label: "Production" },
];

function animateCount(el: HTMLElement, target: string, duration = 1500) {
  const start = performance.now();
  const numericTarget = parseFloat(target);

  function tick(now: number) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const current = numericTarget * eased;
    el.textContent = String(Math.round(current)).padStart(2, "0");
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target;
    }
  }
  el.textContent = "00";
  requestAnimationFrame(tick);
}

export default function KpiStats({ data, filter, onFilterChange }: KpiStatsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const counts: Record<PipelineStatus, number> = {
    pending: 0,
    quoted: 0,
    accepted: 0,
    review: 0,
    production: 0,
  };
  for (const row of data) {
    counts[row.status]++;
  }

  // Only statuses that have lines get a square, so an empty "00" never
  // suggests work that isn't there.
  const shown = STATS.filter(
    (s) => counts[s.key as PipelineStatus] > 0 || filter === s.key
  );

  useEffect(() => {
    const respectReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (respectReducedMotion) return;
    const timer = window.setTimeout(() => {
      const statValues =
        containerRef.current?.querySelectorAll<HTMLElement>(".stat .v");
      statValues?.forEach((el, i) => {
        const original = el.textContent?.trim() ?? "";
        window.setTimeout(() => animateCount(el, original), i * 80);
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="stats"
      style={{ ["--stat-cols" as string]: shown.length }}
      ref={containerRef}
      role="group"
      aria-label="Pipeline status filters"
    >
      {shown.map((s) => {
        const value = String(counts[s.key as PipelineStatus]).padStart(2, "0");
        const isActive = filter === s.key;
        const handleToggle = () => {
          onFilterChange(filter === s.key ? "all" : (s.key as FilterKey));
        };
        return (
          <button
            key={s.label}
            type="button"
            className={`stat ${s.cls}${isActive ? " is-active" : ""}`}
            onClick={handleToggle}
            aria-pressed={isActive}
            aria-label={`${isActive ? "Clear" : "Filter by"} ${s.label} (${value})`}
          >
            <div className="v">{value}</div>
            <div className="l">{s.label}</div>
          </button>
        );
      })}
    </div>
  );
}
