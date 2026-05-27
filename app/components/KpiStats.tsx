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
  key: FilterKey | "forecast";
  cls: string;
  label: string;
}

const STATS: StatDef[] = [
  { key: "pending", cls: "s-pending", label: "Pending" },
  { key: "quoted", cls: "s-quoted", label: "Quoted" },
  { key: "accepted", cls: "s-accepted", label: "Accepted" },
  { key: "production", cls: "s-production", label: "Production" },
  { key: "forecast", cls: "stat-feat", label: "Weighted Forecast" },
];

const FORECAST_DISPLAY = "$2.6M";

function animateCount(el: HTMLElement, target: string, duration = 1500) {
  const start = performance.now();
  const isCurrency = target.startsWith("$");
  const numericTarget = isCurrency
    ? parseFloat(target.replace(/[$M,]/g, ""))
    : parseFloat(target);

  function tick(now: number) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const current = numericTarget * eased;
    if (isCurrency) {
      el.textContent = "$" + current.toFixed(1) + "M";
    } else {
      el.textContent = String(Math.round(current)).padStart(2, "0");
    }
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target;
    }
  }
  el.textContent = isCurrency ? "$0.0M" : "00";
  requestAnimationFrame(tick);
}

export default function KpiStats({ data, filter, onFilterChange }: KpiStatsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const counts: Record<PipelineStatus, number> = {
    pending: 0,
    quoted: 0,
    accepted: 0,
    production: 0,
  };
  for (const row of data) {
    counts[row.status]++;
  }

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
      ref={containerRef}
      role="group"
      aria-label="Pipeline status filters"
    >
      {STATS.map((s) => {
        const value =
          s.key === "forecast"
            ? FORECAST_DISPLAY
            : String(counts[s.key as PipelineStatus]).padStart(2, "0");
        const isFilter = s.key !== "forecast";
        const isActive = isFilter && filter === s.key;
        const handleToggle = () => {
          if (!isFilter) return;
          onFilterChange(filter === s.key ? "all" : (s.key as FilterKey));
        };
        return (
          <button
            key={s.label}
            type="button"
            className={`stat ${s.cls}${isActive ? " is-active" : ""}${
              !isFilter ? " is-static" : ""
            }`}
            onClick={handleToggle}
            disabled={!isFilter}
            aria-pressed={isFilter ? isActive : undefined}
            aria-label={
              isFilter
                ? `${isActive ? "Clear" : "Filter by"} ${s.label} (${value})`
                : `${s.label} ${value}`
            }
          >
            <div className="v">{value}</div>
            <div className="l">{s.label}</div>
          </button>
        );
      })}
    </div>
  );
}
