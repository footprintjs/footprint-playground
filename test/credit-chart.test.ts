import { describe, expect, it } from "vitest";
import { FlowChartExecutor } from "footprintjs";
import { buildCreditChart } from "../src/runner/creditChart";

describe("credit demo recorder graph", () => {
  it("retains all decision paths in the graph shown by ExplainableShell", () => {
    const { traceGraph, mcpTool } = buildCreditChart();
    expect(traceGraph.nodes.map(node => node.id)).toEqual(expect.arrayContaining([
      "assess-credit", "credit-decision", "approved", "rejected", "manual-review",
    ]));
    expect(traceGraph.edges.length).toBeGreaterThan(0);
    expect(mcpTool.inputSchema.properties).toHaveProperty("creditScore");
  });

  it.each([
    [720, 1800, "APPROVED"],
    [550, 1800, "REJECTED"],
    [650, 2500, "MANUAL REVIEW"],
  ])("keeps the existing %i/%i decision behavior", async (creditScore, monthlyDebts, expected) => {
    const { chart } = buildCreditChart();
    const executor = new FlowChartExecutor(chart);
    await executor.run({ input: { applicantName: "Test", creditScore, monthlyIncome: 5000, monthlyDebts } });
    expect(executor.getSnapshot().sharedState.decision).toBe(expected);
  });
});
