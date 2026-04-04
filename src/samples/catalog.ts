// Sample code imported as raw text strings via Vite's ?raw

// Quick Start
import loanCode from "./examples/quick-start/loan-application.ts?raw";

// Flowchart
import linearCode from "./examples/flowchart/01-linear.ts?raw";
import forkCode from "./examples/flowchart/02-fork.ts?raw";
import deciderCode from "./examples/flowchart/03-decider.ts?raw";
import selectorCode from "./examples/flowchart/04-selector.ts?raw";
import subflowCode from "./examples/flowchart/05-subflow.ts?raw";
import loopsCode from "./examples/flowchart/06-loops.ts?raw";
import lazySubflowCode from "./examples/flowchart/08-lazy-subflow.ts?raw";

// Features
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
import optionalScopeCode from "./examples/features/13-typed-scope-patterns.ts?raw";
import decideSelectCode from "./examples/features/16-decide-select.ts?raw";
import subflowRedactionCode from "./examples/features/17-subflow-redaction.ts?raw";
import compositeRecorderCode from "./examples/features/18-composite-recorder.ts?raw";
import pauseResumeCode from "./examples/features/19-pause-resume.ts?raw";
import structuralSubflowCode from "./examples/flowchart/07-structural-subflow.ts?raw";

// Flow Recorders
import simpleObserverCode from "./examples/flow-recorders/01-simple-observer.ts?raw";
import strategyComparisonCode from "./examples/flow-recorders/02-strategy-comparison.ts?raw";
import customRecorderCode from "./examples/flow-recorders/03-custom-recorder.ts?raw";
import multipleRecordersCode from "./examples/flow-recorders/04-multiple-recorders.ts?raw";
import edgeCasesCode from "./examples/flow-recorders/05-edge-cases.ts?raw";

// Errors
import inputSafetyCode from "./examples/errors/input-safety.ts?raw";
import structuredErrorCode from "./examples/errors/structured-error-flow.ts?raw";

// Integrations
import stateMachineCode from "./examples/integrations/state-machine.ts?raw";

// AI Agent Tools
import llmAgentToolCode from "../tutorials/llm-agent-tool.ts?raw";
import agentMemoryCode from "../tutorials/agent-memory.ts?raw";
import agentReactLoopCode from "./examples/quick-start/agent-react-loop.ts?raw";
import parallelAgentsCode from "./examples/quick-start/parallel-agents.ts?raw";

const DOCS = 'https://footprintjs.github.io/footPrint';

export interface Sample {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
  /** Default JSON for the INPUT variable panel (like GraphiQL variables). */
  defaultInput?: string;
  /** Link to the relevant guide page in the docs site. */
  guideLink?: string;
}

