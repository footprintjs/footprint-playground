import { describe, expect, it, vi } from "vitest";
import { flowChart, FlowChartExecutor, type FlowStageEvent } from "footprintjs";
import { createTraceRuntimeOverlay, type MinimalFlowRecorder } from "footprint-explainable-ui/flowchart";
import { toVisualizationSnapshots } from "footprint-explainable-ui";
import { flowRecorder } from "../src/runner/flowRecorder";
import { firstStageExecution, observeLoan } from "../src/runner/observeLoan";

describe("engine-to-view recorder boundary", () => {
  it("does not invent a runtime ID when the public engine event has no context", () => {
    const onStageExecuted = vi.fn();
    flowRecorder({ id: "view", onStageExecuted }).onStageExecuted?.({ stageName: "Seed", stageType: "linear" });
    expect(onStageExecuted).not.toHaveBeenCalled();
  });

  it("forwards every recorded field without changing the engine event", () => {
    const onStageExecuted = vi.fn();
    const event: FlowStageEvent = Object.freeze({
      stageName: "Seed", stageType: "linear", description: "Keeps data",
      traversalContext: Object.freeze({ runId: "run", stageId: "seed", runtimeStageId: "seed#0", stageName: "Seed", depth: 0 }),
    });
    flowRecorder({ id: "view", onStageExecuted }).onStageExecuted?.(event);
    expect(onStageExecuted).toHaveBeenCalledExactlyOnceWith(event);
    expect(event.traversalContext?.runtimeStageId).toBe("seed#0");
  });

  it("preserves the other supported hooks and allows a recorder with no stage hook", () => {
    const recorder: MinimalFlowRecorder = {
      id: "view", onError: vi.fn(), onStageRetry: vi.fn(), onRunStart: vi.fn(), onRunEnd: vi.fn(),
    };
    const adapted = flowRecorder(recorder);
    for (const name of ["id", "onError", "onStageRetry", "onRunStart", "onRunEnd"] as const) {
      expect(adapted[name]).toBe(recorder[name]);
    }
    expect(() => adapted.onStageExecuted?.({ stageName: "Seed", stageType: "linear" })).not.toThrow();
  });

  it("records a real public execution with the engine's exact stage IDs", async () => {
    const overlay = createTraceRuntimeOverlay({ id: "view" });
    const executor = new FlowChartExecutor(flowChart<{ answer: number }>("Seed", scope => { scope.answer = 42; }, "seed").build());
    const witnessed: FlowStageEvent[] = [];
    executor.attachFlowRecorder({ id: "witness", onStageExecuted: event => witnessed.push(event) });
    executor.attachFlowRecorder(flowRecorder(overlay.recorder));
    await executor.run();
    expect(overlay.getOverlay().executionOrder.map(step => step.runtimeStageId))
      .toEqual(witnessed.map(event => event.traversalContext?.runtimeStageId));
    expect(overlay.getOverlay().executionOrder).toHaveLength(1);
    expect(overlay.getOverlay().running).toBe(false);
  });
});

describe("Observe page's actual public run projection", () => {
  it("uses the official projection, not a nonexistent snapshot.stages property", async () => {
    const run = await observeLoan();
    expect(run.snapshot).not.toHaveProperty("stages");
    expect(run.stages).toEqual(toVisualizationSnapshots(run.snapshot, run.narrativeEntries));
    expect(run.stages.length).toBeGreaterThan(1);
    for (const stage of run.stages) {
      expect(stage.runtimeStageId).toBeTruthy();
      expect(run.buildTime.runtimeOverlay.executionOrder.some(step => step.runtimeStageId === stage.runtimeStageId)).toBe(true);
    }
    const first = run.buildTime.runtimeOverlay.executionOrder[0];
    expect(firstStageExecution(run.buildTime.runtimeOverlay, first.stageId)).toBe(first.runtimeStageId);
    expect(firstStageExecution(run.buildTime.runtimeOverlay, "not-a-stage")).toBeNull();
  });

  it("chart navigation chooses the first actual execution when a stage repeats", () => {
    const overlay = {
      executionOrder: [
        { stageId: "loop", runtimeStageId: "loop#0", stageName: "Loop", timestampMs: 0 },
        { stageId: "loop", runtimeStageId: "loop#1", stageName: "Loop", timestampMs: 1 },
      ], errors: new Map<string, string>(), running: false,
    };
    expect(firstStageExecution(overlay, "loop")).toBe("loop#0");
  });

  it("re-runs with fresh recorders instead of accumulating the previous run", async () => {
    const first = await observeLoan();
    const second = await observeLoan();
    expect(first.bundle).not.toBe(second.bundle);
    expect(second.stages.map(stage => stage.runtimeStageId)).toEqual(first.stages.map(stage => stage.runtimeStageId));
    expect(second.buildTime.runtimeOverlay.executionOrder).toHaveLength(first.buildTime.runtimeOverlay.executionOrder.length);
    expect(second.snapshot.sharedState).toEqual(first.snapshot.sharedState);
  });
});
