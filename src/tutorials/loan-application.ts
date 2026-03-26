import type { StageSnapshot, Tutorial } from "./types";
import type { Node, Edge } from "@xyflow/react";

// ─── Layout ──────────────────────────────────────────────────────────────────

const pos = {
  intake:   { x: 250, y: 0 },
  assess:   { x: 250, y: 120 },
  classify: { x: 250, y: 240 },
  approve:  { x: 80,  y: 390 },
  review:   { x: 420, y: 390 },
};

function node(
  id: string,
  label: string,
  position: { x: number; y: number },
  active = false,
  done = false,
  error = false
): Node {
  return { id, position, data: { label, active, done, error }, type: "stage" };
}

function edge(source: string, target: string, animated = false): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    animated,
    style: { stroke: animated ? "#6366f1" : "#94a3b8", strokeWidth: 2 },
  };
}

// ─── Build-phase code strings ─────────────────────────────────────────────────
// Each step accumulates the previous one. Line counts are tracked so
// newCodeRange / highlightLines point to the correct new lines.

// Lines 1–12
const s1 = `import { flowChart, decide, narrative } from "footprintjs";

interface LoanState {
  creditScore: number;
  monthlyIncome: number;
  decision?: string;
}

const chart = flowChart<LoanState>("Intake", async (scope) => {
  scope.creditScore = 750;
  scope.monthlyIncome = 5000;
}, "intake", undefined, "Receive loan application data")`;

// Lines 13–15
const s2 = `${s1}
  .addFunction("Assess", async (scope) => {
    scope.decision = scope.creditScore > 600 ? "promising" : "risky";
  }, "assess", "Evaluate applicant credit profile")`;

// Lines 16–20
const s3 = `${s2}
  .addDeciderFunction("Classify", (scope) => {
    return decide(scope, [
      { when: { creditScore: { gt: 700 } }, then: "approved", label: "Good credit" },
    ], "review");
  }, "classify", "Route by credit score tier")`;

// Lines 21–26
const s4 = `${s3}
    .addFunctionBranch("approved", "Approve", async (scope) => {
      scope.decision = "Approved \u2713";
    }, "Issue approval letter")
    .addFunctionBranch("review", "Review", async (scope) => {
      scope.decision = "Under review";
    }, "Queue for underwriter")`;

// Lines 27–29
const s5 = `${s4}
    .setDefault("review")
    .end()
  .build();`;

// ─── Execute-phase code ───────────────────────────────────────────────────────

const execCode = `// Execute the chart with narrative recording
const rec = narrative();
await chart.recorder(rec).run();

console.log(rec.lines().join("\\n"));`;

// ─── Observe-phase code ───────────────────────────────────────────────────────

const observeCode = `// Auto-generated narrative with decision evidence:
// Stage 1: The process began with Intake.
//   [Set] creditScore = 750
//   [Set] monthlyIncome = 5000
// Stage 2: Next, it moved on to Assess.
//   [Read] creditScore -> 750
//   [Set] decision = "promising"
// Stage 3: Next, it moved on to Classify.
// [Condition]: Evaluated "Good credit":
//   creditScore 750 gt 700 \u2713, and chose approved.
// Stage 4: Next, it moved on to Approve.
//   [Set] decision = "Approved \u2713"`;

// ─── Node / edge factories for execute phase ─────────────────────────────────

function allNodes(activeId?: string, doneIds: string[] = []): Node[] {
  return [
    node("intake",   "Intake",   pos.intake,   activeId === "intake",   doneIds.includes("intake")),
    node("assess",   "Assess",   pos.assess,   activeId === "assess",   doneIds.includes("assess")),
    node("classify", "Classify", pos.classify, activeId === "classify", doneIds.includes("classify")),
    node("approve",  "Approve",  pos.approve,  activeId === "approve",  doneIds.includes("approve")),
    node("review",   "Review",   pos.review,   activeId === "review",   doneIds.includes("review")),
  ];
}

function allEdges(animatedFrom?: string): Edge[] {
  return [
    edge("intake",   "assess",   animatedFrom === "intake"),
    edge("assess",   "classify", animatedFrom === "assess"),
    edge("classify", "approve",  animatedFrom === "classify"),
    edge("classify", "review",   false), // not taken in this run
  ];
}

