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

interface ExecuteFlowchartProps {
  nodes: Node[];
  edges: Edge[];
}

function ExecuteFlowchartInner({ nodes, edges }: ExecuteFlowchartProps) {
  const { fitView } = useReactFlow();

  useEffect(() => {
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
    </ReactFlow>
  );
}

export function ExecuteFlowchart(props: ExecuteFlowchartProps) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlowProvider>
        <ExecuteFlowchartInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
