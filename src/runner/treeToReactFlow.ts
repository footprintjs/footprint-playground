import type { Node, Edge } from "@xyflow/react";
import type { RuntimeStageNode } from "./executeCode";

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
function nodeKey(node: RuntimeStageNode): string {
  return node.name || node.id || `node-${Math.random()}`;
}

export function executionTreeToReactFlow(tree: RuntimeStageNode): {
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
  walkTree(tree, state, X_CENTER);
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

function walkTree(
  node: RuntimeStageNode,
  state: LayoutState,
  x: number
): { lastIds: string[]; bottomY: number } {
  const key = nodeKey(node);

  // Skip if we've already placed this node (can happen with shared continuations)
  if (state.seenNodeIds.has(key)) {
    return { lastIds: [key], bottomY: state.nextY };
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

  // Fork: children run in parallel
  if (node.children && node.children.length > 0) {
    const totalWidth = (node.children.length - 1) * X_FORK_SPREAD;
    const startX = x - totalWidth / 2;

    const childResults: { lastIds: string[]; bottomY: number }[] = [];
    const savedY = state.nextY;

    for (let i = 0; i < node.children.length; i++) {
      state.nextY = savedY;
      const childX = startX + i * X_FORK_SPREAD;

      addEdge(state, key, nodeKey(node.children[i]));

      const result = walkTree(node.children[i], state, childX);
      childResults.push(result);
    }

    lastIds = childResults.flatMap((r) => r.lastIds);
    bottomY = Math.max(...childResults.map((r) => r.bottomY));
    state.nextY = bottomY + Y_STEP;
  }

  // Linear continuation
  if (node.next) {
    for (const lastId of lastIds) {
      addEdge(state, lastId, nodeKey(node.next));
    }
    const result = walkTree(node.next, state, x);
    return result;
  }

  return { lastIds, bottomY };
}
