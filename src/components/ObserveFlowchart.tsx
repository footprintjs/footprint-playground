import { useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Node, Edge } from "@xyflow/react";
import type { StageSnapshot } from "../tutorials/types";
import { StageNode } from "footprint-explainable-ui/flowchart";

const nodeTypes = { stage: StageNode };

interface ObserveFlowchartProps {
  /** All nodes in the completed flowchart (positions/edges) */
  nodes: Node[];
  edges: Edge[];
  /** Per-stage snapshots from the execution trace */
  snapshots: StageSnapshot[];
  /** Which snapshot is currently selected (controlled by slider/click) */
  selectedIndex: number;
  /** Callback when a node is clicked in the flowchart */
  onSelectIndex?: (idx: number) => void;
}

function ObserveFlowchartInner({
  nodes,
  edges,
  snapshots,
  selectedIndex,
  onSelectIndex,
}: ObserveFlowchartProps) {
  const { fitView } = useReactFlow();

  // Build a set of "done" stage names (all stages up to selectedIndex)
  // and the "active" stage name (the one at selectedIndex)
  const activeStage = snapshots[selectedIndex]?.stageName;
  const doneStages = new Set(
    snapshots.slice(0, selectedIndex).map((s) => s.stageName)
  );

  // Map snapshot stageNames to node indices for click handling
  const stageToSnapshotIdx = new Map(
    snapshots.map((s, i) => [s.stageName, i])
  );

  const enhancedNodes = nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      active: n.id === activeStage,
      done: doneStages.has(n.id),
      // dim nodes that haven't been reached yet
      linked: false,
    },
  }));

  const enhancedEdges = edges.map((e) => ({
    ...e,
    style: {
      ...e.style,
      stroke: doneStages.has(e.source) ? "#22c55e" : "#94a3b8",
      strokeWidth: 2,
    },
    animated: e.source === activeStage,
  }));

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.3, duration: 300 }), 50);
    return () => clearTimeout(t);
  }, [nodes, fitView]);

  return (
    <ReactFlow
      nodes={enhancedNodes}
      edges={enhancedEdges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      proOptions={{ hideAttribution: true }}
      minZoom={0.2}
      maxZoom={1.5}
      onNodeClick={(_event, node) => {
        const idx = stageToSnapshotIdx.get(node.id);
        if (idx !== undefined) {
          onSelectIndex?.(idx);
        }
      }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="var(--bg-tertiary)"
      />
    </ReactFlow>
  );
}

export function ObserveFlowchart(props: ObserveFlowchartProps) {
  return (
    <div style={{ width: "100%", height: "100%", cursor: "pointer" }}>
      <ReactFlowProvider>
        <ObserveFlowchartInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
