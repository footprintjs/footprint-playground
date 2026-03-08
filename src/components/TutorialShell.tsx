import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import type { Tutorial, TutorialPhase } from "../tutorials/types";
import { CodePanel } from "./CodePanel";
import { FlowchartPanel } from "./FlowchartPanel";
import { MemoryTimeline } from "./MemoryTimeline";
import { ObservePanel } from "./ObservePanel";
import { EndScreen } from "./EndScreen";
import { StepControls } from "./StepControls";
import { PhaseHeader } from "./PhaseHeader";

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

  // Transition state
  const [transitioning, setTransitioning] = useState(false);
  const [oldLeft, setOldLeft] = useState<React.ReactNode>(null);
  const prevPhaseRef = useRef<TutorialPhase>("build");
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const step = tutorial.steps[stepIndex];
  const totalSteps = tutorial.steps.length;

  // Compute phase step info
  const phaseInfo = useMemo(() => {
    const firstIdx = tutorial.steps.findIndex((s) => s.phase === step.phase);
    const count = tutorial.steps.filter((s) => s.phase === step.phase).length;
    return { firstStepOfPhase: firstIdx, phaseStepCount: count, phaseStepIndex: stepIndex - firstIdx };
  }, [tutorial.steps, step.phase, stepIndex]);

  // Phase-aware background tint
  const phaseBg: Record<TutorialPhase, string> = {
    build: "var(--phase-build-dim)",
    execute: "var(--phase-execute-dim)",
    observe: "var(--phase-observe-dim)",
  };

  const getPanels = useCallback(
    (s: (typeof tutorial.steps)[number]): PanelContent => {
      switch (s.phase) {
        case "build":
          return {
            left: <CodePanel code={s.code} highlightLines={s.highlightLines} newCodeRange={s.newCodeRange} />,
            right: <FlowchartPanel nodes={s.nodes} edges={s.edges} linkedNodeId={s.linkedNodeId} />,
          };
        case "execute":
          return {
            left: <FlowchartPanel nodes={s.nodes} edges={s.edges} />,
            right: <MemoryTimeline memory={s.memory || {}} narrative={s.narrative} />,
          };
        case "observe": {
          // Last step = end screen
          const isLastStep = s === tutorial.steps[tutorial.steps.length - 1];
          if (isLastStep) {
            return {
              left: <FlowchartPanel nodes={s.nodes} edges={s.edges} />,
              right: <EndScreen />,
            };
          }
          return {
            left: <FlowchartPanel nodes={s.nodes} edges={s.edges} />,
            right: s.snapshots ? (
              <ObservePanel snapshots={s.snapshots} />
            ) : (
              <MemoryTimeline memory={s.memory || {}} narrative={s.narrative} />
            ),
          };
        }
      }
    },
    [tutorial.steps]
  );

  // Phase transition animation
  useEffect(() => {
    if (step.phase !== prevPhaseRef.current) {
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
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, [step.phase, stepIndex, tutorial.steps, getPanels]);

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  }, [totalSteps]);

  const goPrev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
    setIsPlaying(false);
  }, []);

  const goToStep = useCallback((idx: number) => {
    setStepIndex(idx);
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
      {/* Phase stepper header */}
      <PhaseHeader currentPhase={step.phase} tutorialName={tutorial.name} />

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          background: phaseBg[step.phase],
          transition: "background 0.5s ease",
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
        phaseStepIndex={phaseInfo.phaseStepIndex}
        phaseStepCount={phaseInfo.phaseStepCount}
        firstStepOfPhase={phaseInfo.firstStepOfPhase}
        onPrev={goPrev}
        onNext={goNext}
        onTogglePlay={togglePlay}
        onGoToStep={goToStep}
      />
    </div>
  );
}

function StaticLayout({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
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
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <motion.div
        initial={{ left: "0%", opacity: 1 }}
        animate={{ left: "-50%", opacity: 0 }}
        transition={{ duration, ease }}
        style={{ position: "absolute", top: 0, bottom: 0, width: "50%", overflow: "hidden", borderRight: "1px solid var(--border)" }}
      >
        {oldLeft}
      </motion.div>
      <motion.div
        initial={{ left: "50%" }}
        animate={{ left: "0%" }}
        transition={{ duration, ease }}
        style={{ position: "absolute", top: 0, bottom: 0, width: "50%", overflow: "hidden", borderRight: "1px solid var(--border)" }}
      >
        {newLeft}
      </motion.div>
      <motion.div
        initial={{ left: "100%" }}
        animate={{ left: "50%" }}
        transition={{ duration, ease }}
        style={{ position: "absolute", top: 0, bottom: 0, width: "50%", overflow: "hidden" }}
      >
        {newRight}
      </motion.div>
    </div>
  );
}
