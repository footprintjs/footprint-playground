import type { Tutorial } from "./types";
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
  node(
    "takeOrder",
    "Take Order",
    pos.takeOrder,
    activeId === "takeOrder",
    doneIds.includes("takeOrder"),
    errorId === "takeOrder"
  ),
  node(
    "validatePayment",
    "Validate Payment",
    pos.validatePayment,
    activeId === "validatePayment",
    doneIds.includes("validatePayment"),
    errorId === "validatePayment"
  ),
  node(
    "cookFood",
    "Cook Food",
    pos.cookFood,
    activeId === "cookFood",
    doneIds.includes("cookFood"),
    errorId === "cookFood"
  ),
  node(
    "makeDrink",
    "Make Drink",
    pos.makeDrink,
    activeId === "makeDrink",
    doneIds.includes("makeDrink"),
    errorId === "makeDrink"
  ),
  node(
    "assemble",
    "Assemble",
    pos.assemble,
    activeId === "assemble",
    doneIds.includes("assemble"),
    errorId === "assemble"
  ),
  node(
    "deliver",
    "Deliver",
    pos.deliver,
    activeId === "deliver",
    doneIds.includes("deliver"),
    errorId === "deliver"
  ),
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
// PHASE 3 — OBSERVE (steps 13–15)
// ──────────────────────────────────────────

const observeCode = `// Access the execution trace
const snapshot = result.getSnapshot();
const narrative = result.getNarrative();
const metrics = result.getMetrics();`;

// ──────────────────────────────────────────
// ALL STEPS
// ──────────────────────────────────────────

