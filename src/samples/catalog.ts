// Sample code imported as raw text strings via Vite's ?raw.
// Source of truth: footPrint/examples/ — symlinked at ./examples.
// Agent patterns live in agentfootprint's playground, not here.

// ── Building Blocks ──────────────────────────────────────────────────────
import linearCode from "./examples/building-blocks/01-linear.ts?raw";
import forkCode from "./examples/building-blocks/02-fork.ts?raw";
import deciderCode from "./examples/building-blocks/03-decider.ts?raw";
import selectorCode from "./examples/building-blocks/04-selector.ts?raw";
import subflowCode from "./examples/building-blocks/05-subflow.ts?raw";
import loopsCode from "./examples/building-blocks/06-loops.ts?raw";
import lazySubflowCode from "./examples/building-blocks/07-lazy-subflow.ts?raw";

import linearExplainer from "./examples/building-blocks/01-linear.md?raw";
import forkExplainer from "./examples/building-blocks/02-fork.md?raw";
import deciderExplainer from "./examples/building-blocks/03-decider.md?raw";
import selectorExplainer from "./examples/building-blocks/04-selector.md?raw";
import subflowExplainer from "./examples/building-blocks/05-subflow.md?raw";
import loopsExplainer from "./examples/building-blocks/06-loops.md?raw";
import lazySubflowExplainer from "./examples/building-blocks/07-lazy-subflow.md?raw";

// ── Runtime Features — Streaming ─────────────────────────────────────────
import streamLinearCode from "./examples/runtime-features/streaming/01-linear.ts?raw";
import streamSubflowCode from "./examples/runtime-features/streaming/02-subflow.ts?raw";
import streamLoopCode from "./examples/runtime-features/streaming/03-loop.ts?raw";
import streamingExplainer from "./examples/runtime-features/streaming/01-linear.md?raw";

// ── Runtime Features — Pause / Resume ────────────────────────────────────
import pauseLinearCode from "./examples/runtime-features/pause-resume/01-linear.ts?raw";
import pauseDeciderCode from "./examples/runtime-features/pause-resume/02-decider.ts?raw";
import pauseSubflowCode from "./examples/runtime-features/pause-resume/03-subflow.ts?raw";
import pauseSelectorCode from "./examples/runtime-features/pause-resume/04-selector-branch.ts?raw";
import pauseNoContinuationCode from "./examples/runtime-features/pause-resume/05-no-continuation.ts?raw";
import pausableRootCode from "./examples/runtime-features/pause-resume/06-pausable-root.ts?raw";
import pauseLinearExplainer from "./examples/runtime-features/pause-resume/01-linear.md?raw";

// ── Runtime Features — Break ─────────────────────────────────────────────
import breakLoopCode from "./examples/runtime-features/break/01-loop.ts?raw";
import breakSubflowCode from "./examples/runtime-features/break/02-subflow.ts?raw";
import breakDeciderCode from "./examples/runtime-features/break/03-decider.ts?raw";
import breakPropagateCode from "./examples/runtime-features/break/04-subflow-propagate.ts?raw";
import breakLoopExplainer from "./examples/runtime-features/break/01-loop.md?raw";

// ── Runtime Features — Redaction ─────────────────────────────────────────
import redactionLinearCode from "./examples/runtime-features/redaction/01-linear.ts?raw";
import redactionSubflowCode from "./examples/runtime-features/redaction/02-subflow.ts?raw";
import redactionDeciderCode from "./examples/runtime-features/redaction/03-decider.ts?raw";
import redactionExplainer from "./examples/runtime-features/redaction/01-linear.md?raw";

