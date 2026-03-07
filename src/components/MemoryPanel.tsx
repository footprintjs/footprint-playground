import { motion, AnimatePresence } from "framer-motion";

interface MemoryPanelProps {
  memory: Record<string, unknown>;
  narrative?: string;
}

export function MemoryPanel({ memory, narrative }: MemoryPanelProps) {
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
      {/* Memory State */}
      <div>
        <h3
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 12,
          }}
        >
          Memory State
        </h3>
        <div
          style={{
            background: "var(--bg-secondary)",
            borderRadius: 8,
            border: "1px solid var(--border)",
            padding: 16,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
          }}
        >
          {entries.length === 0 ? (
            <span style={{ color: "var(--text-muted)" }}>
              {"{ }  // empty"}
            </span>
          ) : (
            <AnimatePresence mode="popLayout">
              {entries.map(([key, value]) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 4,
                    overflow: "hidden",
                  }}
                >
                  <span style={{ color: "var(--accent-light)" }}>{key}:</span>
                  <span style={{ color: "var(--success)" }}>
                    {typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Narrative */}
      {narrative && (
        <div>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 12,
            }}
          >
            Narrative
          </h3>
          <motion.div
            key={narrative}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: "var(--bg-secondary)",
              borderRadius: 8,
              border: "1px solid var(--border)",
              padding: 16,
              fontSize: 13,
              lineHeight: 1.6,
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
            }}
          >
            {narrative}
          </motion.div>
        </div>
      )}
    </div>
  );
}
