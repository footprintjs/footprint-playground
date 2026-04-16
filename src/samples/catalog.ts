// Sample code imported as raw text strings via Vite's ?raw
// Source: footPrint/examples/ (symlinked).
// Agent patterns live in the agentfootprint library/playground, not here.

// ── Building Blocks ──────────────────────────────────────────────────────
import linearCode from "./examples/building-blocks/01-linear.ts?raw";
import forkCode from "./examples/building-blocks/02-fork.ts?raw";
import deciderCode from "./examples/building-blocks/03-decider.ts?raw";
import selectorCode from "./examples/building-blocks/04-selector.ts?raw";
import subflowCode from "./examples/building-blocks/05-subflow.ts?raw";
import loopsCode from "./examples/building-blocks/06-loops.ts?raw";
import lazySubflowCode from "./examples/building-blocks/07-lazy-subflow.ts?raw";

// ── Explainers — Building Blocks ─────────────────────────────────────────
import linearExplainer from "./examples/building-blocks/01-linear.md?raw";
import forkExplainer from "./examples/building-blocks/02-fork.md?raw";
import deciderExplainer from "./examples/building-blocks/03-decider.md?raw";
import selectorExplainer from "./examples/building-blocks/04-selector.md?raw";
import subflowExplainer from "./examples/building-blocks/05-subflow.md?raw";
import loopsExplainer from "./examples/building-blocks/06-loops.md?raw";
import lazySubflowExplainer from "./examples/building-blocks/07-lazy-subflow.md?raw";

// ── Explainers — High-value features ─────────────────────────────────────
import causalLinearExplainer from "./examples/post-execution/causal-chain/01-linear.md?raw";
import pauseLinearExplainer from "./examples/runtime-features/pause-resume/01-linear.md?raw";
import contractExplainer from "./examples/features/10-contract-openapi.md?raw";
import streamingExplainer from "./examples/features/06-streaming.md?raw";
import redactionExplainer from "./examples/features/12-redaction.md?raw";

// ── Runtime Features ─────────────────────────────────────────────────────
// Streaming
import streamLinearCode from "./examples/runtime-features/streaming/01-linear.ts?raw";
import streamSubflowCode from "./examples/runtime-features/streaming/02-subflow.ts?raw";
import streamLoopCode from "./examples/runtime-features/streaming/03-loop.ts?raw";
// Pause / Resume
import pauseLinearCode from "./examples/runtime-features/pause-resume/01-linear.ts?raw";
import pauseDeciderCode from "./examples/runtime-features/pause-resume/02-decider.ts?raw";
import pauseSubflowCode from "./examples/runtime-features/pause-resume/03-subflow.ts?raw";
import pauseSelectorCode from "./examples/runtime-features/pause-resume/04-selector-branch.ts?raw";
import pauseNoContinuationCode from "./examples/runtime-features/pause-resume/05-no-continuation.ts?raw";
// Break
import breakLoopCode from "./examples/runtime-features/break/01-loop.ts?raw";
import breakSubflowCode from "./examples/runtime-features/break/02-subflow.ts?raw";
import breakDeciderCode from "./examples/runtime-features/break/03-decider.ts?raw";
// Data Recorder
import metricSubflowCode from "./examples/runtime-features/data-recorder/01-metric-subflow.ts?raw";
import metricLoopCode from "./examples/runtime-features/data-recorder/02-metric-loop.ts?raw";
// Flow Recorder
import flowSubflowCode from "./examples/runtime-features/flow-recorder/04-subflow-events.ts?raw";
import flowSelectorCode from "./examples/runtime-features/flow-recorder/05-selector-events.ts?raw";
// Combined Recorder
import combinedSubflowCode from "./examples/runtime-features/combined-recorder/04-subflow.ts?raw";
// Redaction
import redactionDeciderCode from "./examples/runtime-features/redaction/03-decider.ts?raw";

