import { motion } from "framer-motion";

interface RunButtonProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export function RunButton({ isPlaying, onTogglePlay }: RunButtonProps) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <motion.button
        onClick={onTogglePlay}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          border: "none",
          background: isPlaying
            ? "var(--error)"
            : "var(--phase-execute)",
          color: isPlaying ? "white" : "#000",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 40,
          boxShadow: isPlaying
            ? "0 0 40px rgba(239, 68, 68, 0.4)"
            : "0 0 40px rgba(245, 158, 11, 0.3)",
          transition: "background 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        {isPlaying ? "\u23F8" : "\u25B6"}
      </motion.button>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {isPlaying ? "Running..." : "Run Pipeline"}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            marginTop: 4,
          }}
        >
          {isPlaying
            ? "Click to pause"
            : "Execute the flowchart and watch it come alive"}
        </div>
      </div>
    </div>
  );
}
