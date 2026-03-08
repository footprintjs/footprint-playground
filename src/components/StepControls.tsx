import { motion } from "framer-motion";
import type { TutorialPhase } from "../tutorials/types";

interface StepControlsProps {
  currentStep: number;
  totalSteps: number;
  phase: TutorialPhase;
  title: string;
  description: string;
  phaseStepIndex: number;
  phaseStepCount: number;
  onPrev: () => void;
  onNext: () => void;
}

const phaseColors: Record<TutorialPhase, string> = {
  build: "var(--phase-build)",
  execute: "var(--phase-execute)",
  observe: "var(--phase-observe)",
};

export function StepControls({
  currentStep,
  totalSteps,
  phase,
  title,
  description,
  phaseStepIndex,
  phaseStepCount,
  onPrev,
  onNext,
}: StepControlsProps) {
  const color = phaseColors[phase];
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "16px 24px",
        background: "var(--bg-secondary)",
        borderTop: `1px solid var(--border)`,
      }}
    >
      {/* Step info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              marginTop: 2,
            }}
          >
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
          animate={{
            width: `${((currentStep + 1) / totalSteps) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
          style={{
            height: "100%",
            background: color,
            borderRadius: 2,
          }}
        />
      </div>

      {/* Controls row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "capitalize" }}>
          {phase} {phaseStepIndex + 1}/{phaseStepCount}
        </span>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Build phase: just Prev / Next */}
          {phase === "build" && (
            <>
              <NavButton onClick={onPrev} disabled={isFirst} label="Prev" />
              <NavButton
                onClick={onNext}
                disabled={isLast}
                label="Next"
                primary
                color={color}
              />
            </>
          )}

          {/* Execute phase: Prev / Next */}
          {phase === "execute" && (
            <>
              <NavButton onClick={onPrev} disabled={isFirst} label="Prev" />
              <NavButton
                onClick={onNext}
                disabled={isLast}
                label="Next"
                primary
                color={color}
              />
            </>
          )}

          {/* Observe phase: Prev / Next */}
          {phase === "observe" && (
            <>
              <NavButton onClick={onPrev} disabled={isFirst} label="Prev" />
              <NavButton
                onClick={onNext}
                disabled={isLast}
                label="Next"
                primary
                color={color}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NavButton({
  onClick,
  disabled,
  label,
  primary,
  color,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  primary?: boolean;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background:
          primary && !disabled ? (color || "var(--accent)") : "var(--bg-tertiary)",
        border: "1px solid var(--border)",
        color: primary && !disabled
          ? "#000"
          : disabled
            ? "var(--text-muted)"
            : "var(--text-primary)",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: primary ? 600 : 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s ease",
      }}
    >
      {label}
    </button>
  );
}
