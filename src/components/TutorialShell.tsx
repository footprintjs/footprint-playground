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

const phaseOrder: TutorialPhase[] = ["build", "execute", "observe"];

export function TutorialShell({ tutorial }: TutorialShellProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const playTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const step = tutorial.steps[stepIndex];
  const prevPhaseRef = useRef<TutorialPhase>(step.phase);
  const totalSteps = tutorial.steps.length;

  // Track direction when phase changes
  const isPhaseTransition = step.phase !== prevPhaseRef.current;
  useEffect(() => {
    if (isPhaseTransition) {
      const oldIdx = phaseOrder.indexOf(prevPhaseRef.current);
      const newIdx = phaseOrder.indexOf(step.phase);
      setDirection(newIdx > oldIdx ? 1 : -1);
    }
    prevPhaseRef.current = step.phase;
  }, [step.phase, isPhaseTransition]);

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

  const getPanels = (phase: TutorialPhase) => {
    switch (phase) {
      case "build":
        return {
          left: (
            <CodePanel
              code={step.code}
              highlightLines={step.highlightLines}
            />
          ),
          right: <FlowchartPanel nodes={step.nodes} edges={step.edges} />,
        };
      case "execute":
        return {
          left: <FlowchartPanel nodes={step.nodes} edges={step.edges} />,
          right: (
            <MemoryPanel
              memory={step.memory || {}}
              narrative={step.narrative}
            />
          ),
        };
      case "observe":
        return {
          left: (
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
          ),
          right: <CodePanel code={step.code} />,
        };
    }
  };

  const { left, right } = getPanels(step.phase);

  // Slide variants: enter from right, exit to left (or reverse)
  const slideVariants = {
    enter: { x: `${direction * 100}%` },
    center: { x: "0%" },
    exit: { x: `${direction * -100}%` },
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
          overflow: "hidden",
          position: "relative",
        }}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={step.phase}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: 0.5,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{
              display: "flex",
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
            <div
              style={{
                flex: 1,
                height: "100%",
                overflow: "hidden",
              }}
            >
              {right}
            </div>
          </motion.div>
        </AnimatePresence>
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