// ── Runtime Features — Data Recorder ─────────────────────────────────────
import metricRecorderCode from "./examples/runtime-features/data-recorder/01-metric-recorder.ts?raw";
import debugRecorderCode from "./examples/runtime-features/data-recorder/02-debug-recorder.ts?raw";
import customRecorderCode from "./examples/runtime-features/data-recorder/03-custom-recorder.ts?raw";
import metricSubflowCode from "./examples/runtime-features/data-recorder/04-subflow.ts?raw";
import metricLoopCode from "./examples/runtime-features/data-recorder/05-loop.ts?raw";
import metricsExplainer from "./examples/runtime-features/data-recorder/01-metric-recorder.md?raw";
import debugMermaidExplainer from "./examples/runtime-features/data-recorder/02-debug-recorder.md?raw";

// ── Runtime Features — Flow Recorder ─────────────────────────────────────
import simpleObserverCode from "./examples/runtime-features/flow-recorder/01-simple-observer.ts?raw";
import customClassCode from "./examples/runtime-features/flow-recorder/02-custom-class.ts?raw";
import multipleRecordersCode from "./examples/runtime-features/flow-recorder/03-multiple.ts?raw";
import flowSubflowCode from "./examples/runtime-features/flow-recorder/04-subflow-events.ts?raw";
import flowSelectorCode from "./examples/runtime-features/flow-recorder/05-selector-events.ts?raw";
import topologyCode from "./examples/runtime-features/flow-recorder/06-topology.ts?raw";
import inOutCode from "./examples/runtime-features/flow-recorder/07-inout.ts?raw";
import manifestCode from "./examples/runtime-features/flow-recorder/08-manifest.ts?raw";
import strategyComparisonCode from "./examples/runtime-features/flow-recorder/09-strategy-comparison.ts?raw";
import edgeCasesCode from "./examples/runtime-features/flow-recorder/10-edge-cases.ts?raw";
import flowRecordersExplainer from "./examples/runtime-features/flow-recorder/01-simple-observer.md?raw";

// ── Runtime Features — Combined Recorder ─────────────────────────────────
import combinedNarrativeCode from "./examples/runtime-features/combined-recorder/01-narrative.ts?raw";
import compositeRecorderCode from "./examples/runtime-features/combined-recorder/02-composite.ts?raw";
import recorderOperationsCode from "./examples/runtime-features/combined-recorder/03-operations.ts?raw";
import combinedSubflowCode from "./examples/runtime-features/combined-recorder/04-subflow.ts?raw";
import customRendererCode from "./examples/runtime-features/combined-recorder/05-custom-renderer-subflow-inputs.ts?raw";

// ── Runtime Features — Emit ──────────────────────────────────────────────
import emitCustomCode from "./examples/runtime-features/emit/01-custom-events.ts?raw";

// ── Build-Time — Contract ────────────────────────────────────────────────
import contractZodCode from "./examples/build-time-features/contract/01-zod-schema.ts?raw";
import contractJsonCode from "./examples/build-time-features/contract/02-json-schema.ts?raw";
import contractMapperCode from "./examples/build-time-features/contract/03-mapper.ts?raw";

// ── Build-Time — Self-Describing ─────────────────────────────────────────
import openApiCode from "./examples/build-time-features/self-describing/01-openapi.ts?raw";
import mcpToolCode from "./examples/build-time-features/self-describing/02-mcp-tool.ts?raw";
import mermaidCode from "./examples/build-time-features/self-describing/03-mermaid.ts?raw";
import specCode from "./examples/build-time-features/self-describing/04-spec.ts?raw";
import contractExplainer from "./examples/build-time-features/self-describing/01-openapi.md?raw";

// ── Build-Time — decide() / select() ─────────────────────────────────────
import filterRulesCode from "./examples/build-time-features/decide-select/01-filter-rules.ts?raw";
import functionRulesCode from "./examples/build-time-features/decide-select/02-function-rules.ts?raw";
import mixedRulesCode from "./examples/build-time-features/decide-select/03-mixed-rules.ts?raw";
import selectParallelCode from "./examples/build-time-features/decide-select/04-select-parallel.ts?raw";

