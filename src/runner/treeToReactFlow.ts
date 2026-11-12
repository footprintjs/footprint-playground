import type { Node, Edge } from "@xyflow/react";
import { executionStages, stageBranches, type ExecutionStage } from "./executionStages";

interface LayoutState {
  nodes: Node[];
  edges: Edge[];
  nextY: number;
  edgeCounter: number;
  seenNodeIds: Set<string>;
}

const X_CENTER = 250;
const Y_STEP = 120;
const X_FORK_SPREAD = 180;

// In footprint's snapshot, `id` is the runId (shared across all stages)
// and `name` is the unique stage name. Use name as the ReactFlow node key.
function nodeKey(node: ExecutionStage): string {
  return node.name || node.id || `node-${Math.random()}`;
}

/** Lays out a run's execution tree (either shape — see executionStages.ts) as a top-down flow. */
export function executionTreeToReactFlow(tree: unknown): {
  nodes: Node[];
  edges: Edge[];
} {
  const state: LayoutState = {
    nodes: [],
    edges: [],
    nextY: 0,
    edgeCounter: 0,
    seenNodeIds: new Set(),
  };
  walkStages(executionStages(tree), state, X_CENTER);
  return { nodes: state.nodes, edges: state.edges };
}

function addEdge(state: LayoutState, source: string, target: string) {
  state.edgeCounter++;
  state.edges.push({
    id: `e${state.edgeCounter}`,
    source,
    target,
    style: { stroke: "#94a3b8", strokeWidth: 2 },
  });
}

type WalkResult = { lastIds: string[]; bottomY: number };

/** Walks one list of stages in run order: each stage is linked to the stages that ended the one before it. */
function walkStages(stages: ExecutionStage[], state: LayoutState, x: number): WalkResult {
  let result: WalkResult = { lastIds: [], bottomY: state.nextY };
  for (let i = 0; i < stages.length; i++) {
    if (i > 0) {
      for (const lastId of result.lastIds) addEdge(state, lastId, nodeKey(stages[i]));
    }
    const placed = walkStage(stages[i], state, x);
    result = placed.result;
    // A stage placed earlier ends this list (as the linked walk stopped at a shared continuation).
    if (placed.repeated) return result;
  }
  return result;
}

function walkStage(
  node: ExecutionStage,
  state: LayoutState,
  x: number
): { result: WalkResult; repeated: boolean } {
  const key = nodeKey(node);

  // Skip if we've already placed this node (can happen with shared continuations)
  if (state.seenNodeIds.has(key)) {
    return { result: { lastIds: [key], bottomY: state.nextY }, repeated: true };
  }
  state.seenNodeIds.add(key);

  const y = state.nextY;
  state.nextY += Y_STEP;

  const hasErrors = node.errors && Object.keys(node.errors).length > 0;

  state.nodes.push({
    id: key,
    position: { x, y },
    data: {
      label: node.name || node.id,
      done: true,
      active: false,
      error: hasErrors,
    },
    type: "stage",
  });

  let lastIds = [key];
  let bottomY = y;

  // Fork: branches run in parallel
  const branches = stageBranches(node).filter((branch) => branch.length > 0);
  if (branches.length > 0) {
    const totalWidth = (branches.length - 1) * X_FORK_SPREAD;
    const startX = x - totalWidth / 2;

    const branchResults: WalkResult[] = [];
    const savedY = state.nextY;

    for (let i = 0; i < branches.length; i++) {
      state.nextY = savedY;
      const branchX = startX + i * X_FORK_SPREAD;

      addEdge(state, key, nodeKey(branches[i][0]));

      branchResults.push(walkStages(branches[i], state, branchX));
    }

    lastIds = branchResults.flatMap((r) => r.lastIds);
    bottomY = Math.max(...branchResults.map((r) => r.bottomY));
    state.nextY = bottomY + Y_STEP;
  }

  return { result: { lastIds, bottomY }, repeated: false };
}
