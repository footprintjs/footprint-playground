import { motion } from "framer-motion";
import type { TutorialPhase } from "../tutorials/types";
import { useTheme } from "../ThemeContext";

const phases: { key: TutorialPhase; label: string; icon: string }[] = [
  { key: "build", label: "Build", icon: "\u{1F6E0}" },
  { key: "execute", label: "Execute", icon: "\u25B6" },
  { key: "observe", label: "Observe", icon: "\u{1F50D}" },
];

const phaseColors: Record<TutorialPhase, string> = {
  build: "var(--phase-build)",
  execute: "var(--phase-execute)",
  observe: "var(--phase-observe)",
};

interface PhaseHeaderProps {
  currentPhase: TutorialPhase;
  tutorialName: string;
  onPhaseClick?: (phase: TutorialPhase) => void;
}

export function PhaseHeader({ currentPhase, tutorialName, onPhaseClick }: PhaseHeaderProps) {
  const currentIdx = phases.findIndex((p) => p.key === currentPhase);
  const { theme, toggle } = useTheme();

  return (
    <header
      style={{
        padding: "12px 24px",
        borderBottom: `2px solid ${phaseColors[currentPhase]}`,
        display: "flex",
        alignItems: "center",
        gap: 20,
        background: "var(--bg-secondary)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          background:
            "linear-gradient(135deg, var(--accent), var(--success))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          flexShrink: 0,
        }}
      >
        FootPrint
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 24,
          background: "var(--border)",
          flexShrink: 0,
        }}
      />

      {/* Phase stepper */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
        {phases.map((phase, idx) => {
          const isActive = phase.key === currentPhase;
          const isDone = idx < currentIdx;
          const color = isActive
            ? phaseColors[phase.key]
            : isDone
              ? "var(--text-secondary)"
              : "var(--text-muted)";

          return (
            <div key={phase.key} style={{ display: "flex", alignItems: "center" }}>
              {/* Step circle + label */}
              <div
                onClick={() => (isActive || isDone) && onPhaseClick?.(phase.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: isActive
                    ? `color-mix(in srgb, ${phaseColors[phase.key]} 15%, transparent)`
                    : "transparent",
                  transition: "all 0.3s ease",
                  cursor: isActive || isDone ? "pointer" : "default",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    background: isActive ? phaseColors[phase.key] : isDone ? "var(--text-muted)" : "var(--bg-tertiary)",
                    color: isActive || isDone ? "white" : "var(--text-muted)",
                    transition: "all 0.3s ease",
                  }}
                >
                  {isDone ? "\u2713" : idx + 1}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color,
                    transition: "all 0.3s ease",
                  }}
                >
                  {phase.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="phase-dot"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: phaseColors[phase.key],
                    }}
                  />
                )}
              </div>

              {/* Connector line */}
              {idx < phases.length - 1 && (
                <div
                  style={{
                    width: 32,
                    height: 2,
                    background: idx < currentIdx ? "var(--text-muted)" : "var(--bg-tertiary)",
                    margin: "0 4px",
                    borderRadius: 1,
                    transition: "background 0.3s ease",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Tutorial name + theme toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
          {tutorialName}
        </span>
        <button
          onClick={toggle}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 14,
            transition: "all 0.2s ease",
          }}
        >
          {theme === "dark" ? "\u2600\uFE0F" : "\u{1F319}"}
        </button>
      </div>
    </header>
  );
}
