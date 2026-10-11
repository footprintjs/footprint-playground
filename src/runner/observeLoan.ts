import { FlowChartExecutor } from "footprintjs";
import { toVisualizationSnapshots } from "footprint-explainable-ui";
import { asRuntimeStageId, createTraceBundle, type RuntimeOverlay } from "footprint-explainable-ui/flowchart";
import { buildLoanChart, DEFAULT_LOAN_INPUT } from "../charts/loanApplicationChart";

/** One independent run and its existing public view projection; no invented snapshot fields. */
export async function observeLoan() {
  const bundle = createTraceBundle();
  const executor = new FlowChartExecutor(buildLoanChart(bundle.structure.recorder));
  executor.enableNarrative();
  bundle.attachTo(executor);
  await executor.run({ input: DEFAULT_LOAN_INPUT });
  const snapshot = executor.getSnapshot();
  const narrativeEntries = executor.getNarrativeEntries();
  const stages = toVisualizationSnapshots(snapshot, narrativeEntries);
  return {
    bundle, snapshot, narrativeEntries, stages,
    buildTime: { traceGraph: bundle.structure.getGraph(), runtimeOverlay: bundle.runtimeOverlay.getOverlay() },
  };
}

/** A chart click selects its first recorded execution, never a fabricated stage/step ID. */
export function firstStageExecution(overlay: RuntimeOverlay, stageId: string) {
  const match = overlay.executionOrder.find(step => step.stageId === stageId);
  return match ? asRuntimeStageId(match.runtimeStageId) : null;
}
