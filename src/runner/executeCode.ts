import * as footprint from "footprintjs";
import * as engineTrace from "footprintjs/trace";
import * as foottrace from "foottrace";
import * as foottraceWrite from "foottrace/write";
import * as foottracePaths from "foottrace/paths";
import type { NarrativeEntry } from "footprint-explainable-ui";
import {
  createTraceStructureRecorder,
  createTraceRuntimeOverlay,
  type TraceGraph,
  type RuntimeOverlay,
} from "footprint-explainable-ui/flowchart";
import { transform } from "sucrase";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

export interface RuntimeStageNode {
  id: string;
  name?: string;
  isDecider?: boolean;
  isFork?: boolean;
  stageWrites?: Record<string, unknown>;
  logs: Record<string, unknown>;
  errors: Record<string, unknown>;
  metrics: Record<string, unknown>;
  evals: Record<string, unknown>;
  flowMessages?: unknown[];
  next?: RuntimeStageNode;
  children?: RuntimeStageNode[];
}

export interface BuildTimeInfo {
  /** Mermaid flowchart text from builder.toMermaid() */
  mermaid: string;
  /** Serialized pipeline structure from builder.toSpec() */
  spec: Record<string, unknown>;
  /** Pipeline description (numbered step list) */
  description: string;
  /** Per-stage descriptions */
  stageDescriptions: Record<string, string>;
  /** Input schema if declared */
  inputSchema?: unknown;
  /** Output schema if declared */
  outputSchema?: unknown;
  /** MCP tool description from chart.toMCPTool() — what LLMs consume to decide how to call this flow. */
  mcpTool?: unknown;
  /** OpenAPI spec from chart.toOpenAPI() — available when the chart declares a .contract(). */
  openAPI?: unknown;
  /** Error message if toOpenAPI() failed (typically: no contract declared). */
  openAPIError?: string;
  /**
   * Trace graph captured live by a `StructureRecorder` during chart
   * construction. Drives the v6.0 `<TraceFlow>` consumer pattern —
   * lets the UI render the chart shape without re-walking
   * `buildTimeStructure` post-build.
   */
  traceGraph?: TraceGraph;
  /**
   * Runtime overlay captured live by a `FlowRecorder` during chart
   * execution. Pairs with `traceGraph` to drive the L7.10
   * `<TracedFlow>` / `<ExplainableShell traceGraph runtimeOverlay>`
   * path — full time-travel UI without spec-tree post-walks.
   */
  runtimeOverlay?: RuntimeOverlay;
}

export interface ExecutionResult {
  snapshot: {
    sharedState: Record<string, unknown>;
    executionTree: RuntimeStageNode;
    commitLog: unknown[];
    subflowResults?: Record<string, unknown>;
  } | null;
  logs: string[];
  /** Narrative lines from CombinedNarrativeBuilder (separate from console logs) */
  narrative: string[];
  /** Structured narrative entries from CombinedNarrativeRecorder for semantic rendering */
  narrativeEntries?: NarrativeEntry[];
  /** Build-time metadata captured from the builder */
  buildTime: BuildTimeInfo | null;
  /** Runtime structure (spec + resolved dynamic subflows). Used for drill-down. */
  runtimeStructure?: Record<string, unknown>;
  error?: string;
  /** When true, execution paused at a PausableHandler stage. Call resumeExecution() to continue. */
  paused?: boolean;
  /** Pause data from the pausable stage (question, metadata). */
  pauseData?: unknown;
  /** ID of the paused stage. */
  pausedStageId?: string;
}

/**
 * Build-only mode — runs the user's code far enough to construct the
 * chart (so `BuildTimeInfo.spec`, `mermaid`, `traceGraph` are captured)
 * but no-ops `executor.run()` so no runtime execution happens.
 *
 * Use when the UI wants to display the chart shape (Visual + Trace
 * tabs) without paying execution cost or surfacing runtime errors.
 *
 * `executeCode(code, input)` is the full build + run path; this is
 * the "look at the chart without running it" sibling.
 */