export const restaurantOrder: Tutorial = {
  id: "restaurant-order",
  name: "Restaurant Order Pipeline",
  description:
    "Build a restaurant order processing flowchart with parallel cooking, then watch it execute and explore the trace.",
  steps: [
    // ── BUILD PHASE ──
    {
      phase: "build",
      title: "Create the builder",
      description: "Import FootPrint and create a new FlowChartBuilder.",
      code: buildCode,
      highlightLines: [1, 3],
      nodes: [],
      edges: [],
    },
    {
      phase: "build",
      title: "Take the order",
      description:
        "Add the first stage — it receives the customer's order and stores it in scope.",
      code: buildStep1Code,
      highlightLines: [5, 9],
      nodes: [node("takeOrder", "Take Order", pos.takeOrder, true)],
      edges: [],
    },
    {
      phase: "build",
      title: "Validate payment",
      description:
        "Add a payment validation stage that reads the order from scope.",
      code: buildStep2Code,
      highlightLines: [11, 16],
      nodes: [
        node("takeOrder", "Take Order", pos.takeOrder),
        node(
          "validatePayment",
          "Validate Payment",
          pos.validatePayment,
          true
        ),
      ],
      edges: [edge("takeOrder", "validatePayment")],
    },
    {
      phase: "build",
      title: "Fork: parallel preparation",
      description:
        "Fork into two parallel branches — cook the food and make the drink simultaneously.",
      code: buildStep3Code,
      highlightLines: [18, 27],
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
      description:
        "After both parallel branches complete, assemble everything into a bag.",
      code: buildStep4Code,
      highlightLines: [29, 32],
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
      description:
        "Final stage — deliver the assembled order to the customer.",
      code: buildStep5Code,
      highlightLines: [34, 37],
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
      description: 'takeOrder wrote {burger: 1, soda: 1} to scope.',
      code: execCode,
      nodes: allNodes("validatePayment", ["takeOrder"]),
      edges: allEdges("validatePayment"),
      activeNodeId: "validatePayment",
      memory: { order: { burger: 1, soda: 1 } },
      narrative:
        'takeOrder completed: stored order {burger: 1, soda: 1}. Moving to validatePayment...',
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
      narrative:
        "validatePayment completed: payment confirmed. Forking into cookFood and makeDrink...",
    },
    {
      phase: "execute",
      title: "Parallel: cooking & mixing",
      description:
        "Both branches execute simultaneously. cookFood and makeDrink run in parallel.",
      code: execCode,
      nodes: allNodes(undefined, [
        "takeOrder",
        "validatePayment",
        "cookFood",
        "makeDrink",
      ]),
      edges: allEdges("cookFood"),
      activeNodeId: "assemble",
      memory: {
        order: { burger: 1, soda: 1 },
        paid: true,
        cookFood: "Burger cooked",
        makeDrink: "Soda poured",
      },
      narrative:
        "Parallel branches completed: cookFood returned 'Burger cooked', makeDrink returned 'Soda poured'. Joining at assemble...",
    },
    {
      phase: "execute",
      title: "Assembled",
      description: "All items packed into a bag.",
      code: execCode,
      nodes: allNodes("deliver", [
        "takeOrder",
        "validatePayment",
        "cookFood",
        "makeDrink",
        "assemble",
      ]),
      edges: allEdges("assemble"),
      activeNodeId: "deliver",
      memory: {
        order: { burger: 1, soda: 1 },
        paid: true,
        cookFood: "Burger cooked",
        makeDrink: "Soda poured",
        assembled: true,
      },
      narrative:
        "assemble completed: order packed. Moving to final stage deliver...",
    },
    {
      phase: "execute",
      title: "Delivered!",
      description: "Pipeline execution complete.",
      code: execCode,
      nodes: allNodes(undefined, [
        "takeOrder",
        "validatePayment",
        "cookFood",
        "makeDrink",
        "assemble",
        "deliver",
      ]),
      edges: allEdges(),
      memory: {
        order: { burger: 1, soda: 1 },
        paid: true,
        cookFood: "Burger cooked",
        makeDrink: "Soda poured",
        assembled: true,
        delivered: true,
      },
      narrative:
        "deliver completed: order delivered! Pipeline finished successfully. All 6 stages executed in 4.2ms.",
    },

    // ── OBSERVE PHASE ──
    {
      phase: "observe",
      title: "Snapshots & Memory",
      description:
        "Every stage commit is captured. You can inspect the full memory state at any point in time.",
      code: observeCode,
      nodes: allNodes(undefined, [
        "takeOrder",
        "validatePayment",
        "cookFood",
        "makeDrink",
        "assemble",
        "deliver",
      ]),
      edges: allEdges(),
      memory: {
        order: { burger: 1, soda: 1 },
        paid: true,
        cookFood: "Burger cooked",
        makeDrink: "Soda poured",
        assembled: true,
        delivered: true,
      },
      narrative:
        "Full execution trace available. 6 snapshots captured across 6 stages. Total execution time: 4.2ms.",
    },
    {
      phase: "observe",
      title: "Causal Narrative",
      description:
        "The narrative explains WHY each decision was made — perfect for feeding to an LLM.",
      code: `// The narrative is auto-generated from the trace
const narrative = result.getNarrative();
console.log(narrative);

// Output:
// 1. takeOrder: Received order {burger: 1, soda: 1}
// 2. validatePayment: Payment confirmed for order
// 3. [FORK] cookFood + makeDrink ran in parallel
//    - cookFood: Burger cooked (2.1ms)
//    - makeDrink: Soda poured (1.8ms)
// 4. assemble: All items packed
// 5. deliver: Order delivered successfully`,
      nodes: allNodes(undefined, [
        "takeOrder",
        "validatePayment",
        "cookFood",
        "makeDrink",
        "assemble",
        "deliver",
      ]),
      edges: allEdges(),
      memory: {
        order: { burger: 1, soda: 1 },
        paid: true,
        cookFood: "Burger cooked",
        makeDrink: "Soda poured",
        assembled: true,
        delivered: true,
      },
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
      title: "Metrics & Time-Travel",
      description:
        "Replay any point in execution. Inspect metrics per stage. Debug with full causal context.",
      code: `// Time-travel: replay to any snapshot
const atStep3 = result.replayTo("validatePayment");
console.log(atStep3.memory);
// { order: { burger: 1, soda: 1 }, paid: true }

// Metrics per stage
const metrics = result.getMetrics();
// { takeOrder: 0.8ms, validatePayment: 1.1ms,
//   cookFood: 2.1ms, makeDrink: 1.8ms,
//   assemble: 0.9ms, deliver: 0.3ms }`,
      nodes: allNodes(undefined, [
        "takeOrder",
        "validatePayment",
        "cookFood",
        "makeDrink",
        "assemble",
        "deliver",
      ]),
      edges: allEdges(),
      memory: {
        order: { burger: 1, soda: 1 },
        paid: true,
        cookFood: "Burger cooked",
        makeDrink: "Soda poured",
        assembled: true,
        delivered: true,
      },
      narrative:
        "Time-travel debugging enabled. Select any stage to see the memory state at that exact moment.",
    },
  ],
};
