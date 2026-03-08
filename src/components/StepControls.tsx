import { motion } from "framer-motion";
import type { TutorialPhase } from "../tutorials/types";

interface StepControlsProps {
  currentStep: number;
  totalSteps: number;
  phase: TutorialPhase;
  title: string;
  description: string;
  isPlaying: boolean;
  /** Index within current phase (for observe slider) */
  phaseStepIndex: number;
  phaseStepCount: number;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onGoToStep?: (stepIndex: number) => void;
  firstStepOfPhase: number;
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
  isPlaying,
  phaseStepIndex,
  phaseStepCount,
  onPrev,
  onNext,
  onTogglePlay,
  onGoToStep,
  firstStepOfPhase,
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

      {/* Phase-specific progress */}
      {phase === "observe" && phaseStepCount > 1 ? (
        <ObserveSlider
          phaseStepIndex={phaseStepIndex}
          phaseStepCount={phaseStepCount}
          color={color}
          onGoToStep={onGoToStep}
          firstStepOfPhase={firstStepOfPhase}
        />
      ) : (
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
      )}

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

          {/* Execute phase: Prev, centered Run button, Next */}
          {phase === "execute" && (
            <>
              <NavButton onClick={onPrev} disabled={isFirst} label="Prev" />
              <button
                onClick={onTogglePlay}
                style={{
                  background: isPlaying
                    ? "var(--error)"
                    : color,
                  border: "none",
                  color: isPlaying ? "white" : "#000",
                  borderRadius: 24,
                  padding: "8px 28px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  letterSpacing: "0.02em",
                }}
              >
                {isPlaying ? (
                  <>
                    <span style={{ fontSize: 10 }}>{"\u23F8"}</span> Pause
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 10 }}>{"\u25B6"}</span> Run
                  </>
                )}
              </button>
              <NavButton
                onClick={onNext}
                disabled={isLast}
                label="Next"
              />
            </>
          )}

          {/* Observe phase: Prev / Replay / Next */}
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

function ObserveSlider({
  phaseStepIndex,
  phaseStepCount,
  color,
  onGoToStep,
  firstStepOfPhase,
}: {
  phaseStepIndex: number;
  phaseStepCount: number;
  color: string;
  onGoToStep?: (stepIndex: number) => void;
  firstStepOfPhase: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
        Replay
      </span>
      <input
        type="range"
        min={0}
        max={phaseStepCount - 1}
        value={phaseStepIndex}
        onChange={(e) => {
          const idx = parseInt(e.target.value);
          onGoToStep?.(firstStepOfPhase + idx);
        }}
        style={{
          flex: 1,
          height: 4,
          accentColor: color,
          cursor: "pointer",
        }}
      />
      <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
        {phaseStepIndex + 1}/{phaseStepCount}
      </span>
    </div>
  );
}