export async function buildCode(code: string): Promise<ExecutionResult> {
  return runInternal(code, undefined, { buildOnly: true });
}

export async function executeCode(code: string, inputJson?: string): Promise<ExecutionResult> {
  return runInternal(code, inputJson, { buildOnly: false });
}

async function runInternal(
  code: string,
  inputJson: string | undefined,
  opts: { buildOnly: boolean },
): Promise<ExecutionResult> {
  // Clear any previously paused executor — new execution takes over
  _pausedExecutor = null;
  _pausedBuildTime = null;

  const logs: string[] = [];
  const narrative: string[] = [];
  let capturedExecutor: InstanceType<typeof footprint.FlowChartExecutor> | null =
    null;
  let capturedBuildTime: BuildTimeInfo | null = null;

  // Monkey-patch FlowChartExecutor to capture the instance — and in
  // build-only mode, no-op the `run()` method so user code that calls
  // `await executor.run(...)` returns immediately without executing
  // any stage. Build-time recorders + capturedBuildTime still populate
  // because the chart is built BEFORE `executor.run()` is called.
  const OriginalExecutor = footprint.FlowChartExecutor;
  const ProxiedExecutor = class extends OriginalExecutor {
    constructor(...args: ConstructorParameters<typeof OriginalExecutor>) {
      super(...args);
      capturedExecutor = this;
      // Attach the runtime overlay recorder to every executor — events
      // flow into runtimeOverlayHandle's pub-sub bus as the chart runs.
      // The handle is captured into `capturedBuildTime.runtimeOverlay`
      // after the run completes.
      this.attachFlowRecorder(runtimeOverlayHandle.recorder as any);
    }
    async run(...args: Parameters<InstanceType<typeof OriginalExecutor>["run"]>) {
      if (opts.buildOnly) {
        // Skip the actual run — return an empty snapshot-shaped result.
        // User code that destructures the return won't blow up; type
        // safety is informal here (same as the rest of the sandbox).
        return undefined as unknown as Awaited<
          ReturnType<InstanceType<typeof OriginalExecutor>["run"]>
        >;
      }
      return super.run(...args);
    }
  };

  // Live trace recorder — attached to every builder before .build(),
  // captures the chart shape as it's constructed (v6.0 StructureRecorder
  // pattern). The resulting graph lands on `BuildTimeInfo.traceGraph`.
  const traceRecorderHandle = createTraceStructureRecorder({ id: "playground-trace" });
  // Live runtime overlay — attached to every executor at construction
  // time, captures runtime execution events into a runtimeStageId-
  // keyed map. Pairs with traceGraph for the L7.10 <TracedFlow> path.
  const runtimeOverlayHandle = createTraceRuntimeOverlay({ id: "playground-runtime" });

  // Monkey-patch FlowChartBuilder to capture build-time metadata
  const OriginalBuilder = footprint.FlowChartBuilder;
  const ProxiedBuilder = class extends OriginalBuilder {
    constructor() {
      super();
      // Attach the trace recorder fresh per build — though we reuse the
      // handle (single-build context here), the seed-replay path on
      // attachStructureRecorder ensures it observes the root.
      this.attachStructureRecorder(traceRecorderHandle.recorder);
    }
    build() {
      // Capture mermaid before build (toMermaid uses internal tree)
      let mermaid = "";
      try {
        mermaid = this.toMermaid();
      } catch {
        // builder may not have a tree yet
      }

      const chart = super.build();

      // Capture spec and descriptions from the built chart
      const stageDescs: Record<string, string> = {};
      if (chart.stageDescriptions) {
        for (const [k, v] of chart.stageDescriptions) {
          stageDescs[k] = v;
        }
      }

      let mcpTool: unknown;
      try {
        mcpTool = (chart as any).toMCPTool?.();
      } catch {
        // chart may not expose toMCPTool in older builds
      }

      let openAPI: unknown;
      let openAPIError: string | undefined;
      try {
        openAPI = (chart as any).toOpenAPI?.();
      } catch (e) {
        openAPIError = e instanceof Error ? e.message : String(e);
      }

      // Snapshot the trace graph at .build() time — by now every
      // StructureRecorder event has fired and the graph is complete.
      const traceGraph = traceRecorderHandle.getGraph();

      capturedBuildTime = {
        mermaid,
        spec: chart.buildTimeStructure as unknown as Record<string, unknown>,
        description: chart.description || "",
        stageDescriptions: stageDescs,
        inputSchema: chart.inputSchema,
        outputSchema: chart.outputSchema,
        mcpTool,
        openAPI,
        openAPIError,
        traceGraph,
      };

      return chart;
    }
  };

  // Monkey-patch flowChart() — captures build-time metadata.
  // TypedScope factory is auto-embedded by FlowChartBuilder.build() — no manual setup needed.
  // v6.0 signature: (name, fn, id, options?). Legacy 5-positional with
  // buildTimeExtractor was removed in v6.0 — user samples that still use
  // the old shape will fall through to a no-op (the proxied flowChart
  // accepts but ignores extra positional args for backwards source
  // compat at the editor level).
  const proxiedFlowChart = (
    name: string,
    fn: any,
    id: string,
    optionsOrLegacyExtractor?: any,
    legacyDescription?: string
  ) => {
    // Discriminate: options-bag (plain object literal) vs legacy 4th
    // positional (a function = old buildTimeExtractor — discarded in v6.0).
    const isOptionsBag =
      optionsOrLegacyExtractor !== null &&
      typeof optionsOrLegacyExtractor === "object" &&
      !Array.isArray(optionsOrLegacyExtractor);
    const options = isOptionsBag ? optionsOrLegacyExtractor : undefined;
    // If the user passed a description in the legacy 5th slot, merge it
    // into the options bag (so sample code authored against v5 still
    // surfaces descriptions on the seed).
    const mergedOptions =
      legacyDescription !== undefined
        ? { ...(options ?? {}), description: legacyDescription }
        : options;
    // Note: structureRecorders passed via the user's options bag would
    // be ignored here — the ProxiedBuilder attaches its own recorder
    // in the constructor for trace capture. For v6.0 playground demos,
    // the trace graph is captured automatically; user-provided
    // recorders flow through if attached via `.attachStructureRecorder()`
    // post-construction.
    void mergedOptions; // explicit acknowledgment; options forwarded via description above
    return new ProxiedBuilder().start(name, fn, id, mergedOptions?.description);
  };

  // Narrative is captured via executor.getNarrative() in ProxiedExecutor below.

  // Strip import statements (footprint, zod, @anthropic-ai/sdk — all injected into context)
  let cleaned = code.replace(
    /import\s+(?:type\s+)?\{[^}]*\}\s*from\s*['"](?:footprint(?:js)?(?:\/(?:advanced|trace))?|foottrace(?:\/(?:write|paths))?|zod)['"];?\s*\n?/g,
    ""
  );
  // Strip default import from @anthropic-ai/sdk (e.g. `import Anthropic from '@anthropic-ai/sdk';`)
  cleaned = cleaned.replace(
    /import\s+\w+\s*from\s*['"]@anthropic-ai\/sdk['"];?\s*\n?/g,
    ""
  );

  // Remove IIFE wrapper: (async () => { ... })().catch(console.error); or })();
  cleaned = cleaned.replace(/\(async\s*\(\)\s*=>\s*\{\s*\n?/, "");
  cleaned = cleaned.replace(/\}\)\(\)(?:\.catch\(console\.error\))?;\s*$/, "");

  // Remove async main() pattern: async function main() { ... } main().catch(console.error);
  cleaned = cleaned.replace(/^async\s+function\s+main\s*\(\)\s*\{\s*\n?/m, "");
  cleaned = cleaned.replace(/\}\s*\n*main\(\)\.catch\(console\.error\);\s*$/, "");

  // Transform TypeScript → JavaScript (strips type annotations, `as` casts, etc.)
  try {
    cleaned = transform(cleaned, {
      transforms: ["typescript"],
      disableESTransforms: true,
    }).code;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      snapshot: null,
      logs,
      narrative,
      buildTime: null,
      error: `Syntax error: ${msg}`,
    };
  }

  // Parse user-provided input JSON (if any) and inject as INPUT variable
  let parsedInput: unknown = undefined;
  if (inputJson?.trim()) {
    try {
      parsedInput = JSON.parse(inputJson);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        snapshot: null,
        logs,
        narrative,
        buildTime: null,
        error: `Invalid input JSON: ${msg}`,
      };
    }
  }

  // Build execution context — all footprint exports + zod + our proxied classes
  const context: Record<string, unknown> = {
    ...footprint,
    // Engine recorders stay with the engine; migrated record names below
    // come from their canonical Foottrace owner on both 9.x and 10.x.
    ...engineTrace,
    ...foottrace,
    ...foottraceWrite,
    ...foottracePaths,
    z,
    INPUT: parsedInput,
    FlowChartExecutor: ProxiedExecutor,
    FlowChartBuilder: ProxiedBuilder,
    flowChart: proxiedFlowChart,
    // CombinedNarrativeBuilder removed in v1.0 — narrative captured via executor.getNarrative()
    console: {
      log: (...args: unknown[]) =>
        logs.push(
          args
            .map((a) =>
              typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)
            )
            .join(" ")
        ),
      error: (...args: unknown[]) =>
        logs.push("ERROR: " + args.map(String).join(" ")),
      warn: (...args: unknown[]) =>
        logs.push("WARN: " + args.map(String).join(" ")),
    },
    setTimeout,
    clearTimeout,
    Promise,
    fetch: window.fetch.bind(window),
    Anthropic,
  };

  const contextKeys = Object.keys(context);
  const contextValues = Object.values(context);

  // This is a playground — executing user code is the core feature
  // (same pattern as GraphiQL, CodeSandbox, TS Playground)
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(
    ...contextKeys,
    `return (async () => { ${cleaned} })()`
  );

  try {
    await fn(...contextValues);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { snapshot: null, logs, narrative, buildTime: capturedBuildTime, error: msg };
  }

  if (!capturedExecutor) {
    return {
      snapshot: null,
      logs,
      narrative,
      buildTime: capturedBuildTime,
      error: "No FlowChartExecutor was created",
    };
  }

  try {
    const snapshot = (capturedExecutor as any).getSnapshot();

    // Populate narrative from executor (getNarrative() combines flow + data narratives)
    try {
      const lines: string[] = (capturedExecutor as any).getNarrative?.() ?? [];
      if (lines.length > 0) {
        narrative.push(...lines);
      }
    } catch {
      // Narrative is optional — don't fail the result
    }

    // Capture structured narrative entries for ExplainableShell
    let narrativeEntries: ExecutionResult['narrativeEntries'];
    try {
      narrativeEntries = (capturedExecutor as any).getNarrativeEntries?.() ?? undefined;
    } catch {
      // Optional — don't fail
    }

    // Capture runtime structure (has resolved lazy subflow structures for drill-down)
    let runtimeStructure: ExecutionResult['runtimeStructure'];
    try {
      runtimeStructure = (capturedExecutor as any).getRuntimeStructure?.() ?? undefined;
    } catch {
      // Optional
    }

    // Detect pause state
    const isPaused = typeof (capturedExecutor as any).isPaused === 'function'
      && (capturedExecutor as any).isPaused();

    if (isPaused) {
      const checkpoint = (capturedExecutor as any).getCheckpoint();
      // Store executor for resumeExecution()
      _pausedExecutor = capturedExecutor;
      _pausedBuildTime = capturedBuildTime;
      return {
        snapshot,
        logs,
        narrative,
        narrativeEntries,
        buildTime: capturedBuildTime,
        runtimeStructure,
        paused: true,
        pauseData: checkpoint?.pauseData,
        pausedStageId: checkpoint?.pausedStageId,
      };
    }

    _pausedExecutor = null;
    // Snapshot the runtime overlay AFTER run completes — by now every
    // FlowRecorder event has fired and the overlay's executionOrder
    // is complete. Merge into the buildTime info so consumers get one
    // unified data blob for the L7.10 <TracedFlow> path.
    if (capturedBuildTime !== null) {
      const built: BuildTimeInfo = capturedBuildTime;
      capturedBuildTime = {
        ...built,
        runtimeOverlay: runtimeOverlayHandle.getOverlay(),
      };
    }
    return { snapshot, logs, narrative, narrativeEntries, buildTime: capturedBuildTime, runtimeStructure };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      snapshot: null,
      logs,
      narrative,
      buildTime: capturedBuildTime,
      error: `Snapshot failed: ${msg}`,
    };
  }
}

