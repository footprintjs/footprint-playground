import * as footprint from "footprintjs";
import { transform } from "sucrase";
import { z } from "zod";

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
  /** Structured narrative entries with type/depth/stageName for semantic rendering */
  narrativeEntries?: Array<{ type: string; text: string; depth: number; stageName?: string; stepNumber?: number }>;
  /** Build-time metadata captured from the builder */
  buildTime: BuildTimeInfo | null;
  /** Runtime structure (spec + resolved dynamic subflows). Used for drill-down. */
  runtimeStructure?: Record<string, unknown>;
  error?: string;
}

export async function executeCode(code: string, inputJson?: string): Promise<ExecutionResult> {
  const logs: string[] = [];
  const narrative: string[] = [];
  let capturedExecutor: InstanceType<typeof footprint.FlowChartExecutor> | null =
    null;
  let capturedBuildTime: BuildTimeInfo | null = null;

  // Monkey-patch FlowChartExecutor to capture the instance
  const OriginalExecutor = footprint.FlowChartExecutor;
  const ProxiedExecutor = class extends OriginalExecutor {
    constructor(...args: ConstructorParameters<typeof OriginalExecutor>) {
      super(...args);
      capturedExecutor = this;
    }
  };

  // Monkey-patch FlowChartBuilder to capture build-time metadata
  const OriginalBuilder = footprint.FlowChartBuilder;
  const ProxiedBuilder = class extends OriginalBuilder {
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

      capturedBuildTime = {
        mermaid,
        spec: chart.buildTimeStructure as unknown as Record<string, unknown>,
        description: chart.description || "",
        stageDescriptions: stageDescs,
        inputSchema: chart.inputSchema,
        outputSchema: chart.outputSchema,
      };

      return chart;
    }
  };

  // Also monkey-patch the flowChart() shorthand — it creates a FlowChartBuilder internally
  const proxiedFlowChart = (
    name: string,
    fn: any,
    id: string,
    buildTimeExtractor?: any,
    description?: string
  ) => {
    return new ProxiedBuilder(buildTimeExtractor).start(
      name,
      fn,
      id,
      description
    );
  };

  // Monkey-patch typedFlowChart() — same pattern, also creates FlowChartBuilder internally
  const proxiedTypedFlowChart = (
    name: string,
    fn: any,
    id: string,
    buildTimeExtractor?: any,
    description?: string
  ) => {
    return new ProxiedBuilder(buildTimeExtractor).start(
      name,
      fn,
      id,
      description
    );
  };

  // Narrative is captured via executor.getNarrative() in ProxiedExecutor below.

  // Strip import statements (footprint and zod — both are injected into context)
  let cleaned = code.replace(
    /import\s+(?:type\s+)?\{[^}]*\}\s*from\s*['"](?:footprint(?:\/advanced)?|zod)['"];?\s*\n?/g,
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
    z,
    INPUT: parsedInput,
    FlowChartExecutor: ProxiedExecutor,
    FlowChartBuilder: ProxiedBuilder,
    flowChart: proxiedFlowChart,
    typedFlowChart: proxiedTypedFlowChart,
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
