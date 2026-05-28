export type PipelineStatus = "pending" | "quoted" | "accepted" | "production";

export type AwaitingFrom = "massif" | "envision" | null;

export type PhaseClass = "complete" | "active" | "future";

export interface Phase {
  name: string;
  phase: string;
  cls: PhaseClass;
  label: string;
  left: string;
  width: string;
  /** When true, render as a point/diamond milestone marker instead of a bar. */
  milestone?: boolean;
}

export interface PipelineLine {
  est: string;
  desc: string;
  sku: string;
  status: PipelineStatus;
  awaitingFrom: AwaitingFrom;
  awaitingItem: string | null;
  annualQty: number | null;
  price: number | null;
  priority?: boolean;
  updatedAt?: string;
  /** Optional hand-crafted schedule. If omitted, derived from status. */
  phases?: Phase[];
  /** Optional schedule % override. Otherwise derived from status. */
  schedulePct?: number;
}

export const STATUS_LABEL: Record<PipelineStatus, string> = {
  pending: "Pending",
  quoted: "Quoted",
  accepted: "Accepted",
  production: "In Production",
};

const SCHEDULE_PCT: Record<PipelineStatus, number> = {
  pending: 12,
  quoted: 26,
  accepted: 32,
  production: 78,
};

/** Returns the percent schedule complete for a line. */
export function schedulePct(row: PipelineLine): number {
  return row.schedulePct ?? SCHEDULE_PCT[row.status];
}

interface PhaseTemplate {
  name: string;
  phase: string;
  left: string;
  width: string;
  milestone?: boolean;
}

const PHASE_TEMPLATES: PhaseTemplate[] = [
  { name: "Tech Pack", phase: "01", left: "0%", width: "16.6%" },
  { name: "Sample Approval", phase: "02", left: "8.3%", width: "25%" },
  { name: "Quote Submitted", phase: "03", left: "25%", width: "8.3%" },
  { name: "Pattern Engineering", phase: "04", left: "33.3%", width: "16.6%" },
  { name: "Material Delivery", phase: "05", left: "50%", width: "0%", milestone: true },
  { name: "First Article Validation", phase: "06", left: "50%", width: "16.6%" },
  { name: "Ramp Up / Jump Run", phase: "07", left: "66.6%", width: "25%" },
  { name: "Production Run Live", phase: "08", left: "91.6%", width: "0%", milestone: true },
];

const PHASES_COMPLETE_BY_STATUS: Record<PipelineStatus, number> = {
  pending: 1,
  quoted: 3,
  accepted: 3,
  production: 6,
};

const ACTIVE_INDEX_BY_STATUS: Record<PipelineStatus, number | null> = {
  pending: null,
  quoted: null,
  accepted: 3,
  production: 6,
};

/** Returns the schedule phases for a line, deriving from status if not present. */
export function phasesFor(row: PipelineLine): Phase[] {
  if (row.phases) return row.phases;
  const completeCount = PHASES_COMPLETE_BY_STATUS[row.status];
  const activeIdx = ACTIVE_INDEX_BY_STATUS[row.status];
  return PHASE_TEMPLATES.map((t, i) => {
    let cls: PhaseClass = "future";
    let label = t.name.toUpperCase();
    if (i < completeCount) {
      cls = "complete";
      label = "DONE";
    } else if (i === activeIdx) {
      cls = "active";
      label = "IN PROGRESS";
    } else {
      cls = "future";
      label = "PLANNED";
    }
    return {
      name: t.name,
      phase: `${t.phase} / ${cls === "complete" ? "COMPLETE" : cls === "active" ? "ACTIVE NOW" : "PLANNED"}`,
      cls,
      label,
      left: t.left,
      width: t.width,
      milestone: t.milestone,
    };
  });
}

const VARIANT_RE = /^(\d+)\.([a-z0-9]+)$/i;

/** If est is a variant id (e.g. "1054.a"), returns its parent EST ("1054"). */
export function parentEstOf(est: string): string | null {
  const m = VARIANT_RE.exec(est);
  return m ? m[1] : null;
}

export function isVariant(est: string): boolean {
  return VARIANT_RE.test(est);
}

/** Returns the latest `updatedAt` from a set of lines, or null. */
export function latestUpdate(lines: PipelineLine[]): string | null {
  let max: string | null = null;
  for (const r of lines) {
    if (r.updatedAt && (!max || r.updatedAt > max)) max = r.updatedAt;
  }
  return max;
}

/** Formats an ISO date as "2026.05.20". */
export function formatNavDate(iso: string): string {
  return iso.replace(/-/g, ".");
}
