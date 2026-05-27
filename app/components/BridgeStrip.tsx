import type { PipelineLine } from "@/lib/types";

interface BridgeStripProps {
  data: PipelineLine[];
}

export default function BridgeStrip({ data }: BridgeStripProps) {
  const waitingMassif = data.filter((r) => r.awaitingFrom === "massif").length;
  const inProgressEnvision = data.filter(
    (r) => r.awaitingFrom === "envision"
  ).length;
  const ready = data.filter((r) => r.awaitingFrom === null).length;
  const inMotion = data.length;

  return (
    <section className="bridge-strip" aria-label="Pipeline summary">
      <div className="bridge-eyebrow">// PROGRAM CONTINUITY</div>
      <div className="bridge-stats">
        <div className="bridge-stat">
          <span className="bridge-stat-v">{waitingMassif}</span>
          <span className="bridge-stat-l">Waiting on Massif</span>
        </div>
        <div className="bridge-stat">
          <span className="bridge-stat-v">{inProgressEnvision}</span>
          <span className="bridge-stat-l">In progress at Envision</span>
        </div>
        <div className="bridge-stat">
          <span className="bridge-stat-v">{ready}</span>
          <span className="bridge-stat-l">Ready to advance</span>
        </div>
        <div className="bridge-stat">
          <span className="bridge-stat-v">{inMotion}</span>
          <span className="bridge-stat-l">Lines in motion</span>
        </div>
      </div>
    </section>
  );
}
