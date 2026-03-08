import { motion, AnimatePresence } from "framer-motion";

interface ExecuteDataPanelProps {
  memory: Record<string, unknown>;
  narrative?: string;
}

/**
 * Right panel during Execute phase: shows JSON growing + narrative building up.
 * Gives the user a live view of data being collected as stages run.
 */
export function ExecuteDataPanel({ memory, narrative }: ExecuteDataPanelProps) {
  const entries = Object.entries(memory);
  const hasData = entries.length > 0;

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
          {!hasData && (
            <div style={{ paddingLeft: 16, color: "var(--text-muted)", fontStyle: "italic" }}>
              // waiting for first stage...
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {entries.map(([key, value], i) => {
              const isLast = i === entries.length - 1;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  style={{
                    paddingLeft: 16,
                    background: isLast ? "var(--phase-execute-dim)" : "transparent",
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
                  {i < entries.length - 1 && (
                    <span style={{ color: "var(--text-muted)" }}>,</span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          <span style={{ color: "var(--text-muted)" }}>{"}"}</span>
        </div>
      </div>

      {/* Narrative building up */}
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
        <div style={{ marginTop: 8 }}>
          {!narrative ? (
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontStyle: "italic",
              }}
            >
              Waiting for execution to start...
            </div>
          ) : (
            <motion.div
              key={narrative}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                background: "var(--phase-execute-dim)",
                border: "1px solid var(--phase-execute-border)",
                borderLeft: "3px solid var(--phase-execute)",
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 13,
                lineHeight: 1.6,
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
              }}
            >
              {narrative}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
