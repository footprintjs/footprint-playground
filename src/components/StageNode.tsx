import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";

interface StageNodeData {
  label: string;
  active: boolean;
  done: boolean;
  error: boolean;
  linked?: boolean;
  dimmed?: boolean;
  stepNumber?: number;
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

  const isOnPath = data.active || data.done;

  return (
    <div style={{ position: "relative" }}>
      {/* Step number badge — Google Maps waypoint marker */}
      {data.stepNumber != null && isOnPath && (
        <div
          style={{
            position: "absolute",
            top: -10,
            left: -10,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: data.active ? "var(--accent)" : "var(--success)",
            color: "white",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            boxShadow: `0 0 8px ${data.active ? "rgba(99, 102, 241, 0.5)" : "rgba(34, 197, 94, 0.4)"}`,
          }}
        >
          {data.stepNumber}
        </div>
      )}

      {/* Linked pulse ring — code-to-node visual link */}
      {data.linked && (
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: -8,
            borderRadius: 20,
            border: "2px solid var(--accent-light)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Active node pulse ring — like GPS "you are here" */}
      {data.active && (
        <motion.div
          animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: 16,
            border: "2px solid var(--accent-light)",
            pointerEvents: "none",
          }}
        />
      )}

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{
          background: bgColor,
          border: `2px solid ${borderColor}`,
          borderRadius: 12,
          padding: "12px 24px",
          color: isOnPath || data.error ? "white" : "var(--node-text)",
          fontSize: 14,
          fontWeight: 500,
          minWidth: 140,
          textAlign: "center",
          boxShadow: data.active
            ? "0 0 24px rgba(99, 102, 241, 0.5), 0 0 8px rgba(99, 102, 241, 0.3)"
            : data.done
              ? "0 0 16px rgba(34, 197, 94, 0.3), 0 0 4px rgba(34, 197, 94, 0.2)"
              : data.linked
                ? "0 0 16px rgba(99, 102, 241, 0.3)"
                : "0 2px 8px var(--shadow-node)",
        }}
      >
        <Handle
          id="target"
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
          id="source"
          type="source"
          position={Position.Bottom}
          style={{ background: borderColor, border: "none", width: 8, height: 8 }}
        />
      </motion.div>
    </div>
  );
}