// ── Post-Execution ───────────────────────────────────────────────────────
import causalLinearCode from "./examples/post-execution/causal-chain/01-linear.ts?raw";
import causalDeciderCode from "./examples/post-execution/causal-chain/02-decider.ts?raw";
import causalSubflowCode from "./examples/post-execution/causal-chain/03-subflow.ts?raw";
import causalLoopCode from "./examples/post-execution/causal-chain/04-loop.ts?raw";
import causalDiamondCode from "./examples/post-execution/causal-chain/05-diamond.ts?raw";
import causalLinearExplainer from "./examples/post-execution/causal-chain/01-linear.md?raw";

import qualityBasicCode from "./examples/post-execution/quality-trace/01-basic.ts?raw";
import qualityRootCauseCode from "./examples/post-execution/quality-trace/02-root-cause.ts?raw";

import snapshotBasicCode from "./examples/post-execution/snapshot/01-basic.ts?raw";
import snapshotSubtreeCode from "./examples/post-execution/snapshot/02-subtree.ts?raw";
import snapshotCommitLogCode from "./examples/post-execution/snapshot/03-commit-log.ts?raw";
import composableRunnerCode from "./examples/post-execution/snapshot/04-composable-runner.ts?raw";

import narrativeBasicCode from "./examples/post-execution/narrative-query/01-get-narrative.ts?raw";
import narrativeEntriesCode from "./examples/post-execution/narrative-query/02-entries.ts?raw";
import narrativeFlowCode from "./examples/post-execution/narrative-query/03-flow-narrative.ts?raw";

// ── Errors ───────────────────────────────────────────────────────────────
import inputSafetyCode from "./examples/errors/input-safety.ts?raw";
import structuredErrorCode from "./examples/errors/structured-error-flow.ts?raw";
import stageErrorsCode from "./examples/errors/03-stage-errors.ts?raw";

// ── Use Cases ────────────────────────────────────────────────────────────
import loanCode from "./examples/getting-started/loan-application.ts?raw";
import stateMachineCode from "./examples/integrations/state-machine.ts?raw";
import llmAgentToolCode from "./examples/integrations/llm-agent-tool.ts?raw";
import agentLoopCode from "./examples/integrations/agent-loop.ts?raw";
import agentLoopExplainer from "./examples/integrations/agent-loop.md?raw";
import ecommerceCheckoutCode from "./examples/integrations/ecommerce-checkout.ts?raw";
import ecommerceCheckoutExplainer from "./examples/integrations/ecommerce-checkout.md?raw";
import schoolSisEnrollCode from "./examples/integrations/school-sis-enroll.ts?raw";
import schoolSisEnrollExplainer from "./examples/integrations/school-sis-enroll.md?raw";

const DOCS = "https://footprintjs.github.io/footPrint";

export interface Sample {
  id: string;
  name: string;
  /** Top-level group (shown as sidebar section header). */
  group: string;
  /** Sub-group within the group (collapsible folder). */
  subgroup?: string;
  description: string;
  code: string;
  /** Raw markdown rendered in the "Explain" tab. When present, the tab is enabled. */
  explainer?: string;
  defaultInput?: string;
  guideLink?: string;
}

