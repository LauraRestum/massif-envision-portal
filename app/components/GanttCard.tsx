"use client";

import { useEffect, useRef } from "react";
import type { PipelineLine } from "@/lib/types";
import { phasesFor, schedulePct } from "@/lib/types";

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

interface GanttCardProps {
  programs: PipelineLine[];
  selected: PipelineLine;
  onSelect: (est: string) => void;
}

export default function GanttCard({ programs, selected, onSelect }: GanttCardProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  const rows = phasesFor(selected);
  const pct = schedulePct(selected);
  const isPriority = !!selected.priority;
  const qtyText = selected.annualQty
    ? `${selected.annualQty.toLocaleString()} annual units. EST ${selected.est} / ${selected.sku}.`
    : `EST ${selected.est} / ${selected.sku}.`;

  // Parallax
  useEffect(() => {
    const hero = heroRef.current;
    const bg = bgRef.current;
    if (!hero || !bg) return;
    let ticking = false;
    function updateParallax() {
      if (!hero || !bg) return;
      const rect = hero.getBoundingClientRect();
      const viewportH = window.innerHeight;
      if (rect.bottom > 0 && rect.top < viewportH) {
        const scrollProgress = (viewportH - rect.top) / (viewportH + rect.height);
        const offset = (scrollProgress - 0.5) * 60;
        bg.style.setProperty("--parallax", offset + "px");
      }
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    updateParallax();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Length-aware bar labels
  useEffect(() => {
    function updateGanttLabels() {
      const bars = rootRef.current?.querySelectorAll<HTMLElement>(".gantt-bar");
      if (!bars) return;
      bars.forEach((bar) => {
        const label = bar.getAttribute("data-label");
        if (!label) return;
        const measureEl = document.createElement("span");
        const style = window.getComputedStyle(bar);
        measureEl.style.visibility = "hidden";
        measureEl.style.position = "absolute";
        measureEl.style.font = style.font;
        measureEl.style.letterSpacing = style.letterSpacing;
        measureEl.textContent = label;
        document.body.appendChild(measureEl);
        const textWidth = measureEl.offsetWidth;
        document.body.removeChild(measureEl);
        const barWidth = bar.offsetWidth;
        if (barWidth - 28 >= textWidth) {
          bar.classList.add("show-label");
        } else {
          bar.classList.remove("show-label");
        }
      });
    }
    updateGanttLabels();
    const t = window.setTimeout(updateGanttLabels, 500);
    window.addEventListener("resize", updateGanttLabels);
    return () => {
      window.removeEventListener("resize", updateGanttLabels);
      window.clearTimeout(t);
    };
  }, [selected]);

  return (
    <section className="gantt-section" ref={rootRef}>
      <div className="gantt-card">
        <div className="gantt-hero" ref={heroRef}>
          <div className="gantt-hero-bg" ref={bgRef}></div>
          <div className="gantt-hero-overlay"></div>
          <div className="gantt-hero-content">
            <div className="gantt-hero-left">
              {!isPriority && (
                <div className="gantt-hero-tag">PROGRAM SCHEDULE</div>
              )}
              {isPriority && <span className="priority-tag">Priority Build</span>}
              <h2>{selected.desc}</h2>
              <p className="desc">{qtyText}</p>
              <div className="gantt-selector">
                <label htmlFor="ganttSelect" className="visually-hidden">
                  Select program to schedule
                </label>
                <select
                  id="ganttSelect"
                  className="gantt-select"
                  value={selected.est}
                  onChange={(e) => onSelect(e.target.value)}
                >
                  {programs.map((p) => (
                    <option key={p.est} value={p.est}>
                      {p.priority ? "★ " : ""}EST {p.est} — {p.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="gantt-hero-right">
              <div className="val">{pct}%</div>
              <div className="lbl">Schedule Complete</div>
            </div>
          </div>
        </div>

        <div className="gantt-body">
          <div className="gantt">
            <div className="gantt-header">
              <div className="label-col">PHASE</div>
              {MONTHS.map((m) => (
                <div key={m} className={m === "MAY" ? "now" : undefined}>
                  {m}
                </div>
              ))}
            </div>

            {rows.map((row) => (
              <div key={row.name} className="gantt-row">
                <div className="gantt-rowlabel">
                  <div className="name">{row.name}</div>
                  <div className="phase">{row.phase}</div>
                </div>
                <div className="gantt-track">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="month-cell"></div>
                  ))}
                  {row.milestone ? (
                    <div
                      className={`gantt-milestone ${row.cls}`}
                      style={{ left: row.left }}
                      title={row.name}
                    ></div>
                  ) : (
                    <div
                      className={`gantt-bar ${row.cls}`}
                      data-label={row.label}
                      style={{ left: row.left, width: row.width }}
                    >
                      {row.cls === "active" && (
                        <>
                          <span className="shimmer"></span>
                          <span className="pulse-dot"></span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="gantt-now-overlay">
              <div className="gantt-now-line"></div>
            </div>
          </div>

          <div className="gantt-legend">
            <div className="item">
              <div className="sw complete"></div>Complete
            </div>
            <div className="item">
              <div className="sw active"></div>Active Now
            </div>
            <div className="item">
              <div className="sw future"></div>Planned
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
