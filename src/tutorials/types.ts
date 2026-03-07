import type { Node, Edge } from "@xyflow/react";

export type TutorialPhase = "build" | "execute" | "observe";

export interface TutorialStep {
  phase: TutorialPhase;
  title: string;
  description: string;
  code: string;
  highlightLines?: [number, number]; // [start, end] lines to highlight
  nodes: Node[];
  edges: Edge[];
  activeNodeId?: string; // node being highlighted during execution
  memory?: Record<string, unknown>; // memory state snapshot
  narrative?: string; // narrative text at this point
}

export interface Tutorial {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
}