export const samples: Sample[] = [
  // ════════════════════════════════════════════════════════════════════════
  // BUILDING BLOCKS
  // ════════════════════════════════════════════════════════════════════════
  { id: "linear", name: "Linear Pipeline", group: "Building Blocks", description: "Stages execute one after another: FetchUser → EnrichProfile → SendWelcomeEmail.", code: linearCode, explainer: linearExplainer, guideLink: `${DOCS}/guides/building-blocks/stages/`, defaultInput: JSON.stringify({ userId: 42 }, null, 2) },
  { id: "fork", name: "Fork (Parallel)", group: "Building Blocks", description: "Fork runs inventory check and fraud check in parallel, then finalizes.", code: forkCode, explainer: forkExplainer, guideLink: `${DOCS}/guides/building-blocks/stages/` },
  { id: "decider", name: "Decider (Conditional)", group: "Building Blocks", description: "Classify a customer's tier and route to loyalty discount, upgrade, or onboarding.", code: deciderCode, explainer: deciderExplainer, guideLink: `${DOCS}/guides/building-blocks/decisions/` },
  { id: "selector", name: "Selector", group: "Building Blocks", description: "Triage a patient's vitals and run matching screening branches in parallel.", code: selectorCode, explainer: selectorExplainer, guideLink: `${DOCS}/guides/building-blocks/decisions/` },
  { id: "subflow", name: "Subflow", group: "Building Blocks", description: "Nest a payment processing flowchart inside an order pipeline.", code: subflowCode, explainer: subflowExplainer, guideLink: `${DOCS}/guides/building-blocks/subflows/` },
  { id: "loops", name: "Loops", group: "Building Blocks", description: "Retry an unstable API with exponential backoff using loopTo and $break.", code: loopsCode, explainer: loopsExplainer, guideLink: `${DOCS}/guides/patterns/loops-and-retry/` },
  { id: "lazy-subflow", name: "Lazy Subflow", group: "Building Blocks", description: "Graph-of-services — 3 lazy branches, only selected ones resolve and execute.", code: lazySubflowCode, explainer: lazySubflowExplainer, guideLink: `${DOCS}/guides/building-blocks/subflows/`, defaultInput: JSON.stringify({ requiredServices: ["auth", "payment"] }, null, 2) },

  // ════════════════════════════════════════════════════════════════════════
  // RUNTIME FEATURES — Streaming
  // ════════════════════════════════════════════════════════════════════════
  { id: "stream-linear", name: "Linear", group: "Runtime Features", subgroup: "Streaming", description: "Basic streaming stage — tokens emitted incrementally via StreamCallback.", code: streamLinearCode, explainer: streamingExplainer, guideLink: `${DOCS}/guides/features/streaming/` },
  { id: "stream-subflow", name: "Subflow", group: "Runtime Features", subgroup: "Streaming", description: "Streaming inside a nested subflow — tokens route to parent's handlers.", code: streamSubflowCode },
  { id: "stream-loop", name: "Loop", group: "Runtime Features", subgroup: "Streaming", description: "Streaming across loop iterations — each iteration triggers full lifecycle.", code: streamLoopCode },

  // ── Pause / Resume ──
  { id: "pause-linear", name: "Linear", group: "Runtime Features", subgroup: "Pause / Resume", description: "Basic pause/resume with JSON-safe checkpoint.", code: pauseLinearCode, explainer: pauseLinearExplainer, guideLink: `${DOCS}/guides/features/pause-resume/` },
  { id: "pause-decider", name: "Decider Branch", group: "Runtime Features", subgroup: "Pause / Resume", description: "Pause IN a decider branch — post-decider Done runs after resume.", code: pauseDeciderCode },
  { id: "pause-subflow", name: "Subflow", group: "Runtime Features", subgroup: "Pause / Resume", description: "Pause inside subflow — resume continues parent pipeline.", code: pauseSubflowCode },
  { id: "pause-selector", name: "Selector Branch", group: "Runtime Features", subgroup: "Pause / Resume", description: "Pause in a selector branch — post-selector stages run after resume.", code: pauseSelectorCode },
  { id: "pause-no-continuation", name: "No Continuation", group: "Runtime Features", subgroup: "Pause / Resume", description: "Edge case: decider is last stage — clean termination after resume.", code: pauseNoContinuationCode },
  { id: "pausable-root", name: "Pausable Root", group: "Runtime Features", subgroup: "Pause / Resume", description: "flowChart() accepts a PausableHandler as the root — single-stage pausable subflows.", code: pausableRootCode },

  // ── Break ──
  { id: "break-loop", name: "Loop Exit", group: "Runtime Features", subgroup: "Break", description: "$break() exits loop — pagination pattern.", code: breakLoopCode, explainer: breakLoopExplainer },
  { id: "break-subflow", name: "Subflow Scoped", group: "Runtime Features", subgroup: "Break", description: "$break() inside subflow stops subflow only — parent continues.", code: breakSubflowCode },
  { id: "break-decider", name: "Decider Branch", group: "Runtime Features", subgroup: "Break", description: "$break() in decider branch — pipeline-wide stop.", code: breakDeciderCode },
  { id: "break-propagate", name: "Subflow Propagate", group: "Runtime Features", subgroup: "Break", description: "Inner $break propagates to parent via SubflowMountOptions.propagateBreak.", code: breakPropagateCode },

  // ── Redaction ──
  { id: "redaction-linear", name: "Linear", group: "Runtime Features", subgroup: "Redaction", description: "RedactionPolicy — keys, regex patterns, field-level scrubbing. Recorders see [REDACTED].", code: redactionLinearCode, explainer: redactionExplainer },
  { id: "redaction-subflow", name: "Subflow Boundary", group: "Runtime Features", subgroup: "Redaction", description: "Redaction propagates across subflow boundary via shared _redactedKeys Set.", code: redactionSubflowCode },
  { id: "redaction-decider", name: "Decider Branch", group: "Runtime Features", subgroup: "Redaction", description: "Redaction policy applies to all branches — [REDACTED] in narrative.", code: redactionDeciderCode },

  // ── Data Recorder (scope ops: read / write / commit) ──
  { id: "metric-recorder", name: "Metric Recorder", group: "Runtime Features", subgroup: "Data Recorder", description: "MetricRecorder — per-stage read/write counts and duration.", code: metricRecorderCode, explainer: metricsExplainer },
  { id: "debug-recorder", name: "Debug Recorder", group: "Runtime Features", subgroup: "Data Recorder", description: "DebugRecorder captures every read, write, and error for diagnostics.", code: debugRecorderCode, explainer: debugMermaidExplainer },
  { id: "custom-recorder", name: "Custom Recorder", group: "Runtime Features", subgroup: "Data Recorder", description: "Implement Recorder interface — audit logs, compliance trails, custom telemetry.", code: customRecorderCode },
  { id: "metric-subflow", name: "Across Subflow", group: "Runtime Features", subgroup: "Data Recorder", description: "MetricRecorder tracks reads/writes across subflow boundary.", code: metricSubflowCode },
  { id: "metric-loop", name: "Across Loop", group: "Runtime Features", subgroup: "Data Recorder", description: "MetricRecorder aggregation across loop iterations.", code: metricLoopCode },

  // ── Flow Recorder (control flow: decisions / forks / loops / subflows) ──
  { id: "simple-observer", name: "Simple Observer", group: "Runtime Features", subgroup: "Flow Recorder", description: "Simplest FlowRecorder — object with id and hooks.", code: simpleObserverCode, explainer: flowRecordersExplainer },
  { id: "custom-class", name: "Custom Class", group: "Runtime Features", subgroup: "Flow Recorder", description: "Three patterns: object literal, class implementing FlowRecorder, extending NarrativeFlowRecorder.", code: customClassCode },
  { id: "multiple-recorders", name: "Multiple Recorders", group: "Runtime Features", subgroup: "Flow Recorder", description: "Multiple FlowRecorders — each sees events independently. Detach mid-lifecycle.", code: multipleRecordersCode },
  { id: "flow-subflow", name: "Subflow Events", group: "Runtime Features", subgroup: "Flow Recorder", description: "onSubflowEntry/Exit events from custom FlowRecorder.", code: flowSubflowCode },
  { id: "flow-selector", name: "Selector Events", group: "Runtime Features", subgroup: "Flow Recorder", description: "onSelected events — which branches picked, how many total.", code: flowSelectorCode },
  { id: "topology-recorder", name: "Topology Recorder", group: "Runtime Features", subgroup: "Flow Recorder", description: "Live composition graph — subflow / fork-branch / decision-branch nodes for streaming consumers.", code: topologyCode },
  { id: "inout-recorder", name: "InOut Recorder", group: "Runtime Features", subgroup: "Flow Recorder", description: "Subflow entry/exit pairs with mapper payloads — universal step boundaries.", code: inOutCode },
  { id: "manifest-recorder", name: "Subflow Manifest", group: "Runtime Features", subgroup: "Flow Recorder", description: "ManifestFlowRecorder — lightweight subflow catalog for LLM navigation.", code: manifestCode },
  { id: "strategy-comparison", name: "Strategy Comparison", group: "Runtime Features", subgroup: "Flow Recorder", description: "All built-in narrative strategies side by side over the same run.", code: strategyComparisonCode },
  { id: "recorder-edge-cases", name: "Edge Cases", group: "Runtime Features", subgroup: "Flow Recorder", description: "Zero loops, single iterations, high counts, multiple targets, perf measurement.", code: edgeCasesCode },

  // ── Combined Recorder (both interfaces: data + control flow) ──
  { id: "combined-narrative", name: "Auto-Narrative", group: "Runtime Features", subgroup: "Combined Recorder", description: "enableNarrative() observes every read/write merged with control flow — full causal trace.", code: combinedNarrativeCode },
  { id: "composite-recorder", name: "Composite Bundle", group: "Runtime Features", subgroup: "Combined Recorder", description: "Bundle SLA monitoring, compliance audit, debug diagnostics into one preset.", code: compositeRecorderCode },
  { id: "recorder-operations", name: "Translate / Accumulate / Aggregate", group: "Runtime Features", subgroup: "Combined Recorder", description: "Three operations on auto-collected data — computed during traversal, read at any time.", code: recorderOperationsCode },
  { id: "combined-subflow", name: "Across Subflow", group: "Runtime Features", subgroup: "Combined Recorder", description: "Merged narrative across subflow entry/exit with data ops.", code: combinedSubflowCode },
  { id: "custom-renderer", name: "Custom Renderer", group: "Runtime Features", subgroup: "Combined Recorder", description: "Custom NarrativeRenderer — control how subflow inputs and stage events are rendered.", code: customRendererCode },

  // ── Emit ──
  { id: "emit-custom", name: "Custom Events", group: "Runtime Features", subgroup: "Emit", description: "$emit() dispatches structured events on the third observer channel — auto-enriched, error-isolated.", code: emitCustomCode },

  // ════════════════════════════════════════════════════════════════════════
  // BUILD-TIME FEATURES
  // ════════════════════════════════════════════════════════════════════════
  // ── Contract ──
  { id: "contract-zod", name: "Zod Schema", group: "Build-Time", subgroup: "Contract", description: "Zod input/output schemas — compile-time types + runtime validation.", code: contractZodCode, explainer: contractExplainer },
  { id: "contract-json", name: "JSON Schema", group: "Build-Time", subgroup: "Contract", description: "Plain JSON Schema (no Zod) — contract without extra dependencies.", code: contractJsonCode },
  { id: "contract-mapper", name: "Output Mapper", group: "Build-Time", subgroup: "Contract", description: "Mapper projects internal scope to a clean public output — hide internals, derive new fields.", code: contractMapperCode },

  // ── Self-Describing ──
  { id: "self-openapi", name: "OpenAPI 3.1", group: "Build-Time", subgroup: "Self-Describing", description: "chart.toOpenAPI() generates a complete spec from contract schemas.", code: openApiCode },
  { id: "self-mcp-tool", name: "MCP Tool", group: "Build-Time", subgroup: "Self-Describing", description: "chart.toMCPTool() — numbered step list + input schema for any MCP server.", code: mcpToolCode },
  { id: "self-mermaid", name: "Mermaid Diagram", group: "Build-Time", subgroup: "Self-Describing", description: "chart.toMermaid() generates a flowchart diagram string.", code: mermaidCode },
  { id: "self-spec", name: "Raw Spec", group: "Build-Time", subgroup: "Self-Describing", description: "chart.buildTimeStructure — the raw graph that drives every other projection.", code: specCode },

  // ── decide() / select() ──
  { id: "filter-rules", name: "Filter Rules", group: "Build-Time", subgroup: "decide() / select()", description: "Filter object rules with evidence — creditScore gt 700 ✓ → approved.", code: filterRulesCode },
  { id: "function-rules", name: "Function Rules", group: "Build-Time", subgroup: "decide() / select()", description: "Function `when` clauses — full TS expressivity, read-tracking captures touched keys.", code: functionRulesCode },
  { id: "mixed-rules", name: "Mixed Rules", group: "Build-Time", subgroup: "decide() / select()", description: "Filter + function rules in the same decide() — pick the right tool per condition.", code: mixedRulesCode },
  { id: "select-parallel", name: "Select Parallel", group: "Build-Time", subgroup: "decide() / select()", description: "select() multi-match — every matched branch fires in parallel (vitals → screenings).", code: selectParallelCode },

  // ════════════════════════════════════════════════════════════════════════
  // POST-EXECUTION
  // ════════════════════════════════════════════════════════════════════════
  // ── Causal Chain ──
  { id: "causal-linear", name: "Linear Chain", group: "Post-Execution", subgroup: "Causal Chain", description: "Simplest backtrack: C ← B ← A through read/write dependencies.", code: causalLinearCode, explainer: causalLinearExplainer },
  { id: "causal-decider", name: "Through Decider", group: "Post-Execution", subgroup: "Causal Chain", description: "Backtrack through chosen branch back to decision input.", code: causalDeciderCode },
  { id: "causal-subflow", name: "Through Subflow", group: "Post-Execution", subgroup: "Causal Chain", description: "Backtrack crosses subflow boundary — parent reads subflow writes.", code: causalSubflowCode },
  { id: "causal-loop", name: "Through Loop", group: "Post-Execution", subgroup: "Causal Chain", description: "Backtrack through loop iterations to find data origin.", code: causalLoopCode },
  { id: "causal-diamond", name: "Diamond (Fan-in)", group: "Post-Execution", subgroup: "Causal Chain", description: "Fan-in DAG — two branches read from same seed, shared parent node.", code: causalDiamondCode },

  // ── Quality Trace ──
  { id: "quality-basic", name: "Basic", group: "Post-Execution", subgroup: "Quality Trace", description: "QualityRecorder scores each step; qualityTrace() backtracks from a low score.", code: qualityBasicCode },
  { id: "quality-root-cause", name: "Root Cause", group: "Post-Execution", subgroup: "Quality Trace", description: "qualityTrace() finds where quality dropped most — like an error stack trace for data quality.", code: qualityRootCauseCode },

  // ── Snapshot ──
  { id: "snapshot-basic", name: "State Inspection", group: "Post-Execution", subgroup: "Snapshot", description: "getSnapshot() — shared state, execution tree, commit log.", code: snapshotBasicCode },
  { id: "snapshot-subtree", name: "Subtree Drill-Down", group: "Post-Execution", subgroup: "Snapshot", description: "getSubtreeSnapshot() and listSubflowPaths() for subflow inspection.", code: snapshotSubtreeCode },
  { id: "snapshot-commitlog", name: "Commit Log Queries", group: "Post-Execution", subgroup: "Snapshot", description: "findLastWriter() and findCommit() for backtracking writes by stage or key.", code: snapshotCommitLogCode },
  { id: "composable-runner", name: "Composable Runner", group: "Post-Execution", subgroup: "Snapshot", description: "Mount runners as subflows via toFlowChart() — parent snapshot exposes child execution tree.", code: composableRunnerCode },

  // ── Narrative Query ──
  { id: "narrative-basic", name: "Three Views", group: "Post-Execution", subgroup: "Narrative Query", description: "getNarrativeEntries().map(e => e.text) for display, structured entries for code, type-filter for flow-only.", code: narrativeBasicCode },
  { id: "narrative-entries", name: "Structured Entries", group: "Post-Execution", subgroup: "Narrative Query", description: "Programmatic analysis: type counts, key-touch search, depth-tree walk, subflow direction.", code: narrativeEntriesCode },
  { id: "narrative-flow", name: "Flow Only", group: "Post-Execution", subgroup: "Narrative Query", description: "Filter to control-flow entries — skeleton view without data ops.", code: narrativeFlowCode },

  // ════════════════════════════════════════════════════════════════════════
  // ERRORS
  // ════════════════════════════════════════════════════════════════════════
  { id: "input-safety", name: "Input Validation", group: "Errors", description: "Schema validation, readonly guards, frozen args. InputValidationError preserves field-level details.", code: inputSafetyCode },
  { id: "structured-errors", name: "Structured Errors", group: "Errors", description: "Errors flow through FlowRecorder.onError — observable, structured, preserved through subflow boundaries.", code: structuredErrorCode },
  { id: "stage-errors", name: "Stage Errors", group: "Errors", description: "try/catch around executor.run(); DebugRecorder captures error details; partial metrics show what ran.", code: stageErrorsCode },

  // ════════════════════════════════════════════════════════════════════════
  // USE CASES
  // ════════════════════════════════════════════════════════════════════════
  // ── Business Workflows ──
  { id: "loan-application", name: "Loan Application", group: "Use Cases", subgroup: "Business Workflows", description: "Full loan underwriting with credit check, DTI, conditional branching.", code: loanCode, guideLink: `${DOCS}/getting-started/quick-start/`, defaultInput: JSON.stringify({ app: { applicantName: "Bob Martinez", annualIncome: 42_000, monthlyDebts: 2_100, creditScore: 580, employmentStatus: "self-employed", employmentYears: 1, loanAmount: 40_000 } }, null, 2) },
  { id: "ecommerce-checkout", name: "E-commerce Checkout", group: "Use Cases", subgroup: "Business Workflows", description: "Inventory + fraud parallel checks, decider routes to approve / manual / reject, $break short-circuits.", code: ecommerceCheckoutCode, explainer: ecommerceCheckoutExplainer, defaultInput: JSON.stringify({ orderId: "ORD-42", customerId: "cust-42", items: [{ sku: "WIDGET-A", qty: 2, unitPrice: 49.99 }, { sku: "GADGET-B", qty: 1, unitPrice: 99.99 }] }, null, 2) },
  { id: "school-sis-enroll", name: "School SIS — Enroll Student", group: "Use Cases", subgroup: "Business Workflows", description: "Validate → prereqs → capacity → decider (enroll / waitlist / reject). Compliance-grade narrative.", code: schoolSisEnrollCode, explainer: schoolSisEnrollExplainer, defaultInput: JSON.stringify({ studentId: "stu-101", studentName: "Alex Morgan", courseCode: "MATH-401", termId: "fall-2026" }, null, 2) },

  // ── AI & Agents ──
  { id: "agent-loop", name: "Agent Loop", group: "Use Cases", subgroup: "AI & Agents", description: "ReAct-style agent built with pure footprintjs — decider + loopTo + $break. No external agent library.", code: agentLoopCode, explainer: agentLoopExplainer, defaultInput: JSON.stringify({ userQuery: "When will my order arrive?" }, null, 2) },
  { id: "llm-agent-tool", name: "Claude + FootPrint Tool", group: "Use Cases", subgroup: "AI & Agents", description: "Flowchart as MCP tool — Claude explains using the causal trace.", code: llmAgentToolCode, guideLink: `${DOCS}/guides/features/self-describing/`, defaultInput: JSON.stringify({ apiKey: "", model: "claude-haiku-4-5-20251001", applicant: { applicantName: "Sarah Chen", creditScore: 720, monthlyIncome: 5000, monthlyDebts: 1800 } }, null, 2) },

  // ── Infrastructure ──
  { id: "state-machine", name: "State Machine", group: "Use Cases", subgroup: "Infrastructure", description: "FootPrint complements state machines — each handler runs a traced flowchart.", code: stateMachineCode },
];
