/**
 * TraceExplorerDemo — wires the L8 stack (createTraceBundle +
 * <TraceExplorerShell>) against a real footprintjs executor so you
 * can click around in the browser.
 *
 * Click a stage in the chain pane → both inspector panes update.
 * Drag the slider → cursor moves; commits past the cursor dim.
 * Click the "Reset" button → re-runs the chart with a fresh bundle.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { flowChart, FlowChartExecutor, type StructureRecorder } from "footprintjs";
import {
  createTraceBundle,
  TraceExplorerShell,
  type TraceBundle,
} from "footprint-explainable-ui/flowchart";

// ── Demo chart shape ────────────────────────────────────────────────
// Seed → fork(BranchA, BranchB) → Merge → LoopBody×3 → Exit
//
// Covers fork-merge, loop iterations, data dependencies, structural
// + runtime + data-flow prev/next — exercises every L8.1 / L8.2 /
// L8.3 / L8.4 / L8.5 surface in one chart.

interface DemoState {
  orderId: string;
  inStock: boolean;
  fraudCleared: boolean;
  itemCount: number;
  done: boolean;
}

function buildDemoChart(structureRecorder: StructureRecorder) {
  return flowChart<DemoState>(
    "Seed",
    async (scope) => {
      scope.orderId = "ORD-001";
      scope.itemCount = 0;
    },
    "seed",
    { structureRecorders: [structureRecorder] },
  )
    // True parallel fork via addListOfFunction — produces real
    // fork-branch edges in the structure recorder, which the chain
    // tree decomposes into a parallel block.
    .addListOfFunction([
      {
        id: "branch-a",
        name: "BranchA",
        fn: async (scope) => {
          // Read orderId so the commit captures a data dependency on Seed.
          void scope.orderId;
          scope.inStock = true;
        },
      },
      {
        id: "branch-b",
        name: "BranchB",
        fn: async (scope) => {
          void scope.orderId;
          scope.fraudCleared = true;
        },
      },
    ])
    .addFunction(
      "Merge",
      async (scope) => {
        // Reads from BOTH branches — exercises runtimePrev + dataDeps.
        void scope.inStock;
        void scope.fraudCleared;
        scope.itemCount = 1;
      },
      "merge",
    )
    .addFunction(
      "LoopBody",
      async (scope) => {
        scope.itemCount += 1;
        if (scope.itemCount >= 4) {
          scope.$break();
        }
      },
      "loop-body",
    )
    .loopTo("loop-body")
    .addFunction(
      "Exit",
      async (scope) => {
        void scope.itemCount;
        scope.done = true;
      },
      "exit",
    )
    .build();
}

export function TraceExplorerDemo() {
  // Bundle lives in state and is created inside the effect so that
  // React StrictMode's dev-mode double-mount doesn't cause two
  // executors to write into the same bundle (which would duplicate
  // every commit). Each effect run creates a fresh bundle; the
  // cleanup flag prevents the racing first run from setting state.
  const [bundle, setBundle] = useState<TraceBundle | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [status, setStatus] = useState<"running" | "done" | "error">("running");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const localBundle = createTraceBundle();
    (async () => {
      try {
        const chart = buildDemoChart(localBundle.structure.recorder);
        const executor = new FlowChartExecutor(chart);
        localBundle.attachTo(executor);
        await executor.run({ input: {} });
        if (!cancelled) {
          setBundle(localBundle);
          setStatus("done");
        }
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runKey]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link to="/" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: 13 }}>
            ← Home
          </Link>
          <span style={{ color: "var(--text-muted)" }}>/</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>L8 Trace Explorer</span>
          <StatusPill status={status} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              setStatus("running");
              setErrorMsg(null);
              setRunKey((k) => k + 1);
            }}
            style={btnStyle}
          >
            ↻ Re-run
          </button>
        </div>
      </header>

      <div
        style={{
          padding: "12px 20px",
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
          fontSize: 13,
          color: "var(--text-secondary)",
        }}
      >
        Fork chart with loop. <strong>Try:</strong> drag the time slider •
        click a commit in the chain pane • click a stage breadcrumb in the
        node inspector • click a data-dep ref in the commit inspector.
      </div>

      {status === "error" && (
        <div
          style={{
            padding: 16,
            background: "rgba(239, 68, 68, 0.1)",
            color: "#fca5a5",
            fontFamily: "monospace",
            fontSize: 12,
          }}
        >
          Error: {errorMsg}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0 }}>
        {bundle ? (
          <TraceExplorerShell bundle={bundle} style={{ height: "100%" }} />
        ) : status === "running" ? (
          <div
            style={{
              padding: 32,
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            Running chart…
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "running" | "done" | "error" }) {
  const color =
    status === "running" ? "#fbbf24" : status === "done" ? "#22c55e" : "#ef4444";
  return (
    <span
      style={{
        marginLeft: 8,
        padding: "2px 8px",
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        background: `${color}22`,
        color,
        border: `1px solid ${color}55`,
      }}
    >
      {status}
    </span>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 500,
  background: "transparent",
  color: "var(--text-secondary)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  cursor: "pointer",
};