// ── Legacy Features (flat) ───────────────────────────────────────────────
import valuesCode from "./examples/features/01-values.ts?raw";
import narrativeCode from "./examples/features/02-narrative.ts?raw";
import recordersCode from "./examples/features/03-recorders.ts?raw";
import typedScopeCode from "./examples/features/04-typed-scope.ts?raw";
import metricsCode from "./examples/features/05-metrics.ts?raw";
import streamingCode from "./examples/features/06-streaming.ts?raw";
import errorHandlingCode from "./examples/features/07-error-handling.ts?raw";
import debugMermaidCode from "./examples/features/08-debug-and-mermaid.ts?raw";
import breakFnCode from "./examples/features/09-break-fn.ts?raw";
import contractCode from "./examples/features/10-contract-openapi.ts?raw";
import flowRecordersCode from "./examples/features/11-flow-recorders.ts?raw";
import redactionCode from "./examples/features/12-redaction.ts?raw";
import typedScopePatternsCode from "./examples/features/13-typed-scope-patterns.ts?raw";
import subflowRedactionCode from "./examples/features/17-subflow-redaction.ts?raw";
import compositeRecorderCode from "./examples/features/18-composite-recorder.ts?raw";
import pauseResumeCode from "./examples/features/19-pause-resume.ts?raw";
import recorderOperationsCode from "./examples/features/21-recorder-operations.ts?raw";

// Flow Recorder Strategies
import simpleObserverCode from "./examples/flow-recorders/01-simple-observer.ts?raw";
import strategyComparisonCode from "./examples/flow-recorders/02-strategy-comparison.ts?raw";
import customRecorderCode from "./examples/flow-recorders/03-custom-recorder.ts?raw";
import multipleRecordersCode from "./examples/flow-recorders/04-multiple-recorders.ts?raw";
import edgeCasesCode from "./examples/flow-recorders/05-edge-cases.ts?raw";

// Errors
import inputSafetyCode from "./examples/errors/input-safety.ts?raw";
import structuredErrorCode from "./examples/errors/structured-error-flow.ts?raw";

// ── Post-Execution ───────────────────────────────────────────────────────
import causalLinearCode from "./examples/post-execution/causal-chain/01-linear.ts?raw";
import causalDeciderCode from "./examples/post-execution/causal-chain/02-decider.ts?raw";
import causalSubflowCode from "./examples/post-execution/causal-chain/03-subflow.ts?raw";
import causalLoopCode from "./examples/post-execution/causal-chain/04-loop.ts?raw";
import causalDiamondCode from "./examples/post-execution/causal-chain/05-diamond.ts?raw";
import qualityRootCauseCode from "./examples/post-execution/quality-trace/02-root-cause.ts?raw";
import snapshotBasicCode from "./examples/post-execution/snapshot/01-basic.ts?raw";
import snapshotSubtreeCode from "./examples/post-execution/snapshot/02-subtree.ts?raw";
import snapshotCommitLogCode from "./examples/post-execution/snapshot/03-commit-log.ts?raw";
import narrativeQueryCode from "./examples/post-execution/narrative-query/01-get-narrative.ts?raw";

// ── Build-Time Features ──────────────────────────────────────────────────
import contractZodCode from "./examples/build-time-features/contract/01-zod-schema.ts?raw";
import contractJsonCode from "./examples/build-time-features/contract/02-json-schema.ts?raw";
import openApiCode from "./examples/build-time-features/self-describing/01-openapi.ts?raw";
import mcpToolCode from "./examples/build-time-features/self-describing/02-mcp-tool.ts?raw";
import mermaidCode from "./examples/build-time-features/self-describing/03-mermaid.ts?raw";
import filterRulesCode from "./examples/build-time-features/decide-select/01-filter-rules.ts?raw";

// ── Use Cases ────────────────────────────────────────────────────────────
import loanCode from "./examples/getting-started/loan-application.ts?raw";
import stateMachineCode from "./examples/integrations/state-machine.ts?raw";
import llmAgentToolCode from "./examples/integrations/llm-agent-tool.ts?raw";
import agentLoopCode from "./examples/integrations/agent-loop.ts?raw";
import agentLoopExplainer from "./examples/integrations/agent-loop.md?raw";


const DOCS = 'https://footprintjs.github.io/footPrint';

