"use client";

import { useEffect, useRef } from "react";

interface Stat {
  cls: string;
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { cls: "s-pending", value: "07", label: "Pending" },
  { cls: "s-quoted", value: "01", label: "Quoted" },
  { cls: "s-accepted", value: "05", label: "Accepted" },
  { cls: "s-production", value: "02", label: "Production" },
  { cls: "stat-feat", value: "$2.6M", label: "Weighted Forecast" },
];

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
      el.textContent = isCurrency
        ? target
        : String(Math.round(numericTarget)).padStart(2, "0");
    }
  }
  el.textContent = isCurrency ? "$0.0M" : "00";
  requestAnimationFrame(tick);
}

export default function KpiStats() {
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div className="stats" ref={containerRef}>
      {STATS.map((s) => (
        <div key={s.label} className={`stat ${s.cls}`}>
          <div className="v">{s.value}</div>
          <div className="l">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
