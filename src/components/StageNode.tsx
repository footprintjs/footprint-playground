import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";

interface StageNodeData {
  label: string;
  active: boolean;
  done: boolean;
  error: boolean;
}

export function StageNodeComponent({ data }: { data: StageNodeData }) {
  const bgColor = data.error
    ? "var(--node-error)"
    : data.active
      ? "var(--node-active)"
      : data.done
        ? "var(--node-done)"
        : "var(--node-bg)";

  const borderColor = data.error
    ? "var(--error)"
    : data.active
      ? "var(--accent-light)"
      : data.done
        ? "var(--success)"
        : "var(--border)";

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{
        background: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: 12,
        padding: "12px 24px",
        color: "var(--text-primary)",
        fontSize: 14,
        fontWeight: 500,
        minWidth: 140,
        textAlign: "center",
        boxShadow: data.active
          ? "0 0 20px rgba(99, 102, 241, 0.4)"
          : data.done
            ? "0 0 12px rgba(34, 197, 94, 0.2)"
            : "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: borderColor, border: "none", width: 8, height: 8 }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
        {data.done && <span style={{ color: "var(--success)" }}>&#10003;</span>}
        {data.active && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            style={{ color: "var(--accent-light)" }}
          >
            &#9679;
          </motion.span>
        )}
        {data.error && <span style={{ color: "var(--error)" }}>&#10007;</span>}
        {data.label}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: borderColor, border: "none", width: 8, height: 8 }}
      />
    </motion.div>
  );
}