export interface Sample {
  id: string;
  name: string;
  /** Top-level group (shown as sidebar section header). */
  group: string;
  /** Sub-group within the group (collapsible folder). */
  subgroup?: string;
  description: string;
  code: string;
  /** Raw markdown string rendered in the "Explain" tab. When present, the tab is enabled. */
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
  // RUNTIME FEATURES
  // ════════════════════════════════════════════════════════════════════════
  // Streaming
  { id: "stream-linear", name: "Linear", group: "Runtime Features", subgroup: "Streaming", description: "Basic streaming stage — tokens emitted incrementally via StreamCallback.", code: streamLinearCode, guideLink: `${DOCS}/guides/features/streaming/` },
  { id: "stream-subflow", name: "Subflow", group: "Runtime Features", subgroup: "Streaming", description: "Streaming inside a nested subflow — tokens route to parent's handlers.", code: streamSubflowCode },
  { id: "stream-loop", name: "Loop", group: "Runtime Features", subgroup: "Streaming", description: "Streaming across loop iterations — each iteration triggers full lifecycle.", code: streamLoopCode },
  // Pause / Resume
  { id: "pause-linear", name: "Linear", group: "Runtime Features", subgroup: "Pause / Resume", description: "Basic pause/resume with JSON-safe checkpoint.", code: pauseLinearCode, explainer: pauseLinearExplainer, guideLink: `${DOCS}/guides/features/pause-resume/` },
  { id: "pause-decider", name: "Decider Branch", group: "Runtime Features", subgroup: "Pause / Resume", description: "Pause IN a decider branch — post-decider Done runs after resume.", code: pauseDeciderCode },
  { id: "pause-subflow", name: "Subflow", group: "Runtime Features", subgroup: "Pause / Resume", description: "Pause inside subflow — resume continues parent pipeline.", code: pauseSubflowCode },
  { id: "pause-selector", name: "Selector Branch", group: "Runtime Features", subgroup: "Pause / Resume", description: "Pause in a selector branch — post-selector stages run after resume.", code: pauseSelectorCode },
  { id: "pause-no-continuation", name: "No Continuation", group: "Runtime Features", subgroup: "Pause / Resume", description: "Edge case: decider is last stage — clean termination after resume.", code: pauseNoContinuationCode },
  // Break
  { id: "break-loop", name: "Loop Exit", group: "Runtime Features", subgroup: "Break", description: "$break() exits loop — pagination pattern.", code: breakLoopCode },
  { id: "break-subflow", name: "Subflow Scoped", group: "Runtime Features", subgroup: "Break", description: "$break() inside subflow stops subflow only — parent continues.", code: breakSubflowCode },
  { id: "break-decider", name: "Decider Branch", group: "Runtime Features", subgroup: "Break", description: "$break() in decider branch — pipeline-wide stop.", code: breakDeciderCode },
  // Data Recorder
  { id: "metric-subflow", name: "Metrics + Subflow", group: "Runtime Features", subgroup: "Data Recorder", description: "MetricRecorder tracks reads/writes across subflow boundary.", code: metricSubflowCode },
  { id: "metric-loop", name: "Metrics + Loop", group: "Runtime Features", subgroup: "Data Recorder", description: "MetricRecorder aggregation across loop iterations.", code: metricLoopCode },
  // Flow Recorder
  { id: "flow-subflow", name: "Subflow Events", group: "Runtime Features", subgroup: "Flow Recorder", description: "onSubflowEntry/Exit events from custom FlowRecorder.", code: flowSubflowCode },
  { id: "flow-selector", name: "Selector Events", group: "Runtime Features", subgroup: "Flow Recorder", description: "onSelected events — which branches picked, how many total.", code: flowSelectorCode },
  // Combined Recorder
  { id: "combined-subflow", name: "Narrative + Subflow", group: "Runtime Features", subgroup: "Combined Recorder", description: "Merged narrative across subflow entry/exit with data ops.", code: combinedSubflowCode },
  // Redaction
  { id: "redaction-decider", name: "Decider Branch", group: "Runtime Features", subgroup: "Redaction", description: "Redaction policy applies to all branches — [REDACTED] in narrative.", code: redactionDeciderCode },

