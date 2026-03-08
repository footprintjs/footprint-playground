import { motion, AnimatePresence } from "framer-motion";

interface MemoryTimelineProps {
  memory: Record<string, unknown>;
  narrative?: string;
}

export function MemoryTimeline({
  memory,
  narrative,
}: MemoryTimelineProps) {
  const entries = Object.entries(memory);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 16,
        overflow: "auto",
      }}
    >
      {/* Narrative */}
      {narrative && (
        <motion.div
          key={narrative}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: "var(--phase-execute-dim)",
            border: "1px solid var(--phase-execute-border)",
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--text-secondary)",
            whiteSpace: "pre-wrap",
            borderLeft: "3px solid var(--phase-execute)",
          }}
        >
          {narrative}
        </motion.div>
      )}

      {/* Memory cards */}
      <div>
        <h3
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}
        >
          Scope
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {entries.length === 0 ? (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {"{ } // empty — waiting for first stage"}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {entries.map(([key, value], idx) => {
                const isNew = idx === entries.length - 1;
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: 20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, delay: isNew ? 0.1 : 0 }}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      background: isNew
                        ? "var(--phase-execute-dim)"
                        : "var(--bg-secondary)",
                      border: `1px solid ${isNew ? "var(--phase-execute-border)" : "var(--border)"}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      overflow: "hidden",
                    }}
                  >
                    <span style={{ color: "var(--accent-light)", fontWeight: 500 }}>
                      {key}
                    </span>
                    <span
                      style={{
                        color: "var(--success)",
                        textAlign: "right",
                        wordBreak: "break-all",
                      }}
                    >
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