// ─── Observe: time-travel snapshots ──────────────────────────────────────────

const snapshots: StageSnapshot[] = [
  {
    stageName: "intake",
    stageLabel: "Intake",
    memory: { creditScore: 750, monthlyIncome: 5000 },
    narrative: "The process began with Intake. Set creditScore = 750, monthlyIncome = 5000.",
    startMs: 0,
    durationMs: 0.2,
  },
  {
    stageName: "assess",
    stageLabel: "Assess",
    memory: { creditScore: 750, monthlyIncome: 5000, decision: "promising" },
    narrative: "Moved on to Assess. creditScore 750 > 600 \u2192 decision = \"promising\".",
    startMs: 0.2,
    durationMs: 0.1,
  },
  {
    stageName: "classify",
    stageLabel: "Classify",
    memory: { creditScore: 750, monthlyIncome: 5000, decision: "promising" },
    narrative: "Moved on to Classify. Evaluated \"Good credit\": creditScore 750 gt 700 \u2713 \u2192 chose approved.",
    startMs: 0.3,
    durationMs: 0.1,
  },
  {
    stageName: "approve",
    stageLabel: "Approve",
    memory: { creditScore: 750, monthlyIncome: 5000, decision: "Approved \u2713" },
    narrative: "Moved on to Approve. decision = \"Approved \u2713\". Pipeline complete.",
    startMs: 0.4,
    durationMs: 0.1,
  },
];

// ─── Full done set for observe phase ─────────────────────────────────────────

const doneAll = allNodes(undefined, ["intake", "assess", "classify", "approve"]);
const edgesAll = allEdges();

// ─── Tutorial ─────────────────────────────────────────────────────────────────

