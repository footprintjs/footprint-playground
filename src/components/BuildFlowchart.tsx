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
import { StageNodeComponent } from "./StageNode";

const nodeTypes = { stage: StageNodeComponent };

interface BuildFlowchartProps {
  nodes: Node[];
  edges: Edge[];
  /** Node to highlight with a pulse ring (code-to-node link) */
  linkedNodeId?: string;
}

function BuildFlowchartInner({ nodes, edges, linkedNodeId }: BuildFlowchartProps) {
  const { fitView } = useReactFlow();

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
    </ReactFlow>
  );
}

export function BuildFlowchart(props: BuildFlowchartProps) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlowProvider>
        <BuildFlowchartInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