export const samples: Sample[] = [
  // ── Quick Start ──────────────────────────────────────────────────────────
  {
    id: "loan-application",
    name: "Loan Application",
    category: "Quick Start",
    description:
      "Full loan underwriting pipeline with credit check, DTI, employment verification, and conditional branching.",
    code: loanCode,
    guideLink: `${DOCS}/getting-started/quick-start/`,
    defaultInput: JSON.stringify(
      {
        app: {
          applicantName: "Bob Martinez",
          annualIncome: 42_000,
          monthlyDebts: 2_100,
          creditScore: 580,
          employmentStatus: "self-employed",
          employmentYears: 1,
          loanAmount: 40_000,
        },
      },
      null,
      2,
    ),
  },

  // ── Flowchart ────────────────────────────────────────────────────────────
  {
    id: "linear",
    name: "Linear Pipeline",
    category: "Flowchart",
    description: "The simplest flow — stages execute one after another: FetchUser → EnrichProfile → SendWelcomeEmail.",
    code: linearCode,
    guideLink: `${DOCS}/guides/building/`,
    defaultInput: JSON.stringify(
      { userId: 42 },
      null,
      2,
    ),
  },
  {
    id: "fork",
    name: "Fork (Parallel)",
    category: "Flowchart",
    description:
      "Fork runs inventory check and fraud check in parallel, then finalizes the order.",
    code: forkCode,
    guideLink: `${DOCS}/guides/building/`,
  },
  {
    id: "decider",
    name: "Decider (Conditional)",
    category: "Flowchart",
    description:
      "Classify a customer's tier and route to loyalty discount, upgrade prompt, or onboarding.",
    code: deciderCode,
    guideLink: `${DOCS}/guides/decision-branching/`,
  },
  {
    id: "selector",
    name: "Selector",
    category: "Flowchart",
    description: "Triage a patient's vitals and run matching screening branches in parallel.",
    code: selectorCode,
    guideLink: `${DOCS}/guides/decision-branching/`,
  },
  {
    id: "subflow",
    name: "Subflow",
    category: "Flowchart",
    description: "Nest a payment processing flowchart inside an order pipeline as a reusable subflow.",
    code: subflowCode,
    guideLink: `${DOCS}/guides/subflows/`,
  },
  {
    id: "loops",
    name: "Loops",
    category: "Flowchart",
    description: "Retry an unstable API with exponential backoff using loopTo and breakFn.",
    code: loopsCode,
    guideLink: `${DOCS}/guides/building/`,
  },
  {
    id: "structural-subflow",
    name: "Structural Subflow",
    category: "Flowchart",
    description: "Attach a pre-executed subflow's structure to the parent for visualization — without re-running it.",
    code: structuralSubflowCode,
    guideLink: `${DOCS}/guides/subflows/`,
  },
  {
    id: "lazy-subflow",
    name: "Lazy Subflow",
    category: "Flowchart",
    description:
      "Graph-of-services pattern — 3 lazy service branches, only selected ones resolve and execute.",
    code: lazySubflowCode,
    guideLink: `${DOCS}/guides/subflows/`,
    defaultInput: JSON.stringify(
      { requiredServices: ["auth", "payment"] },
      null,
      2,
    ),
  },

  // ── Features ─────────────────────────────────────────────────────────────
  {
    id: "values",
    name: "Scope Values",
    category: "Features",
    description:
      "Storing and reading values in scope — primitives, objects, and nested data.",
    code: valuesCode,
    guideLink: `${DOCS}/getting-started/key-concepts/`,
  },
  {
    id: "narrative",
    name: "Auto-Narrative",
    category: "Features",
    description:
      "Every read/write is observed automatically -- full causal trace with zero manual work.",
    code: narrativeCode,
    guideLink: `${DOCS}/guides/recording/`,
  },
  {
    id: "recorders",
    name: "Scope Recorders",
    category: "Features",
    description:
      "Recorders observe scope operations (read, write, commit, errors) for audit logs and telemetry.",
    code: recordersCode,
    guideLink: `${DOCS}/guides/recording/`,
  },
  {
    id: "typed-scope",
    name: "Typed Scope",
    category: "Features",
    description:
      "Define your scope schema with Zod for type-safe getters with runtime validation.",
    code: typedScopeCode,
    guideLink: `${DOCS}/getting-started/key-concepts/`,
  },
  {
    id: "metrics",
    name: "Metrics",
    category: "Features",
    description:
      "MetricRecorder tracks per-stage read/write counts and duration automatically.",
    code: metricsCode,
    guideLink: `${DOCS}/guides/recording/`,
  },
  {
    id: "streaming",
    name: "Streaming",
    category: "Features",
    description:
      "Streaming stages emit tokens incrementally via StreamCallback — onStart, onToken, onEnd lifecycle.",
    code: streamingCode,
    guideLink: `${DOCS}/guides/building/`,
  },
  {
    id: "error-handling",
    name: "Error Handling",
    category: "Features",
    description:
      "How to handle errors in pipelines with try/catch and DebugRecorder diagnostics.",
    code: errorHandlingCode,
    guideLink: `${DOCS}/guides/recording/`,
  },
  {
    id: "debug-mermaid",
    name: "Debug & Mermaid",
    category: "Features",
    description:
      "DebugRecorder captures every read/write/error; toMermaid() generates flowchart diagrams.",
    code: debugMermaidCode,
    guideLink: `${DOCS}/guides/recording/`,
  },
  {
    id: "break-fn",
    name: "Break Function",
    category: "Features",
    description:
      "Call breakFn() to stop the pipeline early — current stage commits, no further stages run.",
    code: breakFnCode,
    guideLink: `${DOCS}/guides/building/`,
  },
  {
    id: "contract-openapi",
    name: "Contract & OpenAPI",
    category: "Features",
    description:
      "Define I/O contracts on flowcharts and generate OpenAPI 3.1 specs from Zod or JSON Schema.",
    code: contractCode,
    guideLink: `${DOCS}/guides/self-describing/`,
  },
  {
    id: "flow-recorders",
    name: "Flow Recorders",
    category: "Features",
    description:
      "FlowRecorder observes engine-level events — decisions, loops, forks, and control flow.",
    code: flowRecordersCode,
    guideLink: `${DOCS}/guides/recording/`,
  },
  {
    id: "redaction",
    name: "Redaction",
    category: "Features",
    description:
      "Protect sensitive data (passwords, API keys) from leaking into narratives and debug logs.",
    code: redactionCode,
    guideLink: `${DOCS}/guides/recording/`,
  },
  {
    id: "optional-scope-factory",
    name: "TypedScope Patterns",
    category: "Features",
    description:
      "Three ways to use TypedScope: flowChart<T>() shorthand, FlowChartBuilder, and $-method escape hatches.",
    code: optionalScopeCode,
    guideLink: `${DOCS}/getting-started/key-concepts/`,
  },
  {
    id: "decide-select",
    name: "decide() / select()",
    category: "Features",
    description:
      "Auto-capture WHY a decider chose a branch — filter-style rules produce rich narrative: 'creditScore 750 gt 700 → approved'.",
    code: decideSelectCode,
    guideLink: `${DOCS}/guides/decision-branching/`,
  },
  {
    id: "subflow-redaction",
    name: "Subflow Redaction",
    category: "Features",
    description:
      "PII marked redacted in a subflow stage carries through outputMapper to the parent — narrative shows [REDACTED] throughout.",
    code: subflowRedactionCode,
    guideLink: `${DOCS}/guides/subflows/`,
  },
  {
    id: "composite-recorder",
    name: "Composite Recorder",
    category: "Features",
    description:
      "Bundle SLA monitoring, compliance audit, and metrics into one paymentObservability() preset — one call, three concerns covered.",
    code: compositeRecorderCode,
    guideLink: `${DOCS}/guides/recording/`,
  },
  {
    id: "pause-resume",
    name: "Pause / Resume",
    category: "Features",
    description:
      "Human-in-the-loop approval gate: pipeline pauses for manager review, creates a JSON-safe checkpoint, then resumes with the decision.",
    code: pauseResumeCode,
  },

  // ── Flow Recorder Strategies ─────────────────────────────────────────────
  {
    id: "simple-observer",
    name: "Simple Observer",
    category: "Flow Recorder Strategies",
    description:
      "The simplest FlowRecorder — an object with id and hooks to observe control flow events.",
    code: simpleObserverCode,
    guideLink: `${DOCS}/guides/recording/`,
  },
  {
    id: "strategy-comparison",
    name: "Strategy Comparison",
    category: "Flow Recorder Strategies",
    description:
      "Runs the same flowchart with every built-in narrative strategy side by side.",
    code: strategyComparisonCode,
    guideLink: `${DOCS}/guides/recording/`,
  },
  {
    id: "custom-recorder",
    name: "Custom Recorder",
    category: "Flow Recorder Strategies",
    description:
      "Three patterns for custom FlowRecorders — object literal, class, and factory function.",
    code: customRecorderCode,
    guideLink: `${DOCS}/guides/recording/`,
  },
  {
    id: "multiple-recorders",
    name: "Multiple Recorders",
    category: "Flow Recorder Strategies",
    description:
      "Attach multiple FlowRecorders to the same execution — each sees events independently.",
    code: multipleRecordersCode,
    guideLink: `${DOCS}/guides/recording/`,
  },
  {
    id: "recorder-edge-cases",
    name: "Recorder Edge Cases",
    category: "Flow Recorder Strategies",
    description:
      "FlowRecorder behavior at boundaries — zero loops, single iterations, and recorder errors.",
    code: edgeCasesCode,
    guideLink: `${DOCS}/guides/recording/`,
  },

  // ── Input & Validation ───────────────────────────────────────────────────
  {
    id: "input-safety",
    name: "Input Safety",
    category: "Input & Validation",
    description:
      "Schema validation, readonly guards, frozen args — three layers of input protection.",
    code: inputSafetyCode,
  },
  {
    id: "structured-errors",
    name: "Structured Errors",
    category: "Input & Validation",
    description:
      "InputValidationError preserves field-level details through FlowRecorders and narrative.",
    code: structuredErrorCode,
  },

  // ── Integrations ─────────────────────────────────────────────────────────
  {
    id: "state-machine",
    name: "State Machine",
    category: "Integrations",
    description:
      "FootPrint complements an existing state machine — each state handler runs a traced flowchart.",
    code: stateMachineCode,
    guideLink: `${DOCS}/guides/subflows/`,
  },

  // ── AI Agent Tools ────────────────────────────────────────────────────────
  {
    id: "agent-memory",
    name: "Agent Memory (Multi-Turn)",
    category: "AI Agent Tools",
    description:
      "Multi-turn conversation with persistent memory. PrepareMemory loads history before each LLM call; CommitMemory saves after — both narrative-visible.",
    code: agentMemoryCode,
  },
  {
    id: "agent-react-loop",
    name: "Agent ReAct Loop",
    category: "AI Agent Tools",
    description:
      "Agent loop with RouteResponse decider pattern — routes between tool execution and finalization. Shows 2 tool calls then final answer with no message duplication.",
    code: agentReactLoopCode,
  },
  {
    id: "parallel-agents",
    name: "Parallel Agents",
    category: "AI Agent Tools",
    description:
      "Run research + writing agents in parallel (fan-out), then merge results with an LLM call (fan-in). Each branch runs in isolated scope.",
    code: parallelAgentsCode,
  },
  {
    id: "llm-agent-tool",
    name: "Claude Agent + FootPrint Tool",
    category: "AI Agent Tools",
    description:
      "Expose a flowchart as an MCP tool. Claude calls it and explains the decision using the automatic causal trace.",
    code: llmAgentToolCode,
    guideLink: `${DOCS}/guides/self-describing/`,
    defaultInput: JSON.stringify(
      {
        apiKey: "",
        model: "claude-haiku-4-5-20251001",
        applicant: {
          applicantName: "Sarah Chen",
          creditScore: 720,
          monthlyIncome: 5000,
          monthlyDebts: 1800,
        },
      },
      null,
      2,
    ),
  },
];
