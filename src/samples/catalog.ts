// Sample code imported as raw text strings via Vite's ?raw
// Source: footPrint/examples/ (library's own examples, symlinked)

// ── Building Blocks ──────────────────────────────────────────────────────
import linearCode from "./examples/building-blocks/01-linear.ts?raw";
import forkCode from "./examples/building-blocks/02-fork.ts?raw";
import deciderCode from "./examples/building-blocks/03-decider.ts?raw";
import selectorCode from "./examples/building-blocks/04-selector.ts?raw";
import subflowCode from "./examples/building-blocks/05-subflow.ts?raw";
import loopsCode from "./examples/building-blocks/06-loops.ts?raw";
import structuralSubflowCode from "./examples/building-blocks/07-structural-subflow.ts?raw";
import lazySubflowCode from "./examples/building-blocks/08-lazy-subflow.ts?raw";

// ── Features ─────────────────────────────────────────────────────────────
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
import decideSelectCode from "./examples/features/16-decide-select.ts?raw";
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

// ── Use Cases ────────────────────────────────────────────────────────────
import loanCode from "./examples/getting-started/loan-application.ts?raw";
import agentReactLoopCode from "./examples/integrations/agent-react-loop.ts?raw";
import parallelAgentsCode from "./examples/integrations/parallel-agents.ts?raw";
import agentMemoryCode from "./examples/integrations/agent-memory.ts?raw";
import llmAgentToolCode from "./examples/integrations/llm-agent-tool.ts?raw";
import stateMachineCode from "./examples/integrations/state-machine.ts?raw";

