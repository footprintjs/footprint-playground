import { motion } from "framer-motion";
import type { TutorialPhase } from "../tutorials/types";

interface StepControlsProps {
  currentStep: number;
  totalSteps: number;
  phase: TutorialPhase;
  title: string;
  description: string;
  isPlaying: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
}

const phaseLabels: Record<TutorialPhase, string> = {
  build: "Build Time",
  execute: "Execution",
  observe: "Observability",
};

const phaseColors: Record<TutorialPhase, string> = {
  build: "var(--accent)",
  execute: "var(--warning)",
  observe: "var(--success)",
};

export function StepControls({
  currentStep,
  totalSteps,
  phase,
  title,
  description,
  isPlaying,
  onPrev,
  onNext,
  onTogglePlay,
}: StepControlsProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: "20px 24px",
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {/* Phase indicator + step info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            background: phaseColors[phase],
            color: "white",
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 4,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {phaseLabels[phase]}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
            {title}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            {description}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 4,
          background: "var(--bg-tertiary)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <motion.div
          animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
          style={{
            height: "100%",
            background: phaseColors[phase],
            borderRadius: 2,
          }}
        />
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {currentStep + 1} / {totalSteps}
        </span>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onPrev}
            disabled={currentStep === 0}
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              color: currentStep === 0 ? "var(--text-muted)" : "var(--text-primary)",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              cursor: currentStep === 0 ? "not-allowed" : "pointer",
              opacity: currentStep === 0 ? 0.5 : 1,
            }}
          >
            Prev
          </button>

          {phase === "execute" && (
            <button
              onClick={onTogglePlay}
              style={{
                background: isPlaying ? "var(--error)" : phaseColors[phase],
                border: "none",
                color: "white",
                borderRadius: 8,
                padding: "8px 20px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                minWidth: 80,
              }}
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
          )}

          <button
            onClick={onNext}
            disabled={currentStep === totalSteps - 1}
            style={{
              background:
                currentStep === totalSteps - 1
                  ? "var(--bg-tertiary)"
                  : phaseColors[phase],
              border: "1px solid transparent",
              color:
                currentStep === totalSteps - 1
                  ? "var(--text-muted)"
                  : "white",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor:
                currentStep === totalSteps - 1 ? "not-allowed" : "pointer",
              opacity: currentStep === totalSteps - 1 ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
