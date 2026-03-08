import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import type { Tutorial, TutorialPhase } from "../tutorials/types";
import { CodePanel } from "./CodePanel";
import { BuildFlowchart } from "./BuildFlowchart";
import { ExecuteFlowchart } from "./ExecuteFlowchart";
import { ExecuteDataPanel } from "./ExecuteDataPanel";
import { RunButton } from "./RunButton";
import { ObserveDataPanel } from "./ObserveDataPanel";
import { ObservePanel } from "./ObservePanel";
import { EndScreen } from "./EndScreen";
import { StepControls } from "./StepControls";
import { PhaseHeader } from "./PhaseHeader";
import { DescriptionOverlay } from "./DescriptionOverlay";

interface TutorialShellProps {
  tutorial: Tutorial;
}

interface PanelContent {
  left: React.ReactNode;
  right: React.ReactNode;
}

const TRANSITION_MS = 600;

/** Extract description strings organically from the code.
 *  For individual stages: extracts the description positional param from new lines.
 *  For .build(): collects ALL stage descriptions into a full chart.description. */
function extractDescriptions(code: string, newCodeRange?: [number, number]): string | undefined {
  if (!newCodeRange) return undefined;
  const lines = code.split("\n");
  const newLines = lines.slice(newCodeRange[0] - 1, newCodeRange[1]).join("\n");

  // When .build() is in the new code, show the full chart.description
  if (newLines.includes(".build()")) {
    const allDescs: string[] = [];
    for (const m of code.matchAll(/"([^"]+)"\)\s*$/gm)) allDescs.push(m[1]);
    // Also find parallel displayNames
    const parallelNames: string[] = [];
    for (const m of code.matchAll(/displayName:\s*"([^"]+)"/g)) parallelNames.push(m[1]);
    if (allDescs.length === 0) return undefined;
    // Build the chart.description format
    const parts: string[] = [];
    let step = 0;
    for (const d of allDescs) {
      step++;
      // Insert parallel step before the step that follows the parallel block
      if (parallelNames.length > 0 && step === 3) {
        parts.push(`${step}. Runs in parallel: ${parallelNames.join(", ")}`);
        step++;
      }
      parts.push(`${step}. ${d}`);
    }
    // If parallel wasn't inserted yet (no descriptions after it)
    if (parallelNames.length > 0 && !parts.some((p) => p.includes("parallel"))) {
      step++;
      parts.push(`${step}. Runs in parallel: ${parallelNames.join(", ")}`);
    }
    return parts.join("\n");
  }

  // Otherwise extract individual description from new lines only
  const descs: string[] = [];
  for (const m of newLines.matchAll(/"([^"]+)"\)\s*$/gm)) descs.push(m[1]);
  return descs.length > 0 ? descs.join(" · ") : undefined;
}

