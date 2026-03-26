import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import { samples } from "../samples/catalog";

export function EndScreen() {
  const isMobile = useIsMobile();
  const features = [
    { icon: "\u{1F4CB}", label: "Causal Traces", desc: "Every stage writes are captured automatically" },
    { icon: "\u23EA", label: "Time-Travel", desc: "Replay to any point in execution" },
    { icon: "\u{1F4CA}", label: "Metrics", desc: "Per-stage timing out of the box" },
    { icon: "\u{1F916}", label: "LLM-Ready", desc: "Feed the narrative to any LLM" },
  ];

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? 20 : 40,
        gap: isMobile ? 20 : 32,
        textAlign: "center",
        overflow: "auto",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          style={{
            fontSize: isMobile ? 20 : 28,
            fontWeight: 700,
            background: "linear-gradient(135deg, var(--accent), var(--success))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 8,
          }}
        >
          You built it, ran it, and debugged it.
        </div>
        <div style={{ fontSize: isMobile ? 13 : 16, color: "var(--text-secondary)", maxWidth: 500 }}>
          All from a simple flowchart. FootPrint gives you full observability as a byproduct of execution.
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 12,
          maxWidth: 480,
          width: "100%",
        }}
      >
        {features.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            style={{
              padding: "16px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              {f.label}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {f.desc}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{ display: "flex", gap: 12 }}
      >
        <Link
          to={`/samples/${samples[0].id}`}
          style={{
            padding: "12px 28px",
            background: "var(--accent)",
            color: "white",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 16px rgba(124, 108, 240, 0.3)",
          }}
        >
          <span style={{ fontSize: 16 }}>&#9654;</span>
          Try the Samples
        </Link>
        <a
          href="https://footprintjs.github.io/footPrint/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "10px 24px",
            background: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          Read the Docs
        </a>
        <a
          href="https://github.com/footprintjs/footPrint"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "10px 24px",
            background: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          GitHub
        </a>
        <a
          href="https://www.npmjs.com/package/footprintjs"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "10px 24px",
            background: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            border: "1px solid var(--border)",
          }}
        >
          npm install footprintjs
        </a>
      </motion.div>
    </div>
  );
}
