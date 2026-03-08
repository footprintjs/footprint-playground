import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StageSnapshot } from "../tutorials/types";

interface ObserveDataPanelProps {
  snapshots: StageSnapshot[];
  selectedIndex: number;
}

/**
 * Left panel during Observe phase: shows accumulated JSON state + narrative log,
 * synced to the time-travel slider. This is the data that was "collected" during execute.
 */
export function ObserveDataPanel({ snapshots, selectedIndex }: ObserveDataPanelProps) {
  // Accumulated memory up to current index
  const accumulatedMemory = useMemo(() => {
    const merged: Record<string, unknown> = {};
    for (let i = 0; i <= selectedIndex; i++) {
      Object.assign(merged, snapshots[i]?.memory);
    }
    return merged;
  }, [snapshots, selectedIndex]);

  // Keys that are new at the current step
  const newKeys = useMemo(() => {
    if (selectedIndex === 0) return new Set(Object.keys(snapshots[0]?.memory ?? {}));
    const prev: Record<string, unknown> = {};
    for (let i = 0; i < selectedIndex; i++) {
      Object.assign(prev, snapshots[i]?.memory);
    }
    const current = snapshots[selectedIndex]?.memory ?? {};
    return new Set(Object.keys(current).filter((k) => !(k in prev)));
  }, [snapshots, selectedIndex]);

  // Accumulated narrative entries
  const narrativeEntries = useMemo(() => {
    return snapshots.slice(0, selectedIndex + 1).map((s, i) => ({
      label: s.stageLabel,
      narrative: s.narrative,
      isCurrent: i === selectedIndex,
    }));
  }, [snapshots, selectedIndex]);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Growing JSON state */}
      <div
        style={{
          flex: 1,
          padding: "16px",
          overflow: "auto",
          borderBottom: "1px solid var(--border)",
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
          Memory State
        </span>
        <div
          style={{
            marginTop: 8,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "12px 16px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            lineHeight: 1.8,
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>{"{"}</span>
          <AnimatePresence mode="popLayout">
            {Object.entries(accumulatedMemory).map(([key, value], i) => {
              const isNew = newKeys.has(key);
              const isLast = i === Object.keys(accumulatedMemory).length - 1;
              return (
                <motion.div
                  key={key}
                  initial={isNew ? { opacity: 0, height: 0 } : false}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                  style={{
                    paddingLeft: 16,
                    background: isNew ? "var(--phase-observe-dim)" : "transparent",
                    borderRadius: 4,
                    marginLeft: -4,
                    marginRight: -4,
                    paddingRight: 4,
                  }}
                >
                  <span style={{ color: "var(--accent-light)" }}>"{key}"</span>
                  <span style={{ color: "var(--text-muted)" }}>: </span>
                  <span style={{ color: "var(--success)" }}>
                    {typeof value === "string"
                      ? `"${value}"`
                      : typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                  </span>
                  {!isLast && <span style={{ color: "var(--text-muted)" }}>,</span>}
                </motion.div>
              );
            })}
          </AnimatePresence>
          <span style={{ color: "var(--text-muted)" }}>{"}"}</span>
        </div>
      </div>

      {/* Accumulating narrative log */}
      <div
        style={{
          flex: 1,
          padding: "16px",
          overflow: "auto",
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
          Execution Log
        </span>
        <div
          style={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {narrativeEntries.map((entry, i) => (
            <motion.div
              key={i}
              initial={entry.isCurrent ? { opacity: 0, x: -8 } : false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                display: "flex",
                gap: 10,
                padding: "8px 0",
                borderBottom:
                  i < narrativeEntries.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              {/* Timeline dot + line */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 12,
                  flexShrink: 0,
                  paddingTop: 5,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: entry.isCurrent
                      ? "var(--phase-observe)"
                      : "var(--success)",
                    flexShrink: 0,
                  }}
                />
                {i < narrativeEntries.length - 1 && (
                  <div
                    style={{
                      width: 1,
                      flex: 1,
                      background: "var(--border)",
                      marginTop: 4,
                    }}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: entry.isCurrent
                      ? "var(--phase-observe)"
                      : "var(--text-muted)",
                  }}
                >
                  {entry.label}
                </span>
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: entry.isCurrent
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    marginTop: 2,
                  }}
                >
                  {entry.narrative}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