export function TutorialShell({ tutorial }: TutorialShellProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Observe phase: shared snapshot index between flowchart and panel
  const [observeSnapshotIdx, setObserveSnapshotIdx] = useState(0);

  // Description overlay for build phase
  const [showDescription, setShowDescription] = useState(false);

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

  // Reset observe snapshot index when entering observe phase
  useEffect(() => {
    if (step.phase === "observe" && prevPhaseRef.current !== "observe") {
      setObserveSnapshotIdx(0);
    }
  }, [step.phase]);

  // Extract description organically from the code's new lines
  const codeDescription = useMemo(
    () => extractDescriptions(step.code, step.newCodeRange),
    [step.code, step.newCodeRange]
  );

  // Show description overlay when new code contains a .description() call
  useEffect(() => {
    setShowDescription(!!codeDescription);
  }, [stepIndex, codeDescription]);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  // Phase-aware background tint
  const phaseBg: Record<TutorialPhase, string> = {
    build: "var(--phase-build-dim)",
    execute: "var(--phase-execute-dim)",
    observe: "var(--phase-observe-dim)",
  };

  const getPanels = useCallback(
    (s: (typeof tutorial.steps)[number], snapshotIdx: number): PanelContent => {
      switch (s.phase) {
        case "build":
          return {
            left: <CodePanel code={s.code} highlightLines={s.highlightLines} newCodeRange={s.newCodeRange} />,
            right: <BuildFlowchart nodes={s.nodes} edges={s.edges} linkedNodeId={s.linkedNodeId} />,
          };
        case "execute": {
          const hasMemory = s.memory && Object.keys(s.memory).length > 0;
          return {
            left: <ExecuteFlowchart nodes={s.nodes} edges={s.edges} />,
            right: hasMemory ? (
              <ExecuteDataPanel memory={s.memory || {}} narrative={s.narrative} />
            ) : (
              <RunButton isPlaying={isPlaying} onTogglePlay={togglePlay} />
            ),
          };
        }
        case "observe": {
          // Last step = end screen
          const isLastStep = s === tutorial.steps[tutorial.steps.length - 1];
          if (isLastStep) {
            return {
              left: s.snapshots ? (
                <ObserveDataPanel snapshots={s.snapshots} selectedIndex={s.snapshots.length - 1} />
              ) : (
                <ExecuteFlowchart nodes={s.nodes} edges={s.edges} />
              ),
              right: <EndScreen />,
            };
          }
          return {
            left: s.snapshots ? (
              <ObserveDataPanel snapshots={s.snapshots} selectedIndex={snapshotIdx} />
            ) : (
              <ExecuteFlowchart nodes={s.nodes} edges={s.edges} />
            ),
            right: s.snapshots ? (
              <ObservePanel
                nodes={s.nodes}
                edges={s.edges}
                snapshots={s.snapshots}
                selectedIndex={snapshotIdx}
                onSelectIndex={setObserveSnapshotIdx}
              />
            ) : (
              <ExecuteDataPanel memory={s.memory || {}} narrative={s.narrative} />
            ),
          };
        }
      }
    },
    [tutorial.steps, isPlaying, togglePlay]
  );

  // Phase transition animation
  useEffect(() => {
    if (step.phase !== prevPhaseRef.current) {
      const prevStepIndex = Math.max(0, stepIndex - 1);
      const prevStep = tutorial.steps[prevStepIndex];
      const prevPanels = getPanels(prevStep, observeSnapshotIdx);
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
  }, [step.phase, stepIndex, tutorial.steps, getPanels, observeSnapshotIdx]);

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  }, [totalSteps]);

  const goPrev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
    setIsPlaying(false);
  }, []);

  const goToPhase = useCallback((phase: TutorialPhase) => {
    const idx = tutorial.steps.findIndex((s) => s.phase === phase);
    if (idx >= 0) {
      setStepIndex(idx);
      setIsPlaying(false);
    }
  }, [tutorial.steps]);

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

  const { left, right } = getPanels(step, observeSnapshotIdx);

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
      <PhaseHeader currentPhase={step.phase} tutorialName={tutorial.name} onPhaseClick={goToPhase} />

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
          <StaticLayout
            left={left}
            right={right}
            overlay={
              <DescriptionOverlay
                description={codeDescription}
                visible={showDescription}
                onDismiss={() => setShowDescription(false)}
              />
            }
          />
        )}
      </div>

      {/* Bottom controls */}
      <StepControls
        currentStep={stepIndex}
        totalSteps={totalSteps}
        phase={step.phase}
        title={step.title}
        description={step.description}
        phaseStepIndex={phaseInfo.phaseStepIndex}
        phaseStepCount={phaseInfo.phaseStepCount}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
}

function StaticLayout({
  left,
  right,
  overlay,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  overlay?: React.ReactNode;
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
      <div style={{ flex: 1, height: "100%", overflow: "hidden", position: "relative" }}>
        {right}
        {overlay}
      </div>
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
