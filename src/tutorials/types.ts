import type { Node, Edge } from "@xyflow/react";

export type TutorialPhase = "build" | "execute" | "observe";

export interface StageSnapshot {
  stageName: string;
  stageLabel: string;
  memory: Record<string, unknown>;
  narrative: string;
  startMs: number;
  durationMs: number;
}

export interface TutorialStep {
  phase: TutorialPhase;
  title: string;
  description: string;
  code: string;
  /** New lines added in this step (for collapsible code) */
  newCodeRange?: [number, number];
  highlightLines?: [number, number];
  nodes: Node[];
  edges: Edge[];
  activeNodeId?: string;
  /** Which node the code corresponds to in build phase */
  linkedNodeId?: string;
  memory?: Record<string, unknown>;
  narrative?: string;
  /** Per-stage snapshots for time-travel in observe phase */
  snapshots?: StageSnapshot[];
}

export interface Tutorial {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
}
