import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Tutorial, TutorialPhase } from "../tutorials/types";
import { CodePanel } from "./CodePanel";
import { FlowchartPanel } from "./FlowchartPanel";
import { MemoryPanel } from "./MemoryPanel";
import { StepControls } from "./StepControls";

interface TutorialShellProps {
  tutorial: Tutorial;
}

interface PanelContent {
  left: React.ReactNode;
  right: React.ReactNode;
}

const TRANSITION_MS = 600;

export function TutorialShell({ tutorial }: TutorialShellProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Transition state: when phase changes, we briefly show 3 panels
  const [transitioning, setTransitioning] = useState(false);
  const [oldLeft, setOldLeft] = useState<React.ReactNode>(null);
  const prevPhaseRef = useRef<TutorialPhase>("build");
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const step = tutorial.steps[stepIndex];
  const totalSteps = tutorial.steps.length;

  const getPanels = useCallback(
    (s: typeof step): PanelContent => {
      switch (s.phase) {
        case "build":
          return {
            left: (
              <CodePanel code={s.code} highlightLines={s.highlightLines} />
            ),
            right: <FlowchartPanel nodes={s.nodes} edges={s.edges} />,
          };
        case "execute":
          return {
            left: <FlowchartPanel nodes={s.nodes} edges={s.edges} />,
            right: (
              <MemoryPanel
                memory={s.memory || {}}
                narrative={s.narrative}
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
                  <FlowchartPanel nodes={s.nodes} edges={s.edges} />
                </div>
                <div
                  style={{
                    flex: 1,
                    borderTop: "1px solid var(--border)",
                    overflow: "auto",
                  }}
                >
                  <MemoryPanel
                    memory={s.memory || {}}
                    narrative={s.narrative}
                  />
                </div>
              </div>
            ),
            right: <CodePanel code={s.code} />,
          };
      }
    },
    []
  );

  // Detect phase change and trigger 3-panel transition
  useEffect(() => {
    if (step.phase !== prevPhaseRef.current) {
      // Get the previous step's panels to capture the old left content
      const prevStepIndex = Math.max(0, stepIndex - 1);
      const prevStep = tutorial.steps[prevStepIndex];
      const prevPanels = getPanels(prevStep);
      setOldLeft(prevPanels.left);
      setTransitioning(true);

      transitionTimerRef.current = setTimeout(() => {
        setTransitioning(false);
        setOldLeft(null);
      }, TRANSITION_MS);

      prevPhaseRef.current = step.phase;
    }
    return () => {
      if (transitionTimerRef.current)
        clearTimeout(transitionTimerRef.current);
    };
  }, [step.phase, stepIndex, tutorial.steps, getPanels]);

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

  const { left, right } = getPanels(step);

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
        {transitioning ? (
          <TransitionLayout oldLeft={oldLeft} newLeft={left} newRight={right} />
        ) : (
          <StaticLayout left={left} right={right} />
        )}
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

/** Normal two-panel layout (no transition in progress) */
function StaticLayout({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", height: "100%", width: "100%" }}>
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
      <div style={{ flex: 1, height: "100%", overflow: "hidden" }}>{right}</div>
    </div>
  );
}

/**
 * 3-panel transition:
 * - Old left panel: slides out to the left (from 0% to -50%)
 * - New left panel (was old right): slides from right position to left (50% → 0%)
 * - New right panel: slides in from offscreen (100% → 50%)
 *
 * This creates the visual effect of the right panel content
 * physically moving to become the left panel.
 */
function TransitionLayout({
  oldLeft,
  newLeft,
  newRight,
}: {
  oldLeft: React.ReactNode;
  newLeft: React.ReactNode;
  newRight: React.ReactNode;
}) {
  const ease = [0.4, 0, 0.2, 1] as const;
  const duration = TRANSITION_MS / 1000;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Old left panel — slides off to the left */}
      <motion.div
        initial={{ left: "0%", opacity: 1 }}
        animate={{ left: "-50%", opacity: 0 }}
        transition={{ duration, ease }}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: "50%",
          overflow: "hidden",
          borderRight: "1px solid var(--border)",
        }}
      >
        {oldLeft}
      </motion.div>

      {/* New left panel (the "shared" content) — slides from right half to left half */}
      <motion.div
        initial={{ left: "50%" }}
        animate={{ left: "0%" }}
        transition={{ duration, ease }}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: "50%",
          overflow: "hidden",
          borderRight: "1px solid var(--border)",
        }}
      >
        {newLeft}
      </motion.div>

      {/* New right panel — slides in from offscreen right */}
      <motion.div
        initial={{ left: "100%" }}
        animate={{ left: "50%" }}
        transition={{ duration, ease }}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: "50%",
          overflow: "hidden",
        }}
      >
        {newRight}
      </motion.div>
    </div>
  );
}