  // ════════════════════════════════════════════════════════════════════════
  // POST-EXECUTION
  // ════════════════════════════════════════════════════════════════════════
  { id: "causal-linear", name: "Linear Chain", group: "Post-Execution", subgroup: "Causal Chain", description: "Simplest backtrack: C ← B ← A through read/write dependencies.", code: causalLinearCode, explainer: causalLinearExplainer },
  { id: "causal-decider", name: "Through Decider", group: "Post-Execution", subgroup: "Causal Chain", description: "Backtrack through chosen branch back to decision input.", code: causalDeciderCode },
  { id: "causal-subflow", name: "Through Subflow", group: "Post-Execution", subgroup: "Causal Chain", description: "Backtrack crosses subflow boundary — parent reads subflow writes.", code: causalSubflowCode },
  { id: "causal-loop", name: "Through Loop", group: "Post-Execution", subgroup: "Causal Chain", description: "Backtrack through loop iterations to find data origin.", code: causalLoopCode },
  { id: "causal-diamond", name: "Diamond (Fan-in)", group: "Post-Execution", subgroup: "Causal Chain", description: "Fan-in DAG — two branches read from same seed, shared parent node.", code: causalDiamondCode },
  { id: "quality-root-cause", name: "Root Cause", group: "Post-Execution", subgroup: "Quality Trace", description: "QualityRecorder + qualityTrace() — find where quality dropped most.", code: qualityRootCauseCode },
  { id: "snapshot-basic", name: "State Inspection", group: "Post-Execution", subgroup: "Snapshot", description: "getSnapshot() — shared state, execution tree, commit log.", code: snapshotBasicCode },
  { id: "snapshot-subtree", name: "Subtree Drill-Down", group: "Post-Execution", subgroup: "Snapshot", description: "getSubtreeSnapshot() and listSubflowPaths() for subflow inspection.", code: snapshotSubtreeCode },
  { id: "snapshot-commitlog", name: "Commit Log Queries", group: "Post-Execution", subgroup: "Snapshot", description: "findLastWriter() and findCommit() for backtracking.", code: snapshotCommitLogCode },
  { id: "narrative-query", name: "Three Narrative APIs", group: "Post-Execution", subgroup: "Narrative Query", description: "getNarrative(), getNarrativeEntries(), getFlowNarrative().", code: narrativeQueryCode },

  // ════════════════════════════════════════════════════════════════════════
  // BUILD-TIME FEATURES
  // ════════════════════════════════════════════════════════════════════════
  { id: "contract-zod", name: "Zod Schema", group: "Build-Time", subgroup: "Contract", description: "Zod input/output schemas — compile-time types + runtime validation.", code: contractZodCode },
  { id: "contract-json", name: "JSON Schema", group: "Build-Time", subgroup: "Contract", description: "Plain JSON Schema (no Zod) — contract without extra dependencies.", code: contractJsonCode },
  { id: "self-openapi", name: "OpenAPI 3.1", group: "Build-Time", subgroup: "Self-Describing", description: "chart.toOpenAPI() generates a complete spec from contract schemas.", code: openApiCode },
  { id: "self-mcp-tool", name: "MCP Tool", group: "Build-Time", subgroup: "Self-Describing", description: "chart.toMCPTool() — numbered step list + input schema for any MCP server.", code: mcpToolCode },
  { id: "self-mermaid", name: "Mermaid Diagram", group: "Build-Time", subgroup: "Self-Describing", description: "chart.toMermaid() generates a flowchart diagram string.", code: mermaidCode },
  { id: "filter-rules", name: "Filter Rules", group: "Build-Time", subgroup: "decide() / select()", description: "Filter object rules with evidence — creditScore gt 700 ✓ → approved.", code: filterRulesCode },

