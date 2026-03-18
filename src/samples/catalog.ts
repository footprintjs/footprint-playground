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
import optionalScopeCode from "./examples/features/13-optional-scope-factory.ts?raw";

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

export interface Sample {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
  /** Default JSON for the INPUT variable panel (like GraphiQL variables). */
  defaultInput?: string;
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
  },
  {
    id: "decider",
    name: "Decider (Conditional)",
    category: "Flowchart",
    description:
      "Classify a customer's tier and route to loyalty discount, upgrade prompt, or onboarding.",
    code: deciderCode,
  },
  {
    id: "selector",
    name: "Selector",
    category: "Flowchart",
    description: "Triage a patient's vitals and run matching screening branches in parallel.",
    code: selectorCode,
  },
  {
    id: "subflow",
    name: "Subflow",
    category: "Flowchart",
    description: "Nest a payment processing flowchart inside an order pipeline as a reusable subflow.",
    code: subflowCode,
  },
  {
    id: "loops",
    name: "Loops",
    category: "Flowchart",
    description: "Retry an unstable API with exponential backoff using loopTo and breakFn.",
    code: loopsCode,
  },
  {
    id: "lazy-subflow",
    name: "Lazy Subflow",
    category: "Flowchart",
    description:
      "Graph-of-services pattern — 3 lazy service branches, only selected ones resolve and execute.",
    code: lazySubflowCode,
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
  },
  {
    id: "narrative",
    name: "Auto-Narrative",
    category: "Features",
    description:
      "Every setValue/getValue is observed by NarrativeRecorder — full causal trace with zero manual work.",
    code: narrativeCode,
  },
  {
    id: "recorders",
    name: "Scope Recorders",
    category: "Features",
    description:
      "Recorders observe scope operations (read, write, commit, errors) for audit logs and telemetry.",
    code: recordersCode,
  },
  {
    id: "typed-scope",
    name: "Typed Scope",
    category: "Features",
    description:
      "Define your scope schema with Zod for type-safe getters with runtime validation.",
    code: typedScopeCode,
  },
  {
    id: "metrics",
    name: "Metrics",
    category: "Features",
    description:
      "MetricRecorder tracks per-stage read/write counts and duration automatically.",
    code: metricsCode,
  },
  {
    id: "streaming",
    name: "Streaming",
    category: "Features",
    description:
      "Streaming stages emit tokens incrementally via StreamCallback — onStart, onToken, onEnd lifecycle.",
    code: streamingCode,
  },
  {
    id: "error-handling",
    name: "Error Handling",
    category: "Features",
    description:
      "How to handle errors in pipelines with try/catch and DebugRecorder diagnostics.",
    code: errorHandlingCode,
  },
  {
    id: "debug-mermaid",
    name: "Debug & Mermaid",
    category: "Features",
    description:
      "DebugRecorder captures every read/write/error; toMermaid() generates flowchart diagrams.",
    code: debugMermaidCode,
  },
  {
    id: "break-fn",
    name: "Break Function",
    category: "Features",
    description:
      "Call breakFn() to stop the pipeline early — current stage commits, no further stages run.",
    code: breakFnCode,
  },
  {
    id: "contract-openapi",
    name: "Contract & OpenAPI",
    category: "Features",
    description:
      "Define I/O contracts on flowcharts and generate OpenAPI 3.1 specs from Zod or JSON Schema.",
    code: contractCode,
  },
  {
    id: "flow-recorders",
    name: "Flow Recorders",
    category: "Features",
    description:
      "FlowRecorder observes engine-level events — decisions, loops, forks, and control flow.",
    code: flowRecordersCode,
  },
  {
    id: "redaction",
    name: "Redaction",
    category: "Features",
    description:
      "Protect sensitive data (passwords, API keys) from leaking into narratives and debug logs.",
    code: redactionCode,
  },
  {
    id: "optional-scope-factory",
    name: "Optional Scope Factory",
    category: "Features",
    description:
      "FlowChartExecutor defaults to ScopeFacade when no scopeFactory is provided — less boilerplate.",
    code: optionalScopeCode,
  },

  // ── Flow Recorder Strategies ─────────────────────────────────────────────
  {
    id: "simple-observer",
    name: "Simple Observer",
    category: "Flow Recorder Strategies",
    description:
      "The simplest FlowRecorder — an object with id and hooks to observe control flow events.",
    code: simpleObserverCode,
  },
  {
    id: "strategy-comparison",
    name: "Strategy Comparison",
    category: "Flow Recorder Strategies",
    description:
      "Runs the same flowchart with every built-in narrative strategy side by side.",
    code: strategyComparisonCode,
  },
  {
    id: "custom-recorder",
    name: "Custom Recorder",
    category: "Flow Recorder Strategies",
    description:
      "Three patterns for custom FlowRecorders — object literal, class, and factory function.",
    code: customRecorderCode,
  },
  {
    id: "multiple-recorders",
    name: "Multiple Recorders",
    category: "Flow Recorder Strategies",
    description:
      "Attach multiple FlowRecorders to the same execution — each sees events independently.",
    code: multipleRecordersCode,
  },
  {
    id: "recorder-edge-cases",
    name: "Recorder Edge Cases",
    category: "Flow Recorder Strategies",
    description:
      "FlowRecorder behavior at boundaries — zero loops, single iterations, and recorder errors.",
    code: edgeCasesCode,
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
  },
];
