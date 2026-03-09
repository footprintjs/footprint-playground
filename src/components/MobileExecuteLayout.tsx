import { useMemo } from "react";
import { BottomSheet } from "./BottomSheet";

interface MobileExecuteLayoutProps {
  /** The flowchart visualization (full screen background) */
  chart: React.ReactNode;
  /** The data panel (memory + narrative) — shown in bottom sheet */
  data: React.ReactNode;
  /** The run button — shown centered when no data yet */
  runButton: React.ReactNode;
  /** Current memory state for the peek line */
  memory?: Record<string, unknown>;
  /** Whether execution has started (has data to show) */
  hasData: boolean;
}

/**
 * Execute phase mobile layout:
 * - Flowchart takes full screen
 * - When no data yet: run button overlays center
 * - When data arrives: bottom sheet shows peek of latest memory write,
 *   expandable to full data panel
 */
export function MobileExecuteLayout({
  chart,
  data,
  runButton,
  memory,
  hasData,
}: MobileExecuteLayoutProps) {
  // Build peek line from the last memory entry
  const peekLine = useMemo(() => {
    if (!memory) return null;
    const entries = Object.entries(memory);
    if (entries.length === 0) return null;
    const [key, value] = entries[entries.length - 1];
    const display = typeof value === "string" ? `"${value}"` : JSON.stringify(value);
    return { key, display, total: entries.length };
  }, [memory]);

  if (!hasData) {
    // No data yet — show chart with centered run button overlay
    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <div style={{ width: "100%", height: "100%" }}>{chart}</div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.3)",
          }}
        >
          {runButton}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Chart takes full area */}
      <div style={{ width: "100%", height: "100%" }}>{chart}</div>

      {/* Bottom sheet with data */}
      <BottomSheet
        accentColor="var(--phase-execute)"
        peek={
          peekLine ? (
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Memory
              </span>
              <span style={{ color: "var(--accent-light)" }}>
                {peekLine.key}
              </span>
              <span style={{ color: "var(--text-muted)" }}>:</span>
              <span
                style={{
                  color: "var(--success)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                }}
              >
                {peekLine.display}
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: "var(--text-muted)",
                  flexShrink: 0,
                }}
              >
                {peekLine.total} keys
              </span>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
              Waiting for data...
            </div>
          )
        }
      >
        {data}
      </BottomSheet>
    </div>
  );
}
