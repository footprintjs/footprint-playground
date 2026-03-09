import { useCallback } from "react";
import { motion } from "framer-motion";
import type { StageSnapshot } from "../tutorials/types";

interface MobileObserveLayoutProps {
  /** Data panel (memory + narrative) */
  data: React.ReactNode;
  /** Flowchart panel */
  chart: React.ReactNode;
  /** Stage snapshots for the scrubber */
  snapshots?: StageSnapshot[];
  /** Currently selected snapshot index */
  selectedIndex: number;
  /** Callback when user selects a snapshot */
  onSelectIndex: (idx: number) => void;
}

/**
 * Observe phase mobile layout:
 * - Data panel on top (45%)
 * - Horizontal snapshot timeline scrubber in the middle
 * - Flowchart on bottom (45%)
 * Both panels update simultaneously when scrubbing.
 */
export function MobileObserveLayout({
  data,
  chart,
  snapshots,
  selectedIndex,
  onSelectIndex,
}: MobileObserveLayoutProps) {
  if (!snapshots || snapshots.length === 0) {
    // No snapshots — just show chart and data stacked
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflow: "hidden" }}>{data}</div>
        <div style={{ height: 1, background: "var(--border)" }} />
        <div style={{ flex: 1, overflow: "hidden" }}>{chart}</div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Data panel (top) */}
      <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
        {data}
      </div>

      {/* Snapshot timeline scrubber */}
      <TimelineScrubber
        snapshots={snapshots}
        selectedIndex={selectedIndex}
        onSelectIndex={onSelectIndex}
      />

      {/* Chart panel (bottom) */}
      <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
        {chart}
      </div>
    </div>
  );
}

function TimelineScrubber({
  snapshots,
  selectedIndex,
  onSelectIndex,
}: {
  snapshots: StageSnapshot[];
  selectedIndex: number;
  onSelectIndex: (idx: number) => void;
}) {
  const handleTap = useCallback(
    (idx: number) => onSelectIndex(idx),
    [onSelectIndex]
  );

  return (
    <div
      style={{
        padding: "8px 16px",
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      {/* Label */}
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
            fontSize: 10,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Time-Travel
        </span>
        <span
          style={{
            fontSize: 10,
            color: "var(--phase-observe)",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
          }}
        >
          {snapshots[selectedIndex]?.stageLabel}
        </span>
      </div>

      {/* Dot track */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          position: "relative",
        }}
      >
        {/* Connecting line */}
        <div
          style={{
            position: "absolute",
            left: snapshots.length > 1 ? `${100 / (snapshots.length * 2)}%` : "50%",
            right: snapshots.length > 1 ? `${100 / (snapshots.length * 2)}%` : "50%",
            height: 2,
            background: "var(--bg-tertiary)",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
        {/* Progress fill */}
        <div
          style={{
            position: "absolute",
            left: snapshots.length > 1 ? `${100 / (snapshots.length * 2)}%` : "50%",
            width:
              snapshots.length > 1
                ? `${(selectedIndex / (snapshots.length - 1)) * (1 - 1 / snapshots.length) * 100}%`
                : "0%",
            height: 2,
            background: "var(--phase-observe)",
            top: "50%",
            transform: "translateY(-50%)",
            transition: "width 0.2s ease",
          }}
        />

        {/* Dots */}
        {snapshots.map((snap, idx) => {
          const isSelected = idx === selectedIndex;
          const isPast = idx < selectedIndex;

          return (
            <button
              key={snap.stageName}
              onClick={() => handleTap(idx)}
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "none",
                border: "none",
                padding: "8px 0",
                cursor: "pointer",
                position: "relative",
                zIndex: 1,
                minHeight: 36,
              }}
            >
              <motion.div
                animate={{
                  scale: isSelected ? 1.3 : 1,
                  background: isSelected
                    ? "var(--phase-observe)"
                    : isPast
                      ? "var(--success)"
                      : "var(--bg-tertiary)",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: isSelected
                    ? "2px solid var(--phase-observe)"
                    : "2px solid transparent",
                  boxShadow: isSelected ? "0 0 8px rgba(34, 197, 94, 0.4)" : "none",
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Stage labels below dots */}
      <div style={{ display: "flex", marginTop: 2 }}>
        {snapshots.map((snap, idx) => (
          <div
            key={snap.stageName}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 8,
              color: idx === selectedIndex ? "var(--phase-observe)" : "var(--text-muted)",
              fontWeight: idx === selectedIndex ? 600 : 400,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              padding: "0 2px",
            }}
          >
            {snap.stageLabel}
          </div>
        ))}
      </div>
    </div>
  );
}
