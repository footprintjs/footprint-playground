import type { StageSnapshot, Tutorial } from "./types";
import type { Node, Edge } from "@xyflow/react";

// Shared layout positions
const pos = {
  takeOrder: { x: 250, y: 0 },
  validatePayment: { x: 250, y: 120 },
  cookFood: { x: 100, y: 240 },
  makeDrink: { x: 400, y: 240 },
  assemble: { x: 250, y: 360 },
  deliver: { x: 250, y: 480 },
};

function node(
  id: string,
  label: string,
  position: { x: number; y: number },
  active = false,
  done = false,
  error = false
): Node {
  return {
    id,
    position,
    data: { label, active, done, error },
    type: "stage",
  };
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

// ──────────────────────────────────────────
// PHASE 1 — BUILD TIME (steps 0–5)
// ──────────────────────────────────────────

const buildCode = `import { FlowChartBuilder } from "footprint";

const builder = new FlowChartBuilder("restaurant");`;

const buildStep1Code = `${buildCode}

// Step 1: Take the order
builder.addStage("takeOrder", (scope) => {
  scope.set("order", { burger: 1, soda: 1 });
  return "Order received";
});`;

const buildStep2Code = `${buildStep1Code}

// Step 2: Validate payment
builder.addStage("validatePayment", (scope) => {
  const order = scope.get("order");
  scope.set("paid", true);
  return "Payment validated";
});`;

const buildStep3Code = `${buildStep2Code}

// Step 3: Fork — cook food & make drink in parallel
builder.fork("prepare", ["cookFood", "makeDrink"]);

builder.addStage("cookFood", (scope) => {
  return "Burger cooked";
});

builder.addStage("makeDrink", (scope) => {
  return "Soda poured";
});`;

const buildStep4Code = `${buildStep3Code}

// Step 4: Assemble the order
builder.addStage("assemble", (scope) => {
  return "Order assembled in bag";
});`;

const buildStep5Code = `${buildStep4Code}

// Step 5: Deliver
builder.addStage("deliver", (scope) => {
  return "Order delivered!";
});`;

// ──────────────────────────────────────────
// PHASE 2 — EXECUTE (steps 6–12)
// ──────────────────────────────────────────

const execCode = `// Flowchart is built. Now execute it!
const executor = builder.build();
const result = await executor.run();`;

const allNodes = (
  activeId?: string,
  doneIds: string[] = [],
  errorId?: string
): Node[] => [
  node("takeOrder", "Take Order", pos.takeOrder, activeId === "takeOrder", doneIds.includes("takeOrder"), errorId === "takeOrder"),
  node("validatePayment", "Validate Payment", pos.validatePayment, activeId === "validatePayment", doneIds.includes("validatePayment"), errorId === "validatePayment"),
  node("cookFood", "Cook Food", pos.cookFood, activeId === "cookFood", doneIds.includes("cookFood"), errorId === "cookFood"),
  node("makeDrink", "Make Drink", pos.makeDrink, activeId === "makeDrink", doneIds.includes("makeDrink"), errorId === "makeDrink"),
  node("assemble", "Assemble", pos.assemble, activeId === "assemble", doneIds.includes("assemble"), errorId === "assemble"),
  node("deliver", "Deliver", pos.deliver, activeId === "deliver", doneIds.includes("deliver"), errorId === "deliver"),
];

const allEdges = (animatedId?: string): Edge[] => [
  edge("takeOrder", "validatePayment", animatedId === "takeOrder"),
  edge("validatePayment", "cookFood", animatedId === "validatePayment"),
  edge("validatePayment", "makeDrink", animatedId === "validatePayment"),
  edge("cookFood", "assemble", animatedId === "cookFood"),
  edge("makeDrink", "assemble", animatedId === "makeDrink"),
  edge("assemble", "deliver", animatedId === "assemble"),
];

// ──────────────────────────────────────────
// PHASE 3 — OBSERVE: time-travel snapshots
// ──────────────────────────────────────────

const timelineSnapshots: StageSnapshot[] = [
  {
    stageName: "takeOrder",
    stageLabel: "Take Order",
    memory: { order: { burger: 1, soda: 1 } },
    narrative: "Received customer order: 1 burger, 1 soda.",
    durationMs: 0.8,
  },
  {
    stageName: "validatePayment",
    stageLabel: "Validate Payment",
    memory: { order: { burger: 1, soda: 1 }, paid: true },
    narrative: "Payment confirmed for order totalling $12.50.",
    durationMs: 1.1,
  },
  {
    stageName: "cookFood",
    stageLabel: "Cook Food",
    memory: { order: { burger: 1, soda: 1 }, paid: true, cookFood: "Burger cooked" },
    narrative: "Burger cooked on grill. Parallel with makeDrink.",
    durationMs: 2.1,
  },
  {
    stageName: "makeDrink",
    stageLabel: "Make Drink",
    memory: { order: { burger: 1, soda: 1 }, paid: true, cookFood: "Burger cooked", makeDrink: "Soda poured" },
    narrative: "Soda poured from fountain. Parallel with cookFood.",
    durationMs: 1.8,
  },
  {
    stageName: "assemble",
    stageLabel: "Assemble",
    memory: { order: { burger: 1, soda: 1 }, paid: true, cookFood: "Burger cooked", makeDrink: "Soda poured", assembled: true },
    narrative: "All items packed into bag. Ready for delivery.",
    durationMs: 0.9,
  },
  {
    stageName: "deliver",
    stageLabel: "Deliver",
    memory: { order: { burger: 1, soda: 1 }, paid: true, cookFood: "Burger cooked", makeDrink: "Soda poured", assembled: true, delivered: true },
    narrative: "Order handed to customer. Pipeline complete!",
    durationMs: 0.3,
  },
];

// ──────────────────────────────────────────
// ALL STEPS
// ──────────────────────────────────────────

export const restaurantOrder: Tutorial = {
  id: "restaurant-order",
  name: "Restaurant Order Pipeline",
  description: "Build a restaurant order processing flowchart with parallel cooking, then watch it execute and explore the trace.",
  steps: [
    // ── BUILD PHASE ──
    {
      phase: "build",
      title: "Create the builder",
      description: "Import FootPrint and create a new FlowChartBuilder.",
      code: buildCode,
      highlightLines: [1, 3],
      newCodeRange: [1, 3],
      nodes: [],
      edges: [],
    },
    {
      phase: "build",
      title: "Take the order",
      description: "Add the first stage — it receives the customer's order and stores it in scope.",
      code: buildStep1Code,
      highlightLines: [5, 9],
      newCodeRange: [5, 9],
      linkedNodeId: "takeOrder",
      nodes: [node("takeOrder", "Take Order", pos.takeOrder, true)],
      edges: [],
    },
    {
      phase: "build",
      title: "Validate payment",
      description: "Add a payment validation stage that reads the order from scope.",
      code: buildStep2Code,
      highlightLines: [11, 16],
      newCodeRange: [11, 16],
      linkedNodeId: "validatePayment",
      nodes: [
        node("takeOrder", "Take Order", pos.takeOrder),
        node("validatePayment", "Validate Payment", pos.validatePayment, true),
      ],
      edges: [edge("takeOrder", "validatePayment")],
    },
    {
      phase: "build",
      title: "Fork: parallel preparation",
      description: "Fork into two parallel branches — cook the food and make the drink simultaneously.",
      code: buildStep3Code,
      highlightLines: [18, 27],
      newCodeRange: [18, 27],
      linkedNodeId: "cookFood",
      nodes: [
        node("takeOrder", "Take Order", pos.takeOrder),
        node("validatePayment", "Validate Payment", pos.validatePayment),
        node("cookFood", "Cook Food", pos.cookFood, true),
        node("makeDrink", "Make Drink", pos.makeDrink, true),
      ],
      edges: [
        edge("takeOrder", "validatePayment"),
        edge("validatePayment", "cookFood"),
        edge("validatePayment", "makeDrink"),
      ],
    },
    {
      phase: "build",
      title: "Assemble the order",
      description: "After both parallel branches complete, assemble everything into a bag.",
      code: buildStep4Code,
      highlightLines: [29, 32],
      newCodeRange: [29, 32],
      linkedNodeId: "assemble",
      nodes: [
        node("takeOrder", "Take Order", pos.takeOrder),
        node("validatePayment", "Validate Payment", pos.validatePayment),
        node("cookFood", "Cook Food", pos.cookFood),
        node("makeDrink", "Make Drink", pos.makeDrink),
        node("assemble", "Assemble", pos.assemble, true),
      ],
      edges: [
        edge("takeOrder", "validatePayment"),
        edge("validatePayment", "cookFood"),
        edge("validatePayment", "makeDrink"),
        edge("cookFood", "assemble"),
        edge("makeDrink", "assemble"),
      ],
    },
    {
      phase: "build",
      title: "Deliver",
      description: "Final stage — deliver the assembled order to the customer.",
      code: buildStep5Code,
      highlightLines: [34, 37],
      newCodeRange: [34, 37],
      linkedNodeId: "deliver",
      nodes: [
        node("takeOrder", "Take Order", pos.takeOrder),
        node("validatePayment", "Validate Payment", pos.validatePayment),
        node("cookFood", "Cook Food", pos.cookFood),
        node("makeDrink", "Make Drink", pos.makeDrink),
        node("assemble", "Assemble", pos.assemble),
        node("deliver", "Deliver", pos.deliver, true),
      ],
      edges: [
        edge("takeOrder", "validatePayment"),
        edge("validatePayment", "cookFood"),
        edge("validatePayment", "makeDrink"),
        edge("cookFood", "assemble"),
        edge("makeDrink", "assemble"),
        edge("assemble", "deliver"),
      ],
    },

    // ── EXECUTE PHASE ──
    {
      phase: "execute",
      title: "Start execution",
      description: "The traverser begins at the root node.",
      code: execCode,
      nodes: allNodes("takeOrder"),
      edges: allEdges("takeOrder"),
      activeNodeId: "takeOrder",
      memory: {},
      narrative: "Pipeline started. Executing takeOrder...",
    },
    {
      phase: "execute",
      title: "Order received",
      description: "takeOrder wrote {burger: 1, soda: 1} to scope.",
      code: execCode,
      nodes: allNodes("validatePayment", ["takeOrder"]),
      edges: allEdges("validatePayment"),
      activeNodeId: "validatePayment",
      memory: { order: { burger: 1, soda: 1 } },
      narrative: "takeOrder completed: stored order {burger: 1, soda: 1}. Moving to validatePayment...",
    },
    {
      phase: "execute",
      title: "Payment validated",
      description: "validatePayment confirmed payment. Now forking...",
      code: execCode,
      nodes: allNodes("cookFood", ["takeOrder", "validatePayment"]),
      edges: allEdges("validatePayment"),
      activeNodeId: "cookFood",
      memory: { order: { burger: 1, soda: 1 }, paid: true },
      narrative: "validatePayment completed: payment confirmed. Forking into cookFood and makeDrink...",
    },
    {
      phase: "execute",
      title: "Parallel: cooking & mixing",
      description: "Both branches execute simultaneously. cookFood and makeDrink run in parallel.",
      code: execCode,
      nodes: allNodes(undefined, ["takeOrder", "validatePayment", "cookFood", "makeDrink"]),
      edges: allEdges("cookFood"),
      activeNodeId: "assemble",
      memory: { order: { burger: 1, soda: 1 }, paid: true, cookFood: "Burger cooked", makeDrink: "Soda poured" },
      narrative: "Parallel branches completed: cookFood returned 'Burger cooked', makeDrink returned 'Soda poured'. Joining at assemble...",
    },
    {
      phase: "execute",
      title: "Assembled",
      description: "All items packed into a bag.",
      code: execCode,
      nodes: allNodes("deliver", ["takeOrder", "validatePayment", "cookFood", "makeDrink", "assemble"]),
      edges: allEdges("assemble"),
      activeNodeId: "deliver",
      memory: { order: { burger: 1, soda: 1 }, paid: true, cookFood: "Burger cooked", makeDrink: "Soda poured", assembled: true },
      narrative: "assemble completed: order packed. Moving to final stage deliver...",
    },
    {
      phase: "execute",
      title: "Delivered!",
      description: "Pipeline execution complete.",
      code: execCode,
      nodes: allNodes(undefined, ["takeOrder", "validatePayment", "cookFood", "makeDrink", "assemble", "deliver"]),
      edges: allEdges(),
      memory: { order: { burger: 1, soda: 1 }, paid: true, cookFood: "Burger cooked", makeDrink: "Soda poured", assembled: true, delivered: true },
      narrative: "deliver completed: order delivered! Pipeline finished successfully. All 6 stages executed in 7.0ms.",
    },

    // ── OBSERVE PHASE ──
    {
      phase: "observe",
      title: "Time-Travel Debugger",
      description: "Click any stage to inspect the memory snapshot at that exact moment. Drag the slider to replay.",
      code: `// Every stage commit is captured automatically.
// No extra code needed — FootPrint records it all.

const trace = result.getTrace();
// 6 snapshots, one per stage commit

// Replay to any point:
const atStep2 = result.replayTo("validatePayment");
console.log(atStep2.memory);
// { order: { burger: 1, soda: 1 }, paid: true }`,
      nodes: allNodes(undefined, ["takeOrder", "validatePayment", "cookFood", "makeDrink", "assemble", "deliver"]),
      edges: allEdges(),
      snapshots: timelineSnapshots,
      memory: timelineSnapshots[0].memory,
      narrative: timelineSnapshots[0].narrative,
    },
    {
      phase: "observe",
      title: "Causal Narrative",
      description: "The auto-generated narrative explains what happened and why — ready to feed to an LLM.",
      code: `// The narrative is auto-generated from the trace
const narrative = result.getNarrative();

// Feed it directly to an LLM:
const answer = await llm.ask(
  "Why was the order delivered?",
  { context: narrative }
);
// "The order was delivered because all preparation
//  stages completed successfully: the burger was
//  cooked, the soda was poured, and everything
//  was assembled into a bag."`,
      nodes: allNodes(undefined, ["takeOrder", "validatePayment", "cookFood", "makeDrink", "assemble", "deliver"]),
      edges: allEdges(),
      snapshots: timelineSnapshots,
      memory: { order: { burger: 1, soda: 1 }, paid: true, cookFood: "Burger cooked", makeDrink: "Soda poured", assembled: true, delivered: true },
      narrative: `1. takeOrder: Received order {burger: 1, soda: 1}
2. validatePayment: Payment confirmed for order
3. [FORK] cookFood + makeDrink ran in parallel
   - cookFood: Burger cooked (2.1ms)
   - makeDrink: Soda poured (1.8ms)
4. assemble: All items packed
5. deliver: Order delivered successfully`,
    },
    {
      phase: "observe",
      title: "What you get",
      description: "From a simple flowchart, FootPrint gives you full observability — for free.",
      code: "",
      nodes: allNodes(undefined, ["takeOrder", "validatePayment", "cookFood", "makeDrink", "assemble", "deliver"]),
      edges: allEdges(),
      snapshots: timelineSnapshots,
      memory: {},
      narrative: "",
    },
  ],
};
