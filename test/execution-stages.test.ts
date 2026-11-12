import { describe, expect, it } from "vitest";
import { FlowChartExecutor, flowChart } from "footprintjs";
import { executionStages, stageBranches, type ExecutionStage } from "../src/runner/executionStages";
import { executionTreeToReactFlow } from "../src/runner/treeToReactFlow";

const stage = (name: string, extra: object = {}): ExecutionStage =>
  ({ id: "run", name, logs: {}, errors: {}, metrics: {}, evals: {}, ...extra });

// One run, seed → fork(a → a2 | b) → join → end, in both shapes.
const linked = stage("seed", {
  next: stage("fork", {
    children: [stage("a", { next: stage("a2") }), stage("b", { errors: { e: 1 } })],
    next: stage("join", { next: stage("end") }),
  }),
});
const list = [
  stage("seed"),
  stage("fork", { branches: [[stage("a"), stage("a2")], [stage("b", { errors: { e: 1 } })]] }),
  stage("join"),
  stage("end"),
];

const names = (stages: ExecutionStage[]) => stages.map((s) => s.name);

describe("executionStages", () => {
  it.each([["list", list], ["linked", linked]])("reads the %s form in run order", (_shape, tree) => {
    const stages = executionStages(tree);
    expect(names(stages)).toEqual(["seed", "fork", "join", "end"]);
    expect(stageBranches(stages[1]).map(names)).toEqual([["a", "a2"], ["b"]]);
    expect(stageBranches(stages[0])).toEqual([]);
  });

  it("reads nothing from a missing or foreign value", () => {
    for (const value of [undefined, null, 42, "seed"]) expect(executionStages(value)).toEqual([]);
  });

  it("stops a linked chain that loops back to a stage it already read", () => {
    const first = stage("first");
    const second = stage("second", { next: first });
    first.next = second;
    expect(names(executionStages(first))).toEqual(["first", "second"]);
  });

  it("reads a run of the installed footprintjs, whichever shape it serves", async () => {
    const chart = flowChart("Seed", () => {}, "seed")
      .addListOfFunction([
        { id: "left", name: "Left", fn: () => {} },
        { id: "right", name: "Right", fn: () => {} },
      ])
      .addFunction("Done", () => {}, "done")
      .build();
    const executor = new FlowChartExecutor(chart);
    await executor.run();
    const stages = executionStages(executor.getSnapshot().executionTree);
    expect(names(stages)).toEqual(["Seed", "Done"]);
    expect(stageBranches(stages[0]).map(names).sort()).toEqual([["Left"], ["Right"]]);
  });
});

describe("executionTreeToReactFlow", () => {
  // Pinned from the layout before the list form existed: both shapes must keep it.
  const nodes = [
    ["seed", 250, 0, false], ["fork", 250, 120, false], ["a", 160, 240, false], ["a2", 160, 360, false],
    ["b", 340, 240, true], ["join", 250, 480, false], ["end", 250, 600, false],
  ];
  const edges = [
    ["e1", "seed", "fork"], ["e2", "fork", "a"], ["e3", "a", "a2"], ["e4", "fork", "b"],
    ["e5", "a2", "join"], ["e6", "b", "join"], ["e7", "join", "end"],
  ];

  it.each([["list", list], ["linked", linked]])("lays out the %s form unchanged", (_shape, tree) => {
    const flow = executionTreeToReactFlow(tree);
    expect(flow.nodes.map((n) => [n.id, n.position.x, n.position.y, n.data.error])).toEqual(nodes);
    expect(flow.edges.map((e) => [e.id, e.source, e.target])).toEqual(edges);
  });

  it("ends a list at a stage already placed, as the linked walk did", () => {
    const flow = executionTreeToReactFlow([stage("a"), stage("b"), stage("a"), stage("c")]);
    expect(flow.nodes.map((n) => n.id)).toEqual(["a", "b"]);
    expect(flow.edges.map((e) => [e.source, e.target])).toEqual([["a", "b"], ["b", "a"]]);
  });
});
