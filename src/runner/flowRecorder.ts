import type { FlowRecorder } from "footprintjs";
import type { MinimalFlowRecorder } from "footprint-explainable-ui/flowchart";

/** The view requires a concrete execution ID; the engine's public hook allows absent context. */
export function flowRecorder(recorder: MinimalFlowRecorder): FlowRecorder {
  return {
    ...recorder,
    onStageExecuted(event) {
      const context = event.traversalContext;
      if (!context?.runtimeStageId) return;
      recorder.onStageExecuted?.({ ...event, traversalContext: { ...context, runtimeStageId: context.runtimeStageId } });
    },
  };
}
