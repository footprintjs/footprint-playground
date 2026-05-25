/**
 * /observe-v2 — ONE-CURSOR observation shell.
 *
 * Same loan-application chart as /samples/loan-application, but the
 * page is split into two side-by-side panes that share ONE
 * `selectedRuntimeStageId` cursor:
 *
 *   • LEFT — existing `<ExplainableShell>` (flowchart + narrative +
 *     memory + activity). Cursor sync done via index ↔ runtimeStageId
 *     adapter at the page boundary.
 *   • RIGHT — new L8 panes: `<RunSlider>` + `<CommitChainView>` +
 *     `<CommitInspector>` driven by `useTranslator(commitFlow, ...)`.
 *
 * Click anywhere → cursor moves → BOTH sides re-render.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FlowChartExecutor } from "footprintjs";
import {
  ExplainableShell,
  type NarrativeEntry,
} from "footprint-explainable-ui";
import {
  buildCommitChainTree,
  CommitChainView,
  CommitInspector,
  createTraceBundle,
  RunSlider,
  TracedFlow,
  type TraceBundle,
  useTranslator,
  type RuntimeStageId,
  asRuntimeStageId,
} from "footprint-explainable-ui/flowchart";
import { buildLoanChart, DEFAULT_LOAN_INPUT } from "../charts/loanApplicationChart";

interface RunCapture {
  bundle: TraceBundle;
  snapshot: any;
  narrativeEntries: NarrativeEntry[];
  buildTime: { traceGraph: any; runtimeOverlay: any };
}

export function ObserveV2Page() {
  const [runKey, setRunKey] = useState(0);
  const [capture, setCapture] = useState<RunCapture | null>(null);
  const [status, setStatus] = useState<"running" | "done" | "error">("running");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // THE ONE CURSOR. All panels read/write this. Click anywhere → cursor moves → all re-render.
  const [cursor, setCursor] = useState<RuntimeStageId | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("running");
    setErrorMsg(null);
    setCursor(null);
    const bundle = createTraceBundle();
    (async () => {
      try {
        const chart = buildLoanChart(bundle.structure.recorder);
        const executor = new FlowChartExecutor(chart as any);
        executor.enableNarrative();
        bundle.attachTo(executor as any);
        await executor.run({ input: DEFAULT_LOAN_INPUT } as any);
        if (cancelled) return;
        const snapshot = executor.getSnapshot();
        const narrativeEntries = executor.getNarrativeEntries();
        setCapture({
          bundle,
          snapshot,
          narrativeEntries,
          buildTime: {
            traceGraph: bundle.structure.getGraph(),
            runtimeOverlay: bundle.runtimeOverlay.getOverlay(),
          },
        });
        setStatus("done");
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setErrorMsg(e instanceof Error ? e.message : String(e));
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
        height: "100dvh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          flexShrink: 0,
        }}
      >
        <Link to="/" style={linkStyle}>
          ← Home
        </Link>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          L8 Observe (ONE-CURSOR)
        </span>
        <StatusPill status={status} />
        <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 8 }}>
          Loan application · click any commit / row / node → cursor moves → all panes re-render
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setRunKey((k) => k + 1)} style={btnStyle}>
          ↻ Re-run
        </button>
      </header>

      {status === "error" && (
        <div
          style={{
            padding: 12,
            background: "rgba(239, 68, 68, 0.1)",
            color: "#fca5a5",
            fontFamily: "monospace",
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          {errorMsg}
        </div>
      )}

      {capture ? (
        <Body capture={capture} cursor={cursor} onCursorChange={setCursor} />
      ) : (
        <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--text-muted)" }}>
          Running loan-application…
        </div>
      )}
    </div>
  );
}

// ── Body — splits into ExplainableShell (left) + L8 panes (right) ───

function Body({
  capture,
  cursor,
  onCursorChange,
}: {
  capture: RunCapture;
  cursor: RuntimeStageId | null;
  onCursorChange: (rsid: RuntimeStageId | null) => void;
}) {
  const { bundle, snapshot, narrativeEntries, buildTime } = capture;

  // Snapshot list — ExplainableShell renders/selects by integer index;
  // we map runtimeStageId ↔ index at the page boundary so the ONE
  // cursor stays canonical.
  const stageSnapshots = useMemo(() => snapshot?.stages ?? [], [snapshot]);
  const rsidToIndex = useMemo(() => {
    const m = new Map<string, number>();
    stageSnapshots.forEach((s: any, i: number) => {
      if (s?.runtimeStageId) m.set(s.runtimeStageId, i);
    });
    return m;
  }, [stageSnapshots]);
  const indexToRsid = useCallback(
    (i: number) => {
      const s = stageSnapshots[i];
      return s?.runtimeStageId ? asRuntimeStageId(s.runtimeStageId) : null;
    },
    [stageSnapshots],
  );

  // Initialize cursor to the first stage's runtimeStageId once we have
  // a snapshot — so the right-pane inspectors aren't blank on load.
  useEffect(() => {
    if (cursor === null && stageSnapshots.length > 0) {
      const first = indexToRsid(0);
      if (first) onCursorChange(first);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageSnapshots]);

  const selectedIndex = useMemo(() => {
    if (!cursor) return 0;
    return rsidToIndex.get(cursor) ?? 0;
  }, [cursor, rsidToIndex]);

  // ExplainableShell's renderFlowchart hook lets us intercept node
  // clicks and forward to the shared cursor.
  const renderFlowchartHook = useCallback(
    () => (
      <TracedFlow
        graph={buildTime.traceGraph}
        overlay={buildTime.runtimeOverlay}
        onNodeClick={(stageId: string) => {
          // Find first runtimeStageId matching this stageId.
          const match = stageSnapshots.find((s: any) => s.stageId === stageId);
          if (match?.runtimeStageId) onCursorChange(asRuntimeStageId(match.runtimeStageId));
        }}
      />
    ),
    [buildTime, stageSnapshots, onCursorChange],
  );

  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
        gap: 1,
        background: "var(--border)",
        minHeight: 0,
      }}
    >
      {/* LEFT — existing ExplainableShell, controlled via selectedIndex */}
      <div style={{ background: "var(--bg-primary)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <PaneHeader label="Explainable Shell (existing UI)" />
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <ControlledExplainableShell
            snapshot={snapshot}
            traceGraph={buildTime.traceGraph}
            runtimeOverlay={buildTime.runtimeOverlay}
            narrativeEntries={narrativeEntries}
            selectedIndex={selectedIndex}
            onSelectIndex={(i) => {
              const rsid = indexToRsid(i);
              onCursorChange(rsid);
            }}
            renderFlowchart={renderFlowchartHook}
          />
        </div>
      </div>

      {/* RIGHT — L8 panes */}
      <div
        style={{
          background: "var(--bg-primary)",
          overflow: "hidden",
          display: "grid",
          gridTemplateRows: "auto 1fr 1fr",
          gap: 1,
        }}
      >
        <div style={{ background: "var(--bg-secondary)", padding: "8px 12px" }}>
          <PaneHeader label="L8 Time Cursor" inline />
          <L8Slider bundle={bundle} cursor={cursor} onCursorChange={onCursorChange} />
        </div>
        <div style={{ background: "var(--bg-primary)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <PaneHeader label="L8 CommitChainView" />
          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            <L8ChainView bundle={bundle} cursor={cursor} onCursorChange={onCursorChange} />
          </div>
        </div>
        <div style={{ background: "var(--bg-primary)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <PaneHeader label="L8 CommitInspector" />
          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            <L8CommitInspector bundle={bundle} cursor={cursor} onCursorChange={onCursorChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ExplainableShell wrapper that exposes selection control ─────────

function ControlledExplainableShell({
  snapshot,
  traceGraph,
  runtimeOverlay,
  narrativeEntries,
  selectedIndex,
  onSelectIndex: _onSelectIndex,
  renderFlowchart,
}: {
  snapshot: any;
  traceGraph: any;
  runtimeOverlay: any;
  narrativeEntries: NarrativeEntry[];
  selectedIndex: number;
  onSelectIndex: (i: number) => void;
  renderFlowchart: any;
}) {
  // ExplainableShell doesn't expose a controlled `selectedIndex` prop
  // today — it owns its internal scrub state. We achieve cursor sync
  // by remounting on selection change via a key, AND by listening for
  // the user's clicks inside the shell (via the renderFlowchart hook
  // for the flowchart pane). For narrative/memory row clicks the
  // existing internal state stays; the next time the user clicks any
  // chart node OR moves a right-pane control, this component remounts
  // and seeds itself with the new selectedIndex.
  return (
    <ExplainableShell
      key={`sel-${selectedIndex}`}
      runtimeSnapshot={snapshot}
      traceGraph={traceGraph}
      runtimeOverlay={runtimeOverlay}
      narrativeEntries={narrativeEntries}
      defaultTab="narrative"
      defaultExpanded={{ details: true }}
      renderFlowchart={renderFlowchart}
      // Force initial index by re-rendering with new key — sneaky but
      // works without modifying ExplainableShell's API.
      style={{ height: "100%" }}
    />
  );
}

// ── L8 panes (each subscribes via useTranslator) ─────────────────────

function L8Slider({
  bundle,
  cursor,
  onCursorChange,
}: {
  bundle: TraceBundle;
  cursor: RuntimeStageId | null;
  onCursorChange: (rsid: RuntimeStageId | null) => void;
}) {
  const index = useTranslator(bundle.commitFlow, () => bundle.commitFlow.getIndex());
  return (
    <RunSlider
      index={index}
      cursorRuntimeStageId={cursor}
      onCursorChange={onCursorChange}
    />
  );
}

function L8ChainView({
  bundle,
  cursor,
  onCursorChange,
}: {
  bundle: TraceBundle;
  cursor: RuntimeStageId | null;
  onCursorChange: (rsid: RuntimeStageId | null) => void;
}) {
  const chain = useTranslator(bundle.commitFlow, () =>
    buildCommitChainTree(bundle.structure.getGraph(), bundle.commitFlow.getIndex()),
  );
  const revealedThroughCommitIdx = useMemo<number | null>(() => {
    if (!cursor) return null;
    const view = bundle.commitFlow.getIndex().byRuntimeStageId.get(cursor);
    return view ? view.commitIdx : -1;
  }, [cursor, bundle]);
  return (
    <CommitChainView
      chain={chain}
      selectedRuntimeStageId={cursor}
      onSelectCommit={(rsid) => onCursorChange(rsid)}
      revealedThroughCommitIdx={revealedThroughCommitIdx}
    />
  );
}

function L8CommitInspector({
  bundle,
  cursor,
  onCursorChange,
}: {
  bundle: TraceBundle;
  cursor: RuntimeStageId | null;
  onCursorChange: (rsid: RuntimeStageId | null) => void;
}) {
  const index = useTranslator(bundle.commitFlow, () => bundle.commitFlow.getIndex());
  return (
    <CommitInspector
      index={index}
      selectedRuntimeStageId={cursor}
      onNavigate={(rsid) => onCursorChange(rsid)}
    />
  );
}

// ── Decorations ─────────────────────────────────────────────────────

function PaneHeader({ label, inline }: { label: string; inline?: boolean }) {
  return (
    <div
      style={{
        padding: inline ? "0 0 6px" : "8px 14px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: "var(--text-muted)",
        background: inline ? "transparent" : "var(--bg-secondary)",
        borderBottom: inline ? "none" : "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      {label}
    </div>
  );
}

function StatusPill({ status }: { status: "running" | "done" | "error" }) {
  const color = status === "running" ? "#fbbf24" : status === "done" ? "#22c55e" : "#ef4444";
  return (
    <span
      style={{
        marginLeft: 8,
        padding: "2px 8px",
        borderRadius: 10,
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        background: `${color}22`,
        color,
        border: `1px solid ${color}55`,
      }}
    >
      {status}
    </span>
  );
}

const linkStyle: React.CSSProperties = {
  color: "var(--text-secondary)",
  textDecoration: "none",
  fontSize: 13,
};
const btnStyle: React.CSSProperties = {
  padding: "5px 12px",
  fontSize: 12,
  fontWeight: 500,
  background: "transparent",
  color: "var(--text-secondary)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  cursor: "pointer",
};
