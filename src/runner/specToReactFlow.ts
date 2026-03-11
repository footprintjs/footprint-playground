/**
 * Converts a SerializedPipelineStructure (from builder.toSpec()) into
 * ReactFlow nodes and edges with auto-layout.
 *
 * Supports two modes:
 * 1. Build-time only (no executionState) — all nodes gray
 * 2. With execution overlay — executed nodes colored, active node highlighted,
 *    unvisited nodes stay gray
 */
import type { Node, Edge } from "@xyflow/react";

interface SpecNode {
  name: string;
  id?: string;
  type?: "stage" | "decider" | "fork" | "streaming";
  description?: string;
  children?: SpecNode[];
  next?: SpecNode;
  branchIds?: string[];
  hasDecider?: boolean;
  hasSelector?: boolean;
  loopTarget?: string;
}

export interface ExecutionOverlay {
  /** Names of stages that have completed (before the active one) */
  doneStages: Set<string>;
  /** Name of the currently active stage */
  activeStage: string | null;
  /** Names of all stages that were executed (done + active) */
  executedStages: Set<string>;
  /** Ordered list of executed stage names (for step numbering) */
  executionOrder?: string[];
}

/** Colors for the flowchart — consumer provides these to match their theme */
export interface FlowchartColors {
  edgeDefault: string;
  edgeExecuted: string;
  edgeActive: string;
  labelDefault: string;
  labelExecuted: string;
  pathGlow: string;
}

const DEFAULT_COLORS: FlowchartColors = {
  edgeDefault: "#6e6480",
  edgeExecuted: "#3dd68c",
  edgeActive: "#7c6cf0",
  labelDefault: "#a89eb4",
  labelExecuted: "#3dd68c",
  pathGlow: "rgba(61, 214, 140, 0.3)",
};

interface LayoutState {
  nodes: Node[];
  edges: Edge[];
  edgeCounter: number;
  seen: Set<string>;
  overlay: ExecutionOverlay | null;
  colors: FlowchartColors;
}

const Y_STEP = 100;
const X_SPREAD = 200;

function nid(n: SpecNode): string {
  return n.name || n.id || `spec-${Math.random()}`;
}

function addEdge(
  state: LayoutState,
  source: string,
  target: string,
  label?: string
) {
  state.edgeCounter++;
  const o = state.overlay;
  const c = state.colors;
  const executed =
    o && o.executedStages.has(source) && o.executedStages.has(target);
  const isLeadingEdge = o && source === o.activeStage && !o.doneStages.has(target);

  if (executed) {
    // "Google Maps route" — thick glowing path for executed edges
    // Background glow layer (wide, transparent)
    state.edges.push({
      id: `se${state.edgeCounter}-glow`,
      source,
      target,
      style: {
        stroke: c.pathGlow,
        strokeWidth: 12,
        opacity: 0.6,
      },
      zIndex: 0,
      selectable: false,
      focusable: false,
    });
    // Foreground path (solid route line)
    state.edges.push({
      id: `se${state.edgeCounter}`,
      source,
      target,
      label,
      style: {
        stroke: isLeadingEdge ? c.edgeActive : c.edgeExecuted,
        strokeWidth: 3.5,
      },
      labelStyle: { fontSize: 10, fontWeight: 600, fill: c.labelExecuted },
      animated: !!isLeadingEdge,
      zIndex: 1,
    });
  } else {
    // Non-executed — thin, faded base map edge
    state.edges.push({
      id: `se${state.edgeCounter}`,
      source,
      target,
      label,
      style: {
        stroke: c.edgeDefault,
        strokeWidth: 1.5,
        opacity: o ? 0.3 : 1,
      },
      labelStyle: { fontSize: 10, fill: c.labelDefault },
    });
  }
}

function walk(
  node: SpecNode,
  state: LayoutState,
  x: number,
  y: number
): { lastIds: string[]; bottomY: number } {
  const id = nid(node);

  if (state.seen.has(id)) {
    return { lastIds: [id], bottomY: y };
  }
  state.seen.add(id);

  const isDecider = node.type === "decider" || node.hasDecider;
  const isFork = node.type === "fork";
  const o = state.overlay;

  const isDone = o ? o.doneStages.has(id) : false;
  const isActive = o ? o.activeStage === id : false;
  const wasExecuted = o ? o.executedStages.has(id) : false;
  // When overlay is present, dim unvisited nodes
  const dimmed = o && !wasExecuted;

  // Step number for executed nodes (1-based)
  const stepNumber =
    o?.executionOrder ? o.executionOrder.indexOf(id) + 1 || undefined : undefined;

  state.nodes.push({
    id,
    position: { x, y },
    data: {
      label: node.name,
      active: isActive,
      done: isDone,
      error: false,
      isDecider,
      isFork,
      description: node.description,
      dimmed,
      stepNumber,
    },
    type: "stage",
    style: dimmed ? { opacity: 0.35 } : undefined,
  });

  let lastIds = [id];
  let bottomY = y;

  // Handle children (fork/decider branches)
  if (node.children && node.children.length > 0) {
    const totalWidth = (node.children.length - 1) * X_SPREAD;
    const startX = x - totalWidth / 2;
    const childY = y + Y_STEP;

    const childResults: { lastIds: string[]; bottomY: number }[] = [];

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childX = startX + i * X_SPREAD;
      const edgeLabel = node.branchIds?.[i];
      addEdge(state, id, nid(child), edgeLabel);
      const result = walk(child, state, childX, childY);
      childResults.push(result);
    }

    lastIds = childResults.flatMap((r) => r.lastIds);
    bottomY = Math.max(...childResults.map((r) => r.bottomY));
  }

  // Handle linear continuation
  if (node.next) {
    const nextY = bottomY + Y_STEP;
    const nextId = nid(node.next);
    for (const lid of lastIds) {
      addEdge(state, lid, nextId);
    }
    const result = walk(node.next, state, x, nextY);
    return result;
  }

  // Handle loop-back edge
  if (node.loopTarget) {
    addEdge(state, id, node.loopTarget, "loop");
  }

  return { lastIds, bottomY };
}

/**
 * Convert a pipeline spec to ReactFlow graph.
 * Pass `overlay` to color nodes/edges by execution state.
 */
export function specToReactFlow(
  spec: SpecNode,
  overlay?: ExecutionOverlay,
  colors?: Partial<FlowchartColors>
): {
  nodes: Node[];
  edges: Edge[];
} {
  const state: LayoutState = {
    nodes: [],
    edges: [],
    edgeCounter: 0,
    seen: new Set(),
    overlay: overlay ?? null,
    colors: { ...DEFAULT_COLORS, ...colors },
  };

  walk(spec, state, 300, 0);

  return { nodes: state.nodes, edges: state.edges };
}