  // ════════════════════════════════════════════════════════════════════════
  // FEATURES (legacy flat — existing playground samples)
  // ════════════════════════════════════════════════════════════════════════
  { id: "values", name: "Scope Values", group: "Features", description: "Storing and reading values in scope — primitives, objects, nested data.", code: valuesCode },
  { id: "narrative", name: "Auto-Narrative", group: "Features", description: "Every read/write observed automatically — full causal trace.", code: narrativeCode },
  { id: "recorders", name: "Scope Recorders", group: "Features", description: "Recorders observe scope operations for audit logs and telemetry.", code: recordersCode },
  { id: "typed-scope", name: "Typed Scope", group: "Features", description: "flowChart<T>() — compile-time typed property access on scope.", code: typedScopeCode },
  { id: "typed-scope-patterns", name: "TypedScope Patterns", group: "Features", description: "Three ways to use TypedScope: shorthand, builder, $-methods.", code: typedScopePatternsCode },
  { id: "metrics", name: "Metrics", group: "Features", description: "MetricRecorder — per-stage read/write counts and duration.", code: metricsCode },
  { id: "streaming", name: "Streaming", group: "Features", description: "Streaming stages emit tokens via StreamCallback lifecycle.", code: streamingCode, explainer: streamingExplainer },
  { id: "error-handling", name: "Error Handling", group: "Features", description: "Errors in pipelines with try/catch and DebugRecorder.", code: errorHandlingCode },
  { id: "debug-mermaid", name: "Debug & Mermaid", group: "Features", description: "DebugRecorder captures every op; toMermaid() generates diagrams.", code: debugMermaidCode },
  { id: "break-fn", name: "Break Function", group: "Features", description: "$break() stops pipeline early — current stage commits.", code: breakFnCode },
  { id: "contract-openapi", name: "Contract & OpenAPI", group: "Features", description: "I/O contracts + OpenAPI 3.1 from Zod or JSON Schema.", code: contractCode, explainer: contractExplainer },
  { id: "flow-recorders", name: "Flow Recorders", group: "Features", description: "FlowRecorder — decisions, loops, forks, control flow.", code: flowRecordersCode },
  { id: "redaction", name: "Redaction", group: "Features", description: "Protect sensitive data from leaking into narratives.", code: redactionCode, explainer: redactionExplainer },
  { id: "subflow-redaction", name: "Subflow Redaction", group: "Features", description: "PII carries through outputMapper — [REDACTED] throughout.", code: subflowRedactionCode },
  { id: "composite-recorder", name: "Composite Recorder", group: "Features", description: "Bundle SLA, compliance, metrics into one preset.", code: compositeRecorderCode },
  { id: "recorder-operations", name: "Recorder Operations", group: "Features", description: "Translate, Accumulate, Aggregate — three operations on auto-collected data.", code: recorderOperationsCode },
  { id: "pause-resume", name: "Pause / Resume", group: "Features", description: "Human-in-the-loop: pause for manager review, resume with decision.", code: pauseResumeCode },
  { id: "input-safety", name: "Input Safety", group: "Features", description: "Schema validation, readonly guards, frozen args.", code: inputSafetyCode },
  { id: "structured-errors", name: "Structured Errors", group: "Features", description: "InputValidationError preserves field-level details.", code: structuredErrorCode },

  // Flow Recorder Strategies
  { id: "simple-observer", name: "Simple Observer", group: "Features", subgroup: "Strategies", description: "Simplest FlowRecorder — object with id and hooks.", code: simpleObserverCode },
  { id: "strategy-comparison", name: "Strategy Comparison", group: "Features", subgroup: "Strategies", description: "All built-in narrative strategies side by side.", code: strategyComparisonCode },
  { id: "custom-recorder", name: "Custom Recorder", group: "Features", subgroup: "Strategies", description: "Three patterns: object literal, class, factory function.", code: customRecorderCode },
  { id: "multiple-recorders", name: "Multiple Recorders", group: "Features", subgroup: "Strategies", description: "Multiple FlowRecorders — each sees events independently.", code: multipleRecordersCode },
  { id: "recorder-edge-cases", name: "Recorder Edge Cases", group: "Features", subgroup: "Strategies", description: "Zero loops, single iterations, recorder errors.", code: edgeCasesCode },

  // ════════════════════════════════════════════════════════════════════════
  // USE CASES
  // ════════════════════════════════════════════════════════════════════════
  { id: "loan-application", name: "Loan Application", group: "Use Cases", description: "Full loan underwriting with credit check, DTI, conditional branching.", code: loanCode, guideLink: `${DOCS}/getting-started/quick-start/`, defaultInput: JSON.stringify({ app: { applicantName: "Bob Martinez", annualIncome: 42_000, monthlyDebts: 2_100, creditScore: 580, employmentStatus: "self-employed", employmentYears: 1, loanAmount: 40_000 } }, null, 2) },
  { id: "agent-loop", name: "Agent Loop", group: "Use Cases", description: "ReAct-style agent built with pure footprintjs — decider + loopTo + $break. No external agent library.", code: agentLoopCode, explainer: agentLoopExplainer, defaultInput: JSON.stringify({ userQuery: "When will my order arrive?" }, null, 2) },
  { id: "llm-agent-tool", name: "Claude + FootPrint Tool", group: "Use Cases", description: "Flowchart as MCP tool — Claude explains using the causal trace.", code: llmAgentToolCode, guideLink: `${DOCS}/guides/features/self-describing/`, defaultInput: JSON.stringify({ apiKey: "", model: "claude-haiku-4-5-20251001", applicant: { applicantName: "Sarah Chen", creditScore: 720, monthlyIncome: 5000, monthlyDebts: 1800 } }, null, 2) },
  { id: "state-machine", name: "State Machine", group: "Use Cases", description: "FootPrint complements state machines — each handler runs a traced flowchart.", code: stateMachineCode },
];
