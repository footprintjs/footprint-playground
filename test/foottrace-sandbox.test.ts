import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as foottrace from "foottrace";
import * as writers from "foottrace/write";
import * as paths from "foottrace/paths";
import * as engineTrace from "footprintjs/trace";
import { executeCode, buildCode } from "../src/runner/executeCode";

const flow = `
import { flowChart, FlowChartExecutor } from 'footprintjs';
const chart = flowChart('Seed', scope => { scope.answer = 42; }, 'seed').build();
const executor = new FlowChartExecutor(chart);
await executor.run();
`;

beforeEach(() => {
  vi.stubGlobal("window", { fetch: vi.fn(() => { throw new Error("No network in the sandbox regression"); }) });
});
afterEach(() => vi.unstubAllGlobals());

describe("Foottrace public doors in the playground", () => {
  it("preserves the remaining engine trace exports alongside the record doors", async () => {
    const names = Object.keys(engineTrace);
    const result = await executeCode(`import { ${names.join(", ")} } from 'footprintjs/trace';\n${flow}\nconsole.log([${names.map(name => `typeof ${name}`).join(", ")}]);`);
    expect(result.error).toBeUndefined();
    expect(JSON.parse(result.logs.at(-1)!)).toEqual(Object.values(engineTrace).map(value => typeof value));
  });

  it("keeps a real engine-owned recorder store usable by existing samples", async () => {
    const result = await executeCode(`import { KeyedStore } from 'footprintjs/trace';\n${flow}\nconst store = new KeyedStore(); store.set('seed#0', { answer: 42 }); console.log(store.get('seed#0'));`);
    expect(result.error).toBeUndefined();
    expect(JSON.parse(result.logs.at(-1)!)).toEqual({ answer: 42 });
  });

  it.each([
    ["foottrace", foottrace],
    ["foottrace/write", writers],
    ["foottrace/paths", paths],
  ])("provides every runtime export from %s", async (door, namespace) => {
    const names = Object.keys(namespace);
    vi.stubGlobal("__recordApiForTest", namespace);
    const result = await executeCode(`import { ${names.join(", ")} } from '${door}';\n${flow}\nconsole.log([${names.map(name => `${name} === globalThis.__recordApiForTest.${name}`).join(", ")}]);`);
    expect(result.error).toBeUndefined();
    expect(JSON.parse(result.logs.at(-1)!)).toEqual(names.map(() => true));
    expect(result.snapshot?.sharedState.answer).toBe(42);
  });

  it("writes a real public record, folds it and applies the public safe-path rules", async () => {
    const result = await executeCode(`
      import { stateAt } from 'foottrace';
      import { SharedMemory, EventLog, RecordFrame } from 'foottrace/write';
      import { setNestedValue, updateNestedValue } from 'foottrace/paths';
      ${flow}
      const memory = new SharedMemory(undefined, { count: 1 });
      const log = new EventLog(memory.getState());
      const frame = new RecordFrame(memory, log);
      frame.write(frame.at([], 'count'), 2, 'set');
      frame.commit(() => ({ stage: 'Increment', stageId: 'increment', runtimeStageId: 'increment#0' }));
      const bag = {};
      setNestedValue(bag, [], ['safe'], 'values', [1]);
      updateNestedValue(bag, [], ['safe'], 'values', [2]);
      setNestedValue(bag, [], ['__proto__'], 'polluted', true);
      console.log({ state: stateAt({ initialState: log.getInitialState(), commitLog: log.list() }, 0).state, bag, polluted: bag.polluted ?? false });
    `);
    expect(result.error).toBeUndefined();
    expect(JSON.parse(result.logs.at(-1)!)).toEqual({ state: { count: 2 }, bag: { safe: { values: [1, 2] } }, polluted: false });
  });

  it("keeps the recorded chart and live overlay on the ordinary execution path", async () => {
    const result = await executeCode(flow);
    expect(result.error).toBeUndefined();
    expect(result.buildTime?.traceGraph?.nodes.map(node => node.id)).toContain("seed");
    expect(result.buildTime?.runtimeOverlay?.executionOrder.length).toBeGreaterThan(0);
    const preview = await buildCode(flow);
    expect(preview.buildTime?.traceGraph?.nodes.map(node => node.id)).toContain("seed");
    expect(preview.buildTime?.runtimeOverlay?.executionOrder).toEqual([]);
  });

  it("does not resolve an unapproved imported module", async () => {
    await expect(executeCode(`import { readFile } from 'node:fs';\n${flow}\nreadFile('not-available');`))
      .rejects.toThrow("Cannot use import statement outside a module");
  });
});
