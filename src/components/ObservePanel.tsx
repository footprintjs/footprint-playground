import { useState } from "react";
import { motion } from "framer-motion";
import type { StageSnapshot } from "../tutorials/types";

interface ObservePanelProps {
  snapshots: StageSnapshot[];
  /** Currently selected stage from parent (for observe slider sync) */
  selectedIndex?: number;
  onSelectIndex?: (idx: number) => void;
}

export function ObservePanel({
  snapshots,
  selectedIndex: externalIdx,
  onSelectIndex,
}: ObservePanelProps) {
  const [internalIdx, setInternalIdx] = useState(0);
  const selectedIdx = externalIdx ?? internalIdx;
  const selected = snapshots[selectedIdx];
  const totalMs = snapshots.reduce((a, s) => a + s.durationMs, 0);

  const handleSelect = (idx: number) => {
    setInternalIdx(idx);
    onSelectIndex?.(idx);
  };

  if (!selected) return null;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 16,
        gap: 16,
        overflow: "auto",
      }}
    >
      {/* Timeline bar */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Execution Timeline
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Total: {totalMs.toFixed(1)}ms
          </span>
        </div>

        {/* Horizontal stage buttons */}
        <div
          style={{
            display: "flex",
            gap: 2,
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {snapshots.map((snap, idx) => {
            const isSelected = idx === selectedIdx;
            const widthPct = (snap.durationMs / totalMs) * 100;
            return (
              <motion.button
                key={snap.stageName}
                onClick={() => handleSelect(idx)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  flex: `0 0 ${Math.max(widthPct, 10)}%`,
                  padding: "8px 4px",
                  background: isSelected
                    ? "var(--phase-observe)"
                    : "var(--bg-tertiary)",
                  border: "none",
                  color: isSelected ? "#000" : "var(--text-secondary)",
                  fontSize: 10,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s ease",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {snap.stageLabel}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected stage detail */}
      <motion.div
        key={selectedIdx}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        {/* Stage header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--phase-observe)",
              }}
            />
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
              {selected.stageLabel}
            </span>
          </div>
          <span
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {selected.durationMs}ms
          </span>
        </div>

        {/* Narrative */}
        <div
          style={{
            background: "var(--phase-observe-dim)",
            border: "1px solid var(--phase-observe-border)",
            borderLeft: "3px solid var(--phase-observe)",
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--text-secondary)",
          }}
        >
          {selected.narrative}
        </div>

        {/* Memory snapshot */}
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Memory at this point
          </span>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {Object.entries(selected.memory).map(([key, value]) => (
              <div
                key={key}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                }}
              >
                <span style={{ color: "var(--accent-light)" }}>{key}</span>
                <span style={{ color: "var(--success)" }}>
                  {typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics mini-chart */}
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Stage Metrics
          </span>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            {snapshots.map((snap, idx) => (
              <div
                key={snap.stageName}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 100,
                    fontSize: 11,
                    color:
                      idx === selectedIdx
                        ? "var(--phase-observe)"
                        : "var(--text-muted)",
                    fontWeight: idx === selectedIdx ? 600 : 400,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {snap.stageLabel}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: "var(--bg-tertiary)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(snap.durationMs / Math.max(...snapshots.map((s) => s.durationMs))) * 100}%`,
                    }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                    style={{
                      height: "100%",
                      borderRadius: 3,
                      background:
                        idx === selectedIdx
                          ? "var(--phase-observe)"
                          : "var(--text-muted)",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    fontFamily: "'JetBrains Mono', monospace",
                    width: 40,
                    flexShrink: 0,
                  }}
                >
                  {snap.durationMs}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
