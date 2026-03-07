import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Node, Edge } from "@xyflow/react";
import { StageNodeComponent } from "./StageNode";

const nodeTypes = { stage: StageNodeComponent };

interface FlowchartPanelProps {
  nodes: Node[];
  edges: Edge[];
}

export function FlowchartPanel({ nodes, edges }: FlowchartPanelProps) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--bg-tertiary)"
        />
        <Controls
          showInteractive={false}
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
        />
      </ReactFlow>
    </div>
  );
}