// ── Pause/Resume support ──────────────────────────────────────────────────

let _pausedExecutor: InstanceType<typeof footprint.FlowChartExecutor> | null = null;
let _pausedBuildTime: BuildTimeInfo | null = null;

/** Returns true if there is a paused executor waiting for resume. */
export function hasPausedExecution(): boolean {
  return _pausedExecutor !== null;
}

/** Resume a paused execution with the given input. */
export async function resumeExecution(resumeInput?: unknown): Promise<ExecutionResult> {
  const executor = _pausedExecutor;
  const buildTime = _pausedBuildTime;
  if (!executor) {
    return { snapshot: null, logs: [], narrative: [], buildTime: null, error: 'No paused execution to resume.' };
  }

  const checkpoint = (executor as any).getCheckpoint();
  if (!checkpoint) {
    _pausedExecutor = null;
    return { snapshot: null, logs: [], narrative: [], buildTime: null, error: 'No checkpoint available.' };
  }

  const logs: string[] = [];
  const narrative: string[] = [];

  try {
    await (executor as any).resume(checkpoint, resumeInput);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    _pausedExecutor = null;
    return { snapshot: null, logs, narrative, buildTime, error: `Resume failed: ${msg}` };
  }

  try {
    // The executor reuses its runtime — snapshot includes the full execution tree
    // (pre-pause stages + resume + continuation) in one continuous tree.
    const snapshot = (executor as any).getSnapshot();

    try {
      const lines: string[] = (executor as any).getNarrative?.() ?? [];
      if (lines.length > 0) narrative.push(...lines);
    } catch { /* optional */ }

    let narrativeEntries: ExecutionResult['narrativeEntries'];
    try {
      narrativeEntries = (executor as any).getNarrativeEntries?.() ?? undefined;
    } catch { /* optional */ }

    let runtimeStructure: ExecutionResult['runtimeStructure'];
    try {
      runtimeStructure = (executor as any).getRuntimeStructure?.() ?? undefined;
    } catch { /* optional */ }

    // Check if it paused again (multi-pause)
    const isPaused = typeof (executor as any).isPaused === 'function' && (executor as any).isPaused();
    if (isPaused) {
      const cp = (executor as any).getCheckpoint();
      return {
        snapshot, logs, narrative, narrativeEntries, buildTime, runtimeStructure,
        paused: true, pauseData: cp?.pauseData, pausedStageId: cp?.pausedStageId,
      };
    }

    _pausedExecutor = null;
    return { snapshot, logs, narrative, narrativeEntries, buildTime, runtimeStructure };
  } catch (e: unknown) {
    _pausedExecutor = null;
    const msg = e instanceof Error ? e.message : String(e);
    return { snapshot: null, logs, narrative, buildTime, error: `Snapshot failed: ${msg}` };
  }
}