// ── Agent Patterns (from agentfootprint/examples/) ──────────────────────
import agentSimpleLLMCode from "./agent-examples/basics/01-simple-llm-call.ts?raw";
import agentWithToolsCode from "./agent-examples/basics/02-agent-with-tools.ts?raw";
import agentRAGCode from "./agent-examples/basics/03-rag-retrieval.ts?raw";
import agentPromptStrategiesCode from "./agent-examples/providers/04-prompt-strategies.ts?raw";
import agentFlowchartCode from "./agent-examples/orchestration/07-flowchart-pipeline.ts?raw";
import agentSwarmCode from "./agent-examples/orchestration/08-swarm-delegation.ts?raw";
import agentRecordersCode from "./agent-examples/observability/10-recorders.ts?raw";
import agentStreamingCode from "./agent-examples/orchestration/18-streaming-events.ts?raw";
import agentGatedToolsCode from "./agent-examples/security/20-permission-gated-tools.ts?raw";
import agentFallbackCode from "./agent-examples/resilience/21-provider-fallback.ts?raw";
import agentMemoryStoreCode from "./agent-examples/memory/22-persistent-memory.ts?raw";
import agentExplainCode from "./agent-examples/observability/26-explain-recorder.ts?raw";

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
  // ════════════════════════════════════════════════════════════════════════
  // BUILDING BLOCKS — Flowchart primitives: stage types, branching, composition
  // ════════════════════════════════════════════════════════════════════════
  {
    id: "linear",
    name: "Linear Pipeline",
    category: "Building Blocks",
    description: "The simplest flow — stages execute one after another: FetchUser → EnrichProfile → SendWelcomeEmail.",
    code: linearCode,
    guideLink: `${DOCS}/guides/building-blocks/stages/`,
    defaultInput: JSON.stringify({ userId: 42 }, null, 2),
  },
  {
    id: "fork",
    name: "Fork (Parallel)",
    category: "Building Blocks",
    description: "Fork runs inventory check and fraud check in parallel, then finalizes the order.",
    code: forkCode,
    guideLink: `${DOCS}/guides/building-blocks/stages/`,
  },
  {
    id: "decider",
    name: "Decider (Conditional)",
    category: "Building Blocks",
    description: "Classify a customer's tier and route to loyalty discount, upgrade prompt, or onboarding.",
    code: deciderCode,
    guideLink: `${DOCS}/guides/building-blocks/decisions/`,
  },
  {
    id: "selector",
    name: "Selector",
    category: "Building Blocks",
    description: "Triage a patient's vitals and run matching screening branches in parallel.",
    code: selectorCode,
    guideLink: `${DOCS}/guides/building-blocks/decisions/`,
  },
  {
    id: "subflow",
    name: "Subflow",
    category: "Building Blocks",
    description: "Nest a payment processing flowchart inside an order pipeline as a reusable subflow.",
    code: subflowCode,
    guideLink: `${DOCS}/guides/building-blocks/subflows/`,
  },
  {
    id: "loops",
    name: "Loops",
    category: "Building Blocks",
    description: "Retry an unstable API with exponential backoff using loopTo and breakFn.",
    code: loopsCode,
    guideLink: `${DOCS}/guides/patterns/loops-and-retry/`,
  },
  {
    id: "structural-subflow",
    name: "Structural Subflow",
    category: "Building Blocks",
    description: "Attach a pre-executed subflow's structure to the parent for visualization — without re-running it.",
    code: structuralSubflowCode,
    guideLink: `${DOCS}/guides/building-blocks/subflows/`,
  },
  {
    id: "lazy-subflow",
    name: "Lazy Subflow",
    category: "Building Blocks",
    description: "Graph-of-services pattern — 3 lazy service branches, only selected ones resolve and execute.",
    code: lazySubflowCode,
    guideLink: `${DOCS}/guides/building-blocks/subflows/`,
    defaultInput: JSON.stringify({ requiredServices: ["auth", "payment"] }, null, 2),
  },
  {
    id: "decide-select",
    name: "decide() / select()",
    category: "Building Blocks",
    description: "Auto-capture WHY a decider chose a branch — filter-style rules produce rich narrative: 'creditScore 750 gt 700 → approved'.",
    code: decideSelectCode,
    guideLink: `${DOCS}/guides/building-blocks/decisions/`,
  },

  // ════════════════════════════════════════════════════════════════════════
  // FEATURES — Recorders, narrative, redaction, pause/resume, streaming, contracts
  // ════════════════════════════════════════════════════════════════════════
  {
    id: "values",
    name: "Scope Values",
    category: "Features",
    description: "Storing and reading values in scope — primitives, objects, and nested data.",
    code: valuesCode,
    guideLink: `${DOCS}/getting-started/key-concepts/`,
  },
  {
    id: "narrative",
    name: "Auto-Narrative",
    category: "Features",
    description: "Every read/write is observed automatically -- full causal trace with zero manual work.",
    code: narrativeCode,
    guideLink: `${DOCS}/guides/features/recorders/`,
  },
  {
    id: "recorders",
    name: "Scope Recorders",
    category: "Features",
    description: "Recorders observe scope operations (read, write, commit, errors) for audit logs and telemetry.",
    code: recordersCode,
    guideLink: `${DOCS}/guides/features/recorders/`,
  },
  {
    id: "typed-scope",
    name: "Typed Scope",
    category: "Features",
    description: "flowChart<T>() gives you compile-time typed property access on scope — no getValue/setValue.",
    code: typedScopeCode,
    guideLink: `${DOCS}/getting-started/key-concepts/`,
  },
  {
    id: "typed-scope-patterns",
    name: "TypedScope Patterns",
    category: "Features",
    description: "Three ways to use TypedScope: flowChart<T>() shorthand, FlowChartBuilder, and $-method escape hatches.",
    code: typedScopePatternsCode,
    guideLink: `${DOCS}/getting-started/key-concepts/`,
  },
  {
    id: "metrics",
    name: "Metrics",
    category: "Features",
    description: "MetricRecorder tracks per-stage read/write counts and duration automatically.",
    code: metricsCode,
    guideLink: `${DOCS}/guides/features/recorders/`,
  },
  {
    id: "streaming",
    name: "Streaming",
    category: "Features",
    description: "Streaming stages emit tokens incrementally via StreamCallback — onStart, onToken, onEnd lifecycle.",
    code: streamingCode,
    guideLink: `${DOCS}/guides/features/streaming/`,
  },
  {
    id: "error-handling",
    name: "Error Handling",
    category: "Features",
    description: "How to handle errors in pipelines with try/catch and DebugRecorder diagnostics.",
    code: errorHandlingCode,
    guideLink: `${DOCS}/guides/patterns/error-handling/`,
  },
  {
    id: "debug-mermaid",
    name: "Debug & Mermaid",
    category: "Features",
    description: "DebugRecorder captures every read/write/error; toMermaid() generates flowchart diagrams.",
    code: debugMermaidCode,
    guideLink: `${DOCS}/guides/features/recorders/`,
  },
  {
    id: "break-fn",
    name: "Break Function",
    category: "Features",
    description: "Call $break() to stop the pipeline early — current stage commits, no further stages run.",
    code: breakFnCode,
    guideLink: `${DOCS}/guides/building-blocks/stages/`,
  },
  {
    id: "contract-openapi",
    name: "Contract & OpenAPI",
    category: "Features",
    description: "Define I/O contracts on flowcharts and generate OpenAPI 3.1 specs from Zod or JSON Schema.",
    code: contractCode,
    guideLink: `${DOCS}/guides/features/self-describing/`,
  },
  {
    id: "flow-recorders",
    name: "Flow Recorders",
    category: "Features",
    description: "FlowRecorder observes engine-level events — decisions, loops, forks, and control flow.",
    code: flowRecordersCode,
    guideLink: `${DOCS}/guides/features/recorders/`,
  },
  {
    id: "redaction",
    name: "Redaction",
    category: "Features",
    description: "Protect sensitive data (passwords, API keys) from leaking into narratives and debug logs.",
    code: redactionCode,
    guideLink: `${DOCS}/guides/features/redaction/`,
  },
  {
    id: "subflow-redaction",
    name: "Subflow Redaction",
    category: "Features",
    description: "PII marked redacted in a subflow stage carries through outputMapper to the parent — narrative shows [REDACTED] throughout.",
    code: subflowRedactionCode,
    guideLink: `${DOCS}/guides/features/redaction/`,
  },
  {
    id: "composite-recorder",
    name: "Composite Recorder",
    category: "Features",
    description: "Bundle SLA monitoring, compliance audit, and metrics into one paymentObservability() preset.",
    code: compositeRecorderCode,
    guideLink: `${DOCS}/guides/features/recorders/`,
  },
  {
    id: "recorder-operations",
    name: "Recorder Operations",
    category: "Features",
    description: "Three operations on auto-collected data: Translate (per-step), Accumulate (progressive slider), Aggregate (grand total).",
    code: recorderOperationsCode,
    guideLink: `${DOCS}/guides/features/recorders/`,
  },
  {
    id: "pause-resume",
    name: "Pause / Resume",
    category: "Features",
    description: "Human-in-the-loop approval gate: pipeline pauses for manager review, resumes with the decision.",
    code: pauseResumeCode,
    guideLink: `${DOCS}/guides/features/pause-resume/`,
  },
  {
    id: "input-safety",
    name: "Input Safety",
    category: "Features",
    description: "Schema validation, readonly guards, frozen args — three layers of input protection.",
    code: inputSafetyCode,
    guideLink: `${DOCS}/guides/patterns/error-handling/`,
  },
  {
    id: "structured-errors",
    name: "Structured Errors",
    category: "Features",
    description: "InputValidationError preserves field-level details through FlowRecorders and narrative.",
    code: structuredErrorCode,
    guideLink: `${DOCS}/guides/patterns/error-handling/`,
  },

  // Flow Recorder Strategies
  {
    id: "simple-observer",
    name: "Simple Observer",
    category: "Features",
    description: "The simplest FlowRecorder — an object with id and hooks to observe control flow events.",
    code: simpleObserverCode,
    guideLink: `${DOCS}/guides/features/recorders/`,
  },
  {
    id: "strategy-comparison",
    name: "Strategy Comparison",
    category: "Features",
    description: "Runs the same flowchart with every built-in narrative strategy side by side.",
    code: strategyComparisonCode,
    guideLink: `${DOCS}/guides/features/recorders/`,
  },
  {
    id: "custom-recorder",
    name: "Custom Recorder",
    category: "Features",
    description: "Three patterns for custom FlowRecorders — object literal, class, and factory function.",
    code: customRecorderCode,
    guideLink: `${DOCS}/guides/features/recorders/`,
  },
  {
    id: "multiple-recorders",
    name: "Multiple Recorders",
    category: "Features",
    description: "Attach multiple FlowRecorders to the same execution — each sees events independently.",
    code: multipleRecordersCode,
    guideLink: `${DOCS}/guides/features/recorders/`,
  },
  {
    id: "recorder-edge-cases",
    name: "Recorder Edge Cases",
    category: "Features",
    description: "FlowRecorder behavior at boundaries — zero loops, single iterations, and recorder errors.",
    code: edgeCasesCode,
    guideLink: `${DOCS}/guides/features/recorders/`,
  },

  // ════════════════════════════════════════════════════════════════════════
  // USE CASES — Real-world patterns: loan processing, agent loops, tools
  // ════════════════════════════════════════════════════════════════════════
  {
    id: "loan-application",
    name: "Loan Application",
    category: "Use Cases",
    description: "Full loan underwriting pipeline with credit check, DTI, employment verification, and conditional branching.",
    code: loanCode,
    guideLink: `${DOCS}/getting-started/quick-start/`,
    defaultInput: JSON.stringify({
      app: {
        applicantName: "Bob Martinez",
        annualIncome: 42_000,
        monthlyDebts: 2_100,
        creditScore: 580,
        employmentStatus: "self-employed",
        employmentYears: 1,
        loanAmount: 40_000,
      },
    }, null, 2),
  },
  {
    id: "agent-react-loop",
    name: "Agent ReAct Loop",
    category: "Use Cases",
    description: "Agent loop with RouteResponse decider pattern — routes between tool execution and finalization.",
    code: agentReactLoopCode,
  },
  {
    id: "parallel-agents",
    name: "Parallel Agents",
    category: "Use Cases",
    description: "Run research + writing agents in parallel (fan-out), then merge results with an LLM call (fan-in).",
    code: parallelAgentsCode,
  },
  {
    id: "agent-memory",
    name: "Agent Memory (Multi-Turn)",
    category: "Use Cases",
    description: "Multi-turn conversation with persistent memory. PrepareMemory loads history before each LLM call; CommitMemory saves after.",
    code: agentMemoryCode,
  },
  {
    id: "llm-agent-tool",
    name: "Claude Agent + FootPrint Tool",
    category: "Use Cases",
    description: "Expose a flowchart as an MCP tool. Claude calls it and explains the decision using the automatic causal trace.",
    code: llmAgentToolCode,
    guideLink: `${DOCS}/guides/features/self-describing/`,
    defaultInput: JSON.stringify({
      apiKey: "",
      model: "claude-haiku-4-5-20251001",
      applicant: {
        applicantName: "Sarah Chen",
        creditScore: 720,
        monthlyIncome: 5000,
        monthlyDebts: 1800,
      },
    }, null, 2),
  },
  {
    id: "state-machine",
    name: "State Machine",
    category: "Use Cases",
    description: "FootPrint complements an existing state machine — each state handler runs a traced flowchart.",
    code: stateMachineCode,
    guideLink: `${DOCS}/guides/building-blocks/subflows/`,
  },

  // ════════════════════════════════════════════════════════════════════════
  // AGENT PATTERNS — agentfootprint library examples
  // ════════════════════════════════════════════════════════════════════════
  {
    id: "agent-simple-llm",
    name: "Simple LLM Call",
    category: "Agent Patterns",
    description: "LLMCall builder — single LLM call, no tools, no loop. The simplest agent concept.",
    code: agentSimpleLLMCode,
  },
  {
    id: "agent-with-tools",
    name: "Agent with Tools",
    category: "Agent Patterns",
    description: "Agent + defineTool — the LLM calls tools, gets results, responds. Classic ReAct loop.",
    code: agentWithToolsCode,
  },
  {
    id: "agent-rag",
    name: "RAG Retrieval",
    category: "Agent Patterns",
    description: "RAG builder — retrieve context, augment prompt, generate answer. Retriever + LLM in one pipeline.",
    code: agentRAGCode,
  },
  {
    id: "agent-prompt-strategies",
    name: "Prompt Strategies",
    category: "Agent Patterns",
    description: "staticPrompt, templatePrompt, skillBasedPrompt — swap prompt strategies without changing the agent.",
    code: agentPromptStrategiesCode,
  },
  {
    id: "agent-flowchart",
    name: "FlowChart Pipeline",
    category: "Agent Patterns",
    description: "Agent stages composed as a footprintjs flowchart — full narrative, recorders, subflows.",
    code: agentFlowchartCode,
  },
  {
    id: "agent-swarm",
    name: "Swarm Delegation",
    category: "Agent Patterns",
    description: "Multi-agent swarm — specialist agents delegate to each other based on the conversation topic.",
    code: agentSwarmCode,
  },
  {
    id: "agent-recorders",
    name: "Agent Recorders",
    category: "Agent Patterns",
    description: "agentObservability() preset — tokens, cost, tool usage in one recorder bundle.",
    code: agentRecordersCode,
  },
  {
    id: "agent-streaming",
    name: "Streaming Events",
    category: "Agent Patterns",
    description: "9-event lifecycle: turn_start, llm_start, tool_start, tool_end, llm_end, turn_end — for real-time UX.",
    code: agentStreamingCode,
  },
  {
    id: "agent-gated-tools",
    name: "Permission-Gated Tools",
    category: "Agent Patterns",
    description: "gatedTools() wraps tool access with permission checks — deny, audit, or require approval per tool.",
    code: agentGatedToolsCode,
  },
  {
    id: "agent-fallback",
    name: "Provider Fallback",
    category: "Agent Patterns",
    description: "Automatic failover between LLM providers — if Claude fails, fall back to OpenAI. Narrative shows which provider was used.",
    code: agentFallbackCode,
  },
  {
    id: "agent-memory-store",
    name: "Persistent Memory",
    category: "Agent Patterns",
    description: "Multi-turn conversation with persistent memory — InMemoryStore, Redis, Postgres, DynamoDB adapters.",
    code: agentMemoryStoreCode,
  },
  {
    id: "agent-explain",
    name: "ExplainRecorder",
    category: "Agent Patterns",
    description: "Collect grounding evidence during traversal — sources (tool results), claims (LLM responses), decisions (tool calls).",
    code: agentExplainCode,
  },
];
