import { useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
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

function FlowchartInner({ nodes, edges }: FlowchartPanelProps) {
  const { fitView } = useReactFlow();

  // Re-fit whenever nodes change
  useEffect(() => {
    // Small delay so React Flow measures the new nodes first
    const t = setTimeout(() => fitView({ padding: 0.3, duration: 300 }), 50);
    return () => clearTimeout(t);
  }, [nodes, fitView]);

  return (
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
      minZoom={0.2}
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
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
        }}
      />
    </ReactFlow>
  );
}

export function FlowchartPanel({ nodes, edges }: FlowchartPanelProps) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlowProvider>
        <FlowchartInner nodes={nodes} edges={edges} />
      </ReactFlowProvider>
    </div>
  );
}
