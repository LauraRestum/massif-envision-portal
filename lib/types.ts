export type PipelineStatus = "pending" | "quoted" | "accepted" | "production";

export type AwaitingFrom = "massif" | "envision" | null;

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
}

export const STATUS_LABEL: Record<PipelineStatus, string> = {
  pending: "Pending",
  quoted: "Quoted",
  accepted: "Accepted",
  production: "In Production",
};
