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
  /** Node to highlight with a pulse ring (build phase: code-to-node link) */
  linkedNodeId?: string;
}

function FlowchartInner({ nodes, edges, linkedNodeId }: FlowchartPanelProps) {
  const { fitView } = useReactFlow();

  // Inject linked highlight into node data
  const enhancedNodes = nodes.map((n) => ({
    ...n,
    data: { ...n.data, linked: n.id === linkedNodeId },
  }));

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.3, duration: 300 }), 50);
    return () => clearTimeout(t);
  }, [nodes, fitView]);

  return (
    <ReactFlow
      nodes={enhancedNodes}
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

export function FlowchartPanel({ nodes, edges, linkedNodeId }: FlowchartPanelProps) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlowProvider>
        <FlowchartInner nodes={nodes} edges={edges} linkedNodeId={linkedNodeId} />
      </ReactFlowProvider>
    </div>
  );
}
