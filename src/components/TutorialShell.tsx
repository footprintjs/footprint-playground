import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tutorial, TutorialPhase } from "../tutorials/types";
import { CodePanel } from "./CodePanel";
import { FlowchartPanel } from "./FlowchartPanel";
import { MemoryPanel } from "./MemoryPanel";
import { StepControls } from "./StepControls";

interface TutorialShellProps {
  tutorial: Tutorial;
}

export function TutorialShell({ tutorial }: TutorialShellProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [prevPhase, setPrevPhase] = useState<TutorialPhase>("build");
  const playTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const step = tutorial.steps[stepIndex];
  const totalSteps = tutorial.steps.length;

  // Detect phase transitions
  const isPhaseTransition = step.phase !== prevPhase;
  useEffect(() => {
    setPrevPhase(step.phase);
  }, [step.phase]);

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  }, [totalSteps]);

  const goPrev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  // Auto-play during execute phase
  useEffect(() => {
    if (isPlaying && step.phase === "execute") {
      playTimerRef.current = setTimeout(() => {
        if (stepIndex < totalSteps - 1) {
          const nextStep = tutorial.steps[stepIndex + 1];
          if (nextStep.phase === "execute") {
            goNext();
          } else {
            setIsPlaying(false);
            goNext();
          }
        } else {
          setIsPlaying(false);
        }
      }, 1500);
    }
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlaying, stepIndex, step.phase, totalSteps, tutorial.steps, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  // Determine panel layout based on phase
  const renderPanels = () => {
    switch (step.phase) {
      case "build":
        // Left: code | Right: flowchart building
        return (
          <PhaseLayout
            key="phase-build"
            phase="build"
            isTransition={isPhaseTransition}
            left={
              <CodePanel
                code={step.code}
                highlightLines={step.highlightLines}
              />
            }
            right={
              <FlowchartPanel nodes={step.nodes} edges={step.edges} />
            }
          />
        );

      case "execute":
        // Left: flowchart | Right: memory + narrative
        return (
          <PhaseLayout
            key="phase-execute"
            phase="execute"
            isTransition={isPhaseTransition}
            left={
              <FlowchartPanel nodes={step.nodes} edges={step.edges} />
            }
            right={
              <MemoryPanel
                memory={step.memory || {}}
                narrative={step.narrative}
              />
            }
          />
        );

      case "observe":
        // Left: flowchart + memory/narrative | Right: code
        return (
          <PhaseLayout
            key="phase-observe"
            phase="observe"
            isTransition={isPhaseTransition}
            left={
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ flex: "0 0 40%" }}>
                  <FlowchartPanel nodes={step.nodes} edges={step.edges} />
                </div>
                <div
                  style={{
                    flex: 1,
                    borderTop: "1px solid var(--border)",
                    overflow: "auto",
                  }}
                >
                  <MemoryPanel
                    memory={step.memory || {}}
                    narrative={step.narrative}
                  />
                </div>
              </div>
            }
            right={<CodePanel code={step.code} />}
          />
        );
    }
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "12px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: "var(--bg-secondary)",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            background:
              "linear-gradient(135deg, var(--accent), var(--success))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          FootPrint
        </div>
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
          {tutorial.name}
        </span>
      </header>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <AnimatePresence mode="wait">{renderPanels()}</AnimatePresence>
      </div>

      {/* Bottom controls */}
      <StepControls
        currentStep={stepIndex}
        totalSteps={totalSteps}
        phase={step.phase}
        title={step.title}
        description={step.description}
        isPlaying={isPlaying}
        onPrev={goPrev}
        onNext={goNext}
        onTogglePlay={togglePlay}
      />
    </div>
  );
}

/**
 * On phase transition: both panels slide left together (right→left handoff).
 * Within a phase: panels just fade in place.
 */
function PhaseLayout({
  phase,
  isTransition,
  left,
  right,
}: {
  phase: TutorialPhase;
  isTransition: boolean;
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  // Slide distance for phase transition
  const slideX = isTransition ? "50%" : "0%";

  return (
    <motion.div
      key={phase}
      initial={
        isTransition
          ? { x: slideX, opacity: 0 }
          : { opacity: 0 }
      }
      animate={{ x: "0%", opacity: 1 }}
      exit={
        isTransition
          ? { x: `-${slideX}`, opacity: 0 }
          : { opacity: 0 }
      }
      transition={{
        duration: isTransition ? 0.6 : 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "absolute",
        inset: 0,
      }}
    >
      {/* Left panel */}
      <div
        style={{
          flex: 1,
          height: "100%",
          overflow: "hidden",
          borderRight: "1px solid var(--border)",
        }}
      >
        {left}
      </div>

      {/* Right panel */}
      <motion.div
        initial={isTransition ? { opacity: 0, x: 40 } : { opacity: 0 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.4,
          delay: isTransition ? 0.3 : 0,
          ease: "easeOut",
        }}
        style={{
          flex: 1,
          height: "100%",
          overflow: "hidden",
        }}
      >
        {right}
      </motion.div>
    </motion.div>
  );
}
