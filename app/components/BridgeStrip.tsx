"use client";

import {
  matchesAwaitFilter,
  type AwaitFilterKey,
  type PipelineLine,
} from "@/lib/types";

interface BridgeStripProps {
  data: PipelineLine[];
  awaitFilter: AwaitFilterKey;
  onAwaitFilterChange: (f: AwaitFilterKey) => void;
}

export default function BridgeStrip({
  data,
  awaitFilter,
  onAwaitFilterChange,
}: BridgeStripProps) {
  const waitingMassif = data.filter((r) => r.awaitingFrom === "massif").length;
  const inProgressEnvision = data.filter(
    (r) => r.awaitingFrom === "envision"
  ).length;
  const inReview = data.filter((r) => matchesAwaitFilter(r, "review")).length;
  const inMotion = data.length;

  /** Toggle a filter off when re-clicking the active one. */
  const toggle = (key: AwaitFilterKey) => {
    onAwaitFilterChange(awaitFilter === key ? "all" : key);
  };

  return (
    <section
      className="bridge-strip"
      role="group"
      aria-label="Filter pipeline by stage"
    >
      <div className="bridge-eyebrow">// PROGRAM CONTINUITY</div>
      <div className="bridge-stats">
        <BridgeStat
          value={waitingMassif}
          active={awaitFilter === "massif"}
          onClick={() => toggle("massif")}
          label={
            <>
              Waiting on <span className="massif-brand">Massif</span>
            </>
          }
          ariaLabel={`Waiting on Massif (${waitingMassif})`}
        />
        <BridgeStat
          value={inProgressEnvision}
          active={awaitFilter === "envision"}
          onClick={() => toggle("envision")}
          label="In progress at Envision"
          ariaLabel={`In progress at Envision (${inProgressEnvision})`}
        />
        <BridgeStat
          value={inReview}
          active={awaitFilter === "review"}
          onClick={() => toggle("review")}
          label="In review"
          ariaLabel={`In review (${inReview})`}
        />
        <BridgeStat
          value={inMotion}
          active={awaitFilter === "all"}
          onClick={() => onAwaitFilterChange("all")}
          label="All lines"
          ariaLabel={`Show all ${inMotion} lines`}
        />
      </div>
    </section>
  );
}

function BridgeStat({
  value,
  label,
  active,
  onClick,
  ariaLabel,
}: {
  value: number;
  label: React.ReactNode;
  active: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      className={`bridge-stat${active ? " is-active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
    >
      <span className="bridge-stat-v">{value}</span>
      <span className="bridge-stat-l">{label}</span>
    </button>
  );
}
