import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tutorial } from "../tutorials/types";
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
  const playTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const step = tutorial.steps[stepIndex];
  const totalSteps = tutorial.steps.length;

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
          <>
            <PanelContainer key="left-build" side="left">
              <CodePanel
                code={step.code}
                highlightLines={step.highlightLines}
              />
            </PanelContainer>
            <PanelContainer key="right-build" side="right">
              <FlowchartPanel nodes={step.nodes} edges={step.edges} />
            </PanelContainer>
          </>
        );

      case "execute":
        // Left: flowchart | Right: memory + narrative
        return (
          <>
            <PanelContainer key="left-exec" side="left">
              <FlowchartPanel nodes={step.nodes} edges={step.edges} />
            </PanelContainer>
            <PanelContainer key="right-exec" side="right">
              <MemoryPanel
                memory={step.memory || {}}
                narrative={step.narrative}
              />
            </PanelContainer>
          </>
        );

      case "observe":
        // Left: memory + narrative | Right: code (replay/metrics)
        return (
          <>
            <PanelContainer key="left-obs" side="left">
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
            </PanelContainer>
            <PanelContainer key="right-obs" side="right">
              <CodePanel code={step.code} />
            </PanelContainer>
          </>
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
            background: "linear-gradient(135deg, var(--accent), var(--success))",
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

function PanelContainer({
  children,
  side,
}: {
  children: React.ReactNode;
  side: "left" | "right";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: side === "left" ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: side === "left" ? -30 : 30 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      style={{
        flex: 1,
        height: "100%",
        overflow: "hidden",
        borderRight: side === "left" ? "1px solid var(--border)" : undefined,
      }}
    >
      {children}
    </motion.div>
  );
}
