import { useState } from "react";
import { motion } from "framer-motion";
import type { Node, Edge } from "@xyflow/react";
import type { StageSnapshot } from "../tutorials/types";
import { ObserveFlowchart } from "./ObserveFlowchart";
import { useIsMobile } from "../hooks/useIsMobile";

interface ObservePanelProps {
  nodes: Node[];
  edges: Edge[];
  snapshots: StageSnapshot[];
  /** Currently selected stage from parent (for observe slider sync) */
  selectedIndex?: number;
  onSelectIndex?: (idx: number) => void;
}

/**
 * Right panel during Observe phase: time-travel controls + flowchart + gantt.
 * The slider/flowchart/gantt all stay on the right; the left panel shows data.
 */
export function ObservePanel({
  nodes,
  edges,
  snapshots,
  selectedIndex: externalIdx,
  onSelectIndex,
}: ObservePanelProps) {
  const isMobile = useIsMobile();
  const [internalIdx, setInternalIdx] = useState(0);
  const selectedIdx = externalIdx ?? internalIdx;
  const handleSelect = (idx: number) => {
    setInternalIdx(idx);
    onSelectIndex?.(idx);
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Time-Travel slider (sticky top) */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: isMobile ? 12 : 14, fontWeight: 600, color: "var(--text-primary)" }}>
            Time-Travel Debugger
          </span>
          {!isMobile && (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Scrub to replay execution
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => handleSelect(Math.max(0, selectedIdx - 1))}
            disabled={selectedIdx === 0}
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              color: selectedIdx === 0 ? "var(--text-muted)" : "var(--text-primary)",
              borderRadius: 6,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: selectedIdx === 0 ? "not-allowed" : "pointer",
              opacity: selectedIdx === 0 ? 0.5 : 1,
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            {"\u25C0"}
          </button>
          <input
            type="range"
            min={0}
            max={snapshots.length - 1}
            value={selectedIdx}
            onChange={(e) => handleSelect(parseInt(e.target.value))}
            style={{
              flex: 1,
              height: 4,
              accentColor: "var(--phase-observe)",
              cursor: "pointer",
            }}
          />
          <button
            onClick={() => handleSelect(Math.min(snapshots.length - 1, selectedIdx + 1))}
            disabled={selectedIdx === snapshots.length - 1}
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              color: selectedIdx === snapshots.length - 1 ? "var(--text-muted)" : "var(--text-primary)",
              borderRadius: 6,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: selectedIdx === snapshots.length - 1 ? "not-allowed" : "pointer",
              opacity: selectedIdx === snapshots.length - 1 ? 0.5 : 1,
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            {"\u25B6"}
          </button>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              flexShrink: 0,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {selectedIdx + 1}/{snapshots.length}
          </span>
        </div>
      </div>

      {/* Flowchart (main area) */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <ObserveFlowchart
          nodes={nodes}
          edges={edges}
          snapshots={snapshots}
          selectedIndex={selectedIdx}
          onSelectIndex={handleSelect}
        />
      </div>

      {/* Gantt chart (bottom) */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          flexShrink: 0,
        }}
      >
        <GanttChart
          snapshots={snapshots}
          selectedIdx={selectedIdx}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}

function GanttChart({
  snapshots,
  selectedIdx,
  onSelect,
}: {
  snapshots: StageSnapshot[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
}) {
  const isMobile = useIsMobile();
  const totalWallTime = Math.max(
    ...snapshots.map((s) => s.startMs + s.durationMs)
  );
  const labelWidth = isMobile ? 50 : 80;
  const msWidth = isMobile ? 28 : 36;

  return (
    <div>
      <span
        style={{
          fontSize: isMobile ? 10 : 11,
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {isMobile ? "Timeline" : "Execution Timeline"}
      </span>
      <div
        style={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {snapshots.map((snap, idx) => {
          const leftPct = (snap.startMs / totalWallTime) * 100;
          const widthPct = (snap.durationMs / totalWallTime) * 100;
          const isSelected = idx === selectedIdx;
          const isVisible = idx <= selectedIdx;

          return (
            <div
              key={snap.stageName}
              onClick={() => onSelect(idx)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 4 : 8,
                cursor: "pointer",
                opacity: isVisible ? 1 : 0.3,
                transition: "opacity 0.3s ease",
              }}
            >
              <span
                style={{
                  width: labelWidth,
                  fontSize: isMobile ? 9 : 10,
                  color: isSelected
                    ? "var(--phase-observe)"
                    : "var(--text-muted)",
                  fontWeight: isSelected ? 600 : 400,
                  textAlign: "right",
                  flexShrink: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {snap.stageLabel}
              </span>
              <div
                style={{
                  flex: 1,
                  height: isMobile ? 6 : 8,
                  position: "relative",
                  background: "var(--bg-tertiary)",
                  borderRadius: 3,
                }}
              >
                {isVisible && (
                  <motion.div
                    initial={idx === selectedIdx ? { width: 0 } : false}
                    animate={{
                      width: `${widthPct}%`,
                    }}
                    transition={
                      idx === selectedIdx
                        ? { duration: 0.4, ease: "easeOut" }
                        : { duration: 0 }
                    }
                    style={{
                      position: "absolute",
                      left: `${leftPct}%`,
                      top: 0,
                      height: "100%",
                      borderRadius: 3,
                      background: isSelected
                        ? "var(--phase-observe)"
                        : "var(--success)",
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: isMobile ? 9 : 10,
                  color: "var(--text-muted)",
                  fontFamily: "'JetBrains Mono', monospace",
                  width: msWidth,
                  flexShrink: 0,
                }}
              >
                {snap.durationMs}ms
              </span>
            </div>
          );
        })}
      </div>

      {/* Time axis */}
      <div
        style={{
          marginTop: 4,
          marginLeft: labelWidth + (isMobile ? 4 : 8),
          marginRight: msWidth + (isMobile ? 4 : 8),
          display: "flex",
          justifyContent: "space-between",
          fontSize: isMobile ? 8 : 9,
          color: "var(--text-muted)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <span>0ms</span>
        {!isMobile && <span>{(totalWallTime / 2).toFixed(1)}ms</span>}
        <span>{totalWallTime.toFixed(1)}ms</span>
      </div>
    </div>
  );
}