export const loanApplication: Tutorial = {
  id: "loan-application",
  name: "Loan Application Pipeline",
  description: "Build a loan pipeline with typed scope, decision branching, and auto-narrative — then watch it run.",
  steps: [

    // ── BUILD PHASE ──────────────────────────────────────────────────────────

    {
      phase: "build",
      title: "Define state + first stage",
      description: "flowChart<LoanState>() creates the root stage. TypeScript tracks every property — no casts, no getValue().",
      code: s1,
      highlightLines: [9, 12],
      newCodeRange: [1, 12],
      linkedNodeId: "intake",
      nodes: [node("intake", "Intake", pos.intake, true)],
      edges: [],
    },
    {
      phase: "build",
      title: "Add a sequential stage",
      description: ".addFunction() chains the next stage. scope.creditScore is fully typed — reads, writes, and the narrative all flow automatically.",
      code: s2,
      highlightLines: [13, 15],
      newCodeRange: [13, 15],
      linkedNodeId: "assess",
      nodes: [
        node("intake",  "Intake", pos.intake),
        node("assess",  "Assess", pos.assess, true),
      ],
      edges: [edge("intake", "assess")],
    },
    {
      phase: "build",
      title: "Branch with decide()",
      description: ".addDeciderFunction() + decide() routes to a branch AND records why: which keys were read, which operators matched, which threshold was used.",
      code: s3,
      highlightLines: [16, 20],
      newCodeRange: [16, 20],
      linkedNodeId: "classify",
      nodes: [
        node("intake",   "Intake",   pos.intake),
        node("assess",   "Assess",   pos.assess),
        node("classify", "Classify", pos.classify, true),
      ],
      edges: [
        edge("intake",  "assess"),
        edge("assess",  "classify"),
      ],
    },
    {
      phase: "build",
      title: "Add branches",
      description: ".addFunctionBranch() defines what runs for each outcome. Unmatched branches are skipped entirely.",
      code: s4,
      highlightLines: [21, 26],
      newCodeRange: [21, 26],
      linkedNodeId: "approve",
      nodes: [
        node("intake",   "Intake",   pos.intake),
        node("assess",   "Assess",   pos.assess),
        node("classify", "Classify", pos.classify),
        node("approve",  "Approve",  pos.approve, true),
        node("review",   "Review",   pos.review,  true),
      ],
      edges: [
        edge("intake",   "assess"),
        edge("assess",   "classify"),
        edge("classify", "approve"),
        edge("classify", "review"),
      ],
    },
    {
      phase: "build",
      title: "Close and build",
      description: ".setDefault() sets the fallback branch, .end() returns to the outer chain, .build() compiles the graph into an executable chart.",
      code: s5,
      highlightLines: [27, 29],
      newCodeRange: [27, 29],
      linkedNodeId: "classify",
      nodes: [
        node("intake",   "Intake",   pos.intake),
        node("assess",   "Assess",   pos.assess),
        node("classify", "Classify", pos.classify, true),
        node("approve",  "Approve",  pos.approve),
        node("review",   "Review",   pos.review),
      ],
      edges: [
        edge("intake",   "assess"),
        edge("assess",   "classify"),
        edge("classify", "approve"),
        edge("classify", "review"),
      ],
    },

    // ── EXECUTE PHASE ────────────────────────────────────────────────────────

    {
      phase: "execute",
      title: "Execution begins",
      description: "chart.recorder(rec).run() attaches the narrative recorder and starts the traversal at the root stage.",
      code: execCode,
      nodes: allNodes("intake"),
      edges: allEdges("intake"),
      activeNodeId: "intake",
      memory: {},
      narrative: "Pipeline started. Traversing from Intake...",
    },
    {
      phase: "execute",
      title: "Intake complete",
      description: "Intake wrote creditScore = 750 and monthlyIncome = 5000 to shared state. Moving to Assess.",
      code: execCode,
      nodes: allNodes("assess", ["intake"]),
      edges: allEdges("assess"),
      activeNodeId: "assess",
      memory: { creditScore: 750, monthlyIncome: 5000 },
      narrative: "Intake complete. creditScore = 750, monthlyIncome = 5000. Moving to Assess...",
    },
    {
      phase: "execute",
      title: "Assess complete",
      description: "Assess read creditScore, set decision = \"promising\". Now the decider Classify runs.",
      code: execCode,
      nodes: allNodes("classify", ["intake", "assess"]),
      edges: allEdges("classify"),
      activeNodeId: "classify",
      memory: { creditScore: 750, monthlyIncome: 5000, decision: "promising" },
      narrative: "Assess complete. creditScore 750 > 600 \u2192 decision = \"promising\". Moving to Classify...",
    },
    {
      phase: "execute",
      title: "Classify decides: approved",
      description: "decide() evaluated creditScore 750 gt 700 ✓ — chose the \"approved\" branch. Evidence captured automatically.",
      code: execCode,
      nodes: allNodes("approve", ["intake", "assess", "classify"]),
      edges: allEdges("classify"),
      activeNodeId: "approve",
      memory: { creditScore: 750, monthlyIncome: 5000, decision: "promising" },
      narrative: "Classify: creditScore 750 gt 700 \u2713 \u2192 chose approved. Moving to Approve...",
    },
    {
      phase: "execute",
      title: "Pipeline complete",
      description: "Approve set decision = \"Approved ✓\". All stages finished. The narrative recorder captured the full trace.",
      code: execCode,
      nodes: allNodes(undefined, ["intake", "assess", "classify", "approve"]),
      edges: allEdges(),
      memory: { creditScore: 750, monthlyIncome: 5000, decision: "Approved \u2713" },
      narrative: "Approve complete. decision = \"Approved \u2713\". Pipeline finished in 0.5ms.",
    },

    // ── OBSERVE PHASE ────────────────────────────────────────────────────────

    {
      phase: "observe",
      title: "Time-travel the execution",
      description: "Click any stage in the timeline to see exactly what was in scope at that moment. Every commit is captured automatically — no extra code.",
      code: observeCode,
      nodes: doneAll,
      edges: edgesAll,
      snapshots,
      memory: snapshots[0].memory,
      narrative: snapshots[0].narrative,
    },
    {
      phase: "observe",
      title: "What you get for free",
      description: "From a 30-line flowchart: typed state, decision evidence, causal narrative, and time-travel debugging.",
      code: "",
      nodes: doneAll,
      edges: edgesAll,
      snapshots,
      memory: snapshots[snapshots.length - 1].memory,
      narrative: "",
    },
  ],
};
