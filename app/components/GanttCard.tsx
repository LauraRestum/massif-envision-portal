"use client";

import { useEffect, useRef } from "react";

interface GanttRow {
  name: string;
  phase: string;
  bar: { cls: "complete" | "active" | "future"; label: string; left: string; width: string };
}

const ROWS: GanttRow[] = [
  { name: "Tech Pack", phase: "01 / COMPLETE", bar: { cls: "complete", label: "RECEIVED", left: "0%", width: "16.6%" } },
  { name: "Sample Approval", phase: "02 / COMPLETE", bar: { cls: "complete", label: "APPROVED", left: "8.3%", width: "25%" } },
  { name: "Quote Submitted", phase: "03 / COMPLETE", bar: { cls: "complete", label: "DONE", left: "25%", width: "8.3%" } },
  { name: "Pattern Engineering", phase: "04 / ACTIVE NOW", bar: { cls: "active", label: "IN PROGRESS", left: "33.3%", width: "25%" } },
  { name: "Material Sourcing", phase: "05 / PLANNED", bar: { cls: "future", label: "PLANNED", left: "50%", width: "25%" } },
  { name: "Production Run", phase: "06 / SEPT-OCT", bar: { cls: "future", label: "SEPT-OCT", left: "66.6%", width: "25%" } },
  { name: "Delivery Window", phase: "07 / NOV-DEC", bar: { cls: "future", label: "NOV-DEC", left: "83.3%", width: "16.6%" } },
];

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export default function GanttCard() {
  const heroRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);

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
  }, []);

  return (
    <section className="gantt-section" ref={rootRef}>
      <div className="gantt-card">
        <div className="gantt-hero" ref={heroRef}>
          <div className="gantt-hero-bg" ref={bgRef}></div>
          <div className="gantt-hero-overlay"></div>
          <div className="gantt-hero-content">
            <div className="gantt-hero-left">
              <div className="gantt-hero-tag">FLAGSHIP PROGRAM</div>
              <span className="priority-tag">Priority Build</span>
              <h2>
                Flight Suit Pant <em>Military V1</em>
              </h2>
              <p className="desc">
                13,000 annual units. Weekly cadence at 250 units. September to
                October 2026 production. EST 1054 / MPNT00069.
              </p>
            </div>
            <div className="gantt-hero-right">
              <div className="val">32%</div>
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

            {ROWS.map((row) => (
              <div key={row.name} className="gantt-row">
                <div className="gantt-rowlabel">
                  <div className="name">{row.name}</div>
                  <div className="phase">{row.phase}</div>
                </div>
                <div className="gantt-track">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="month-cell"></div>
                  ))}
                  <div
                    className={`gantt-bar ${row.bar.cls}`}
                    data-label={row.bar.label}
                    style={{ left: row.bar.left, width: row.bar.width }}
                  >
                    {row.bar.cls === "active" && (
                      <>
                        <span className="shimmer"></span>
                        <span className="pulse-dot"></span>
                      </>
                    )}
                  </div>
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
