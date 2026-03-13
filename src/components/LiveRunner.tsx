import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toVisualizationSnapshots, GanttTimeline, StageDetailPanel } from "footprint-explainable-ui";
import { useTheme } from "../ThemeContext";
import { samples } from "../samples/catalog";
import {
  executeCode,
  type ExecutionResult,
} from "../runner/executeCode";
import {
  StageNode,
  SubflowBreadcrumb,
  SubflowTree,
  useSubflowNavigation,
  specToReactFlow,
  type ExecutionOverlay,
  type SpecNode,
} from "footprint-explainable-ui/flowchart";
import { SpecView } from "./SpecView";

const nodeTypes: NodeTypes = { stage: StageNode as any };

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

// ─── Shared hook: encapsulates subflow viz derivation, overlay, time-travel ──
// Both ExplainableSection and AICompatibleSection use this to get the same
// behavior — parent and subflow charts are treated identically.

function useFlowchartData(
  spec: SpecNode | null,
  vizSnapshots: any[] | null,
) {
  const [snapshotIdx, setSnapshotIdx] = useState(0);

  // Navigation state only — no overlay passed (eliminates one-frame ref lag)
  const subflowNav = useSubflowNavigation(spec);

  // Derive subflow vizSnapshots when drilled into a subflow
  const subflowVizSnapshots = useMemo(() => {
    if (!subflowNav.isInSubflow || !vizSnapshots) return null;
    const subflowNodeName = subflowNav.currentSubflowNodeName;
    if (!subflowNodeName) return null;
    const parentSnap = vizSnapshots.find((s: any) => s.stageLabel === subflowNodeName);
    const sfResult = (parentSnap as any)?.subflowResult as any;
    const tc = sfResult?.treeContext;
    if (!tc?.stageContexts) return null;
    try {
      const snaps = toVisualizationSnapshots({
        sharedState: tc.globalContext,
        executionTree: tc.stageContexts,
        commitLog: tc.history ?? [],
      } as any);
      // Strip builder's "subflowId/" prefix so stageLabels match flowchart node IDs
      const prefix = sfResult.subflowId ? `${sfResult.subflowId}/` : null;
      if (prefix) {
        for (const snap of snaps) {
          if (snap.stageLabel.startsWith(prefix)) snap.stageLabel = snap.stageLabel.slice(prefix.length);
          if (snap.stageName.startsWith(prefix)) snap.stageName = snap.stageName.slice(prefix.length);
          if (snap.narrative) snap.narrative = snap.narrative.replaceAll(prefix, '');
        }
      }
      return snaps;
    } catch {
      return null;
    }
  }, [vizSnapshots, subflowNav.isInSubflow, subflowNav.currentSubflowNodeName]);

  // Active data — switches between parent and subflow
  const activeSnapshots = subflowVizSnapshots ?? vizSnapshots;
  const currentSnap = activeSnapshots?.[snapshotIdx];

  // Execution overlay — computed synchronously, no ref lag
  const executionOverlay = useMemo<ExecutionOverlay | undefined>(() => {
    if (!activeSnapshots) return undefined;
    const executionOrder = activeSnapshots
      .slice(0, snapshotIdx + 1)
      .map((s: any) => s.stageLabel as string);
    const doneStages = new Set(
      activeSnapshots.slice(0, snapshotIdx).map((s: any) => s.stageLabel)
    );
    const activeStage = activeSnapshots[snapshotIdx]?.stageLabel ?? null;
    const executedStages = new Set([...doneStages]);
    if (activeStage) executedStages.add(activeStage);
    return { doneStages, activeStage, executedStages, executionOrder };
  }, [activeSnapshots, snapshotIdx]);

  // Derive nodes/edges directly with the correct overlay — no ref indirection
  const currentSpec = subflowNav.breadcrumbs.length > 0
    ? subflowNav.breadcrumbs[subflowNav.breadcrumbs.length - 1].spec
    : null;

  const flowData = useMemo(() => {
    if (!currentSpec || !activeSnapshots) return null;
    const { nodes, edges } = specToReactFlow(currentSpec, executionOverlay);
    return { nodes, edges };
  }, [currentSpec, activeSnapshots, executionOverlay]);

  // Reset snapshot index when drilling in/out of subflow
  const prevIsInSubflow = useRef(false);
  useEffect(() => {
    if (subflowNav.isInSubflow !== prevIsInSubflow.current) {
      prevIsInSubflow.current = subflowNav.isInSubflow;
      setSnapshotIdx(0);
    }
  }, [subflowNav.isInSubflow]);

  return {
    subflowNav,
    activeSnapshots,
    snapshotIdx,
    setSnapshotIdx,
    currentSnap,
    flowData,
  };
}

type LeftTab = "code" | "spec" | "flowchart";
type RightTab = "result" | "trace" | "narrative";

type MobilePanel = "code" | "output";

export function LiveRunner() {
  const { theme, toggle } = useTheme();
  const { sampleId } = useParams<{ sampleId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Resolve sample from URL param, fallback to first sample
  const resolvedSample = samples.find((s) => s.id === sampleId) ?? samples[0];

  const [code, setCode] = useState(resolvedSample.code);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [running, setRunning] = useState(false);
  const [leftTab, setLeftTab] = useState<LeftTab>("code");
  const [rightTab, setRightTab] = useState<RightTab>("result");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [inputJson, setInputJson] = useState(resolvedSample.defaultInput ?? "");
  const [inputOpen, setInputOpen] = useState(!!resolvedSample.defaultInput);
  const [showInputModal, setShowInputModal] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("code");

  const selectedId = resolvedSample.id;
  const selectedSample = resolvedSample;
  const hasDefaultInput = !!selectedSample?.defaultInput;

  // Sync state when URL param changes
  useEffect(() => {
    setCode(resolvedSample.code);
    setInputJson(resolvedSample.defaultInput ?? "");
    setInputOpen(!!resolvedSample.defaultInput);
    setResult(null);
    setLeftTab("code");
    setRightTab("result" as RightTab);
  }, [resolvedSample.id]);

  const handleSampleChange = useCallback((id: string) => {
    navigate(`/samples/${id}`);
  }, [navigate]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setResult(null);
    if (isMobile) setMobilePanel("output");
    try {
      const res = await executeCode(code, inputJson || undefined);
      setResult(res);
      setRightTab("result" as RightTab);
    } catch (e: unknown) {
      setResult({
        snapshot: null,
        logs: [],
        narrative: [],
        buildTime: null,
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setRunning(false);
    }
  }, [code, inputJson, isMobile]);

  // Derive visualization snapshots for time-travel
  const vizSnapshots = useMemo(() => {
    if (!result?.snapshot) return null;
    try {
      return toVisualizationSnapshots(result.snapshot as any);
    } catch {
      return null;
    }
  }, [result]);

  // Build-time flowchart with subflow drill-down (plain gray — no execution overlay)
  const buildTimeSpec = (result?.buildTime?.spec as unknown as SpecNode) ?? null;
  const buildSubflow = useSubflowNavigation(buildTimeSpec);
  const buildTimeFlowData = buildTimeSpec
    ? { nodes: buildSubflow.nodes, edges: buildSubflow.edges }
    : null;

  // (Subflow state, overlay, time-travel all managed inside ExplainableSection/AICompatibleSection
  // via useFlowchartData hook — LiveRunner just passes spec + vizSnapshots)

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
      }}
    >
      {/* Toolbar */}
      <Toolbar
        selectedId={selectedId}
        description={selectedSample?.description}
        theme={theme}
        isMobile={isMobile}
        onSampleChange={handleSampleChange}
        onToggleTheme={toggle}
      />

      {/* Mobile panel toggle */}
      {isMobile && (
        <MobilePanelToggle
          active={mobilePanel}
          onChange={setMobilePanel}
          hasResult={!!result}
        />
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* === Left Panel (collapsible) === */}
        {(!isMobile && leftCollapsed) ? (
          /* Collapsed: thin strip with expand button */
          <div
            style={{
              width: 36,
              flexShrink: 0,
              borderRight: "1px solid var(--border)",
              background: "var(--bg-secondary)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 8,
            }}
          >
            <button
              onClick={() => setLeftCollapsed(false)}
              title="Expand code panel"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                borderRadius: 6,
                width: 26,
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              &#9654;
            </button>
            <div
              style={{
                writingMode: "vertical-rl",
                fontSize: 11,
                color: "var(--text-muted)",
                marginTop: 12,
                letterSpacing: 1,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Code
            </div>
          </div>
        ) : (!isMobile || mobilePanel === "code") ? (
          /* Expanded: full left panel */
          <div
            style={{
              width: isMobile ? "100%" : "45%",
              borderRight: isMobile ? "none" : "1px solid var(--border)",
              display: isMobile && mobilePanel !== "code" ? "none" : "flex",
              flexDirection: "column",
            }}
          >
            <TabBar
              tabs={[
                { id: "code", label: "Code" },
                {
                  id: "spec",
                  label: isMobile ? "Spec" : "Flow Definition",
                  disabled: !result?.buildTime,
                },
                {
                  id: "flowchart",
                  label: "Flowchart",
                  disabled: !buildTimeFlowData,
                },
              ]}
              active={leftTab}
              onChange={(t) => setLeftTab(t as LeftTab)}
              trailing={
                isMobile ? (
                  <button
                    onClick={hasDefaultInput ? () => setShowInputModal(true) : handleRun}
                    disabled={running}
                    style={{
                      background: "var(--accent)",
                      border: "none",
                      color: "white",
                      borderRadius: 6,
                      padding: "6px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      marginRight: 8,
                    }}
                  >
                    {running ? "..." : "Run"}
                  </button>
                ) : (
                <button
                  onClick={() => setLeftCollapsed(true)}
                  title="Collapse code panel"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "0 10px",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  &#9664;
                </button>
                )
              }
            />
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {leftTab === "code" && (
                <>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <Editor
                      height="100%"
                      language="typescript"
                      theme={theme === "dark" ? "vs-dark" : "vs"}
                      value={code}
                      onChange={(val) => setCode(val ?? "")}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', monospace",
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        padding: { top: 12 },
                        renderLineHighlight: "none",
                      }}
                    />
                  </div>
                  {/* === Input Panel (GraphiQL-style variables) === */}
                  <div
                    style={{
                      borderTop: "1px solid var(--border)",
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => setInputOpen((o) => !o)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        background: "var(--bg-secondary)",
                        border: "none",
                        borderBottom: inputOpen
                          ? "1px solid var(--border)"
                          : "none",
                        color: "var(--text-secondary)",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 8,
                          transition: "transform 0.15s",
                          transform: inputOpen
                            ? "rotate(90deg)"
                            : "rotate(0deg)",
                          display: "inline-block",
                        }}
                      >
                        &#9654;
                      </span>
                      Input
                      {inputJson.trim() && (
                        <span
                          style={{
                            marginLeft: 4,
                            fontSize: 9,
                            color: "var(--accent)",
                            fontWeight: 400,
                          }}
                        >
                          (JSON)
                        </span>
                      )}
                    </button>
                    {inputOpen && (
                      <div style={{ height: 160 }}>
                        <Editor
                          height="100%"
                          language="json"
                          theme={theme === "dark" ? "vs-dark" : "vs"}
                          value={inputJson}
                          onChange={(val) => setInputJson(val ?? "")}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 12,
                            fontFamily: "'JetBrains Mono', monospace",
                            lineNumbers: "off",
                            scrollBeyondLastLine: false,
                            wordWrap: "on",
                            padding: { top: 8 },
                            renderLineHighlight: "none",
                            folding: false,
                            glyphMargin: false,
                            lineDecorationsWidth: 8,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
              {leftTab === "spec" && result?.buildTime && (
                <SpecView buildTime={result.buildTime} />
              )}
              {leftTab === "flowchart" && buildTimeFlowData && (
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                  <SubflowBreadcrumb
                    breadcrumbs={buildSubflow.breadcrumbs}
                    onNavigate={buildSubflow.navigateTo}
                  />
                  <div style={{ flex: 1 }}>
                    <ReactFlow
                      nodes={buildTimeFlowData.nodes}
                      edges={buildTimeFlowData.edges}
                      nodeTypes={nodeTypes}
                      fitView
                      proOptions={{ hideAttribution: true }}
                      nodesDraggable={false}
                      nodesConnectable={false}
                      elementsSelectable
                      panOnDrag
                      zoomOnScroll
                      onNodeClick={(_e, node) => buildSubflow.handleNodeClick(node.id)}
                    >
                      <Background
                        color={theme === "dark" ? "#2e2938" : "#e4d5c3"}
                        gap={20}
                        size={1}
                      />
                    </ReactFlow>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* === Right Panel === */}
        <div
          style={{
            flex: 1,
            display: isMobile && mobilePanel !== "output" ? "none" : "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {!result && !running && (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <button
                onClick={hasDefaultInput ? () => setShowInputModal(true) : handleRun}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  padding: "14px 32px",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: "0 4px 16px rgba(124, 108, 240, 0.3)",
                }}
              >
                <span style={{ fontSize: 20 }}>&#9654;</span>
                {hasDefaultInput ? "Configure & Run" : "Run"}
              </button>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {hasDefaultInput
                  ? "Edit input values and run the pipeline"
                  : "Execute and see the result, explainable trace, and AI narrative"}
              </div>
              {hasDefaultInput && (
                <button
                  onClick={handleRun}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                    borderRadius: 6,
                    padding: "6px 16px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Run with defaults
                </button>
              )}
            </div>
          )}

          {running && (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 12,
                color: "var(--text-muted)",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  border: "3px solid var(--border)",
                  borderTopColor: "var(--accent)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Executing pipeline...
            </div>
          )}

          {result && !running && (
            <>
              {result.error && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "rgba(239, 68, 68, 0.1)",
                    borderBottom: "1px solid var(--error)",
                    color: "var(--error)",
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    flexShrink: 0,
                  }}
                >
                  Error: {result.error}
                </div>
              )}

              <TabBar
                tabs={[
                  { id: "result", label: "Result" },
                  {
                    id: "trace",
                    label: "Self-Explaining Trace",
                    disabled: !buildTimeSpec && !vizSnapshots,
                  },
                  {
                    id: "narrative",
                    label: "LLM Narrative",
                    disabled: result.narrative.length === 0,
                  },
                ]}
                active={rightTab}
                onChange={(t) => setRightTab(t as RightTab)}
              />

              <div style={{ flex: 1, overflow: "hidden" }}>
                {rightTab === "result" && <ResultSection result={result} />}

                {rightTab === "trace" && (
                  <ExplainableSection
                    spec={buildTimeSpec}
                    vizSnapshots={vizSnapshots}
                    theme={theme}
                  />
                )}

                {rightTab === "narrative" && (
                  <AICompatibleSection
                    narrative={result.narrative}
                    spec={buildTimeSpec}
                    vizSnapshots={vizSnapshots}
                    theme={theme}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Input Form Modal */}
      {showInputModal && (
        <InputFormModal
          inputJson={inputJson}
          theme={theme}
          onRun={(json) => {
            setInputJson(json);
            setShowInputModal(false);
            // Run after state update
            setTimeout(async () => {
              setRunning(true);
              setResult(null);
              try {
                const res = await executeCode(code, json || undefined);
                setResult(res);
                setRightTab("result" as RightTab);
              } catch (e: unknown) {
                setResult({
                  snapshot: null,
                  logs: [],
                  narrative: [],
                  buildTime: null,
                  error: e instanceof Error ? e.message : String(e),
                });
              } finally {
                setRunning(false);
              }
            }, 0);
          }}
          onCancel={() => setShowInputModal(false)}
          onChange={setInputJson}
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Toolbar({
  selectedId,
  description,
  theme,
  isMobile,
  onSampleChange,
  onToggleTheme,
}: {
  selectedId: string;
  description?: string;
  theme: string;
  isMobile: boolean;
  onSampleChange: (id: string) => void;
  onToggleTheme: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 8 : 12,
        padding: isMobile ? "8px 10px" : "8px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: isMobile ? 14 : 16,
          color: "var(--accent)",
          letterSpacing: "-0.5px",
          flexShrink: 0,
        }}
      >
        FootPrint
      </div>

      <select
        value={selectedId}
        onChange={(e) => onSampleChange(e.target.value)}
        style={{
          background: "var(--bg-tertiary)",
          color: "var(--text-primary)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "6px 10px",
          fontSize: isMobile ? 12 : 13,
          cursor: "pointer",
          outline: "none",
          flex: isMobile ? 1 : undefined,
          minWidth: 0,
        }}
      >
        {(() => {
          const groups: { category: string; items: typeof samples }[] = [];
          for (const s of samples) {
            const last = groups[groups.length - 1];
            if (last && last.category === s.category) {
              last.items.push(s);
            } else {
              groups.push({ category: s.category, items: [s] });
            }
          }
          return groups.map((g) => (
            <optgroup key={g.category} label={g.category}>
              {g.items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          ));
        })()}
      </select>

      {!isMobile && (
        <div
          style={{
            flex: 1,
            fontSize: 12,
            color: "var(--text-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {description}
        </div>
      )}

      {!isMobile && (
        <Link
          to="/"
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            textDecoration: "none",
          }}
        >
          How It Works
        </Link>
      )}

      <button
        onClick={onToggleTheme}
        style={{
          background: "none",
          border: "none",
          fontSize: 18,
          cursor: "pointer",
          padding: 4,
        }}
      >
        {theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
      </button>
    </div>
  );
}

function MobilePanelToggle({
  active,
  onChange,
  hasResult,
}: {
  active: MobilePanel;
  onChange: (panel: MobilePanel) => void;
  hasResult: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        flexShrink: 0,
      }}
    >
      {(["code", "output"] as const).map((panel) => (
        <button
          key={panel}
          onClick={() => onChange(panel)}
          style={{
            flex: 1,
            padding: "10px 0",
            border: "none",
            borderBottom: active === panel ? "2px solid var(--accent)" : "2px solid transparent",
            background: "transparent",
            color: active === panel ? "var(--accent)" : "var(--text-muted)",
            fontSize: 13,
            fontWeight: active === panel ? 600 : 400,
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {panel === "code" ? "Code" : hasResult ? "Output" : "Run"}
        </button>
      ))}
    </div>
  );
}

function TabBar({
  tabs,
  active,
  onChange,
  trailing,
}: {
  tabs: { id: string; label: string; disabled?: boolean }[];
  active: string;
  onChange: (id: string) => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        flexShrink: 0,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
          style={{
            padding: "8px 16px",
            border: "none",
            borderBottom:
              active === tab.id
                ? "2px solid var(--accent)"
                : "2px solid transparent",
            background: "transparent",
            color: tab.disabled
              ? "var(--text-muted)"
              : active === tab.id
                ? "var(--accent)"
                : "var(--text-secondary)",
            fontSize: 12,
            fontWeight: active === tab.id ? 600 : 400,
            cursor: tab.disabled ? "default" : "pointer",
            opacity: tab.disabled ? 0.5 : 1,
            transition: "all 0.15s",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {tab.label}
        </button>
      ))}
      {trailing && (
        <>
          <div style={{ flex: 1 }} />
          {trailing}
        </>
      )}
    </div>
  );
}

// ─── Input Form Modal ────────────────────────────────────────────────────────

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--text-secondary)",
  display: "block",
  marginBottom: 4,
};

const fieldInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  fontSize: 13,
  fontFamily: "'JetBrains Mono', monospace",
  background: "var(--bg-primary)",
  color: "var(--text-primary)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

function InputFormModal({
  inputJson,
  theme,
  onRun,
  onCancel,
  onChange,
}: {
  inputJson: string;
  theme: string;
  onRun: (json: string) => void;
  onCancel: () => void;
  onChange: (json: string) => void;
}) {
  const [showJson, setShowJson] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    try {
      return JSON.parse(inputJson);
    } catch {
      return {};
    }
  });

  const updateField = useCallback((path: string[], value: unknown) => {
    setFormData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      let obj = next;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return next;
    });
  }, []);

  const jsonFromForm = JSON.stringify(formData, null, 2);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          width: "min(540px, 92vw)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
            Input
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setShowJson(false)}
              style={{
                background: !showJson ? "var(--accent)" : "transparent",
                color: !showJson ? "white" : "var(--text-muted)",
                border: !showJson ? "none" : "1px solid var(--border)",
                borderRadius: 6,
                padding: "5px 12px",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              Form
            </button>
            <button
              onClick={() => setShowJson(true)}
              style={{
                background: showJson ? "var(--accent)" : "transparent",
                color: showJson ? "white" : "var(--text-muted)",
                border: showJson ? "none" : "1px solid var(--border)",
                borderRadius: 6,
                padding: "5px 12px",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              JSON
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: showJson ? "0" : "16px 24px" }}>
          {showJson ? (
            <Editor
              height="340px"
              language="json"
              theme={theme === "dark" ? "vs-dark" : "vs"}
              value={jsonFromForm}
              onChange={(val) => {
                try {
                  const parsed = JSON.parse(val ?? "");
                  setFormData(parsed);
                  onChange(val ?? "");
                } catch {
                  onChange(val ?? "");
                }
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                lineNumbers: "off",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                padding: { top: 12, bottom: 12 },
                renderLineHighlight: "none",
              }}
            />
          ) : (
            <FormFields data={formData} path={[]} onChange={updateField} />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              borderRadius: 8,
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onRun(jsonFromForm)}
            style={{
              background: "var(--accent)",
              border: "none",
              color: "white",
              borderRadius: 8,
              padding: "9px 28px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 12px rgba(124, 108, 240, 0.35)",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 12 }}>&#9654;</span> Run
          </button>
        </div>
      </div>
    </div>
  );
}

/** Recursively renders form fields from a JSON object. */
function FormFields({
  data,
  path,
  onChange,
}: {
  data: Record<string, unknown>;
  path: string[];
  onChange: (path: string[], value: unknown) => void;
}) {
  const isTopLevel = path.length === 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isTopLevel ? "1fr" : "1fr 1fr",
        gap: isTopLevel ? 12 : 10,
      }}
    >
      {Object.entries(data).map(([key, value]) => {
        const fieldPath = [...path, key];
        const label = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (c) => c.toUpperCase())
          .trim();

        // Nested object → fieldset section (spans full width)
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          return (
            <fieldset
              key={key}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "14px 16px 16px",
                margin: 0,
                background: "var(--bg-secondary)",
                gridColumn: "1 / -1",
              }}
            >
              <legend
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--accent)",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  padding: "0 6px",
                }}
              >
                {label}
              </legend>
              <FormFields
                data={value as Record<string, unknown>}
                path={fieldPath}
                onChange={onChange}
              />
            </fieldset>
          );
        }

        // Boolean → toggle-style checkbox
        if (typeof value === "boolean") {
          return (
            <label
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
            >
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(fieldPath, e.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: "var(--accent)",
                  cursor: "pointer",
                }}
              />
              <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                {label}
              </span>
            </label>
          );
        }

        // Number → number input
        if (typeof value === "number") {
          return (
            <div key={key}>
              <label style={fieldLabelStyle}>{label}</label>
              <input
                type="number"
                value={value}
                onChange={(e) =>
                  onChange(fieldPath, e.target.value === "" ? 0 : Number(e.target.value))
                }
                style={fieldInputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124, 108, 240, 0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          );
        }

        // String → text input (spans full width)
        return (
          <div key={key} style={{ gridColumn: "1 / -1" }}>
            <label style={fieldLabelStyle}>{label}</label>
            <input
              type="text"
              value={String(value ?? "")}
              onChange={(e) => onChange(fieldPath, e.target.value)}
              style={fieldInputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124, 108, 240, 0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: "var(--text-muted)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Renders the ReactFlow flowchart and syncs nodes/edges via useNodesState/useEdgesState
 * so the chart stays mounted and only node data (colors, step numbers) updates in place.
 * No more key-based remount — the path draws on the existing graph like Google Maps.
 */
function OverlayFlowChart({
  flowData,
  theme,
  onNodeClick,
}: {
  flowData: { nodes: any[]; edges: any[] };
  theme: string;
  onNodeClick: (_: unknown, node: { id: string }) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(flowData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowData.edges);

  // Sync when overlay data changes (time-travel step)
  // Pushes new node/edge data into ReactFlow's internal state without remounting
  useEffect(() => {
    setNodes(flowData.nodes);
    setEdges(flowData.edges);
  }, [flowData, setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      fitView
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      panOnDrag
      zoomOnScroll
    >
      <Background
        color={theme === "dark" ? "#2e2938" : "#e4d5c3"}
        gap={20}
        size={1}
      />
    </ReactFlow>
  );
}

function NavButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border)",
        color: disabled ? "var(--text-muted)" : "var(--text-primary)",
        borderRadius: 6,
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

// ─── Result Tab ──────────────────────────────────────────────────────────────

function ResultSection({ result }: { result: ExecutionResult }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {result.snapshot && (
        <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
          <SectionLabel>Business Result (Scope)</SectionLabel>
          <pre
            style={{
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              color: "var(--text-primary)",
              background: "var(--bg-secondary)",
              padding: 8,
              borderRadius: 6,
              overflow: "auto",
              margin: 0,
            }}
          >
            {JSON.stringify(result.snapshot.sharedState, null, 2)}
          </pre>
        </div>
      )}

      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: 12,
          overflow: "auto",
          maxHeight: "40%",
          flexShrink: 0,
        }}
      >
        <SectionLabel>Console</SectionLabel>
        {result.logs.length === 0 && (
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            No console output
          </div>
        )}
        {result.logs.map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              color: line.startsWith("ERROR")
                ? "var(--error)"
                : "var(--text-primary)",
              padding: "2px 0",
              borderBottom: "1px solid var(--bg-secondary)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Explainable Tab ─────────────────────────────────────────────────────────
// Side-by-side: flowchart (with overlay) | collapsible detail panel with sub-tabs
// Slider time-travel. Gantt at bottom.

function ExplainableSection({
  spec,
  vizSnapshots,
  theme,
}: {
  spec: SpecNode | null;
  vizSnapshots: any[] | null;
  theme: string;
}) {
  const {
    subflowNav,
    activeSnapshots,
    snapshotIdx,
    setSnapshotIdx: onSnapshotChange,
    currentSnap,
    flowData: overlayFlowData,
  } = useFlowchartData(spec, vizSnapshots);

  const [detailOpen, setDetailOpen] = useState(true);
  const [ganttOpen, setGanttOpen] = useState(true);
  const [treeOpen, setTreeOpen] = useState(true);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = activeSnapshots?.length ?? 0;
  const canPrev = snapshotIdx > 0;
  const canNext = snapshotIdx < total - 1;

  // Auto-advance during playback — uses actual stage durations from Gantt
  useEffect(() => {
    if (!playing || !activeSnapshots) return;
    if (snapshotIdx >= total - 1) {
      setPlaying(false);
      return;
    }
    const stageDur = activeSnapshots[snapshotIdx]?.durationMs ?? 1;
    const totalDur = activeSnapshots.reduce(
      (sum: number, s: any) => sum + (s.durationMs ?? 1),
      0
    );
    const normalized = totalDur > 0
      ? 300 + (stageDur / totalDur) * 1200
      : 600;
    playRef.current = setTimeout(() => {
      onSnapshotChange(snapshotIdx + 1);
    }, normalized);
    return () => {
      if (playRef.current) clearTimeout(playRef.current);
    };
  }, [playing, snapshotIdx, activeSnapshots, total, onSnapshotChange]);

  // Click a flowchart node → drill into subflow, or jump to that stage's snapshot
  const handleNodeClick = useCallback(
    (_: unknown, node: { id: string }) => {
      if (subflowNav.handleNodeClick(node.id)) return;
      if (!activeSnapshots) return;
      const idx = activeSnapshots.findIndex(
        (s: any) => s.stageLabel === node.id
      );
      if (idx >= 0) {
        onSnapshotChange(idx);
        setDetailOpen(true);
      }
    },
    [activeSnapshots, onSnapshotChange, subflowNav]
  );

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Main area: tree + flowchart + collapsible detail panel */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* SubflowTree sidebar */}
        {spec && treeOpen && (
          <div style={{ width: 200, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 0 0", flexShrink: 0 }}>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => setTreeOpen(false)}
                title="Hide tree"
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px 6px", fontSize: 10 }}
              >
                ◀
              </button>
            </div>
            <SubflowTree
              spec={spec}
              activeStage={currentSnap?.stageLabel ?? null}
              doneStages={activeSnapshots ? new Set(activeSnapshots.slice(0, snapshotIdx).map((s: any) => s.stageLabel)) : undefined}
              onNodeSelect={(name, isSf) => {
                if (isSf) subflowNav.handleNodeClick(name);
                else if (activeSnapshots) {
                  const idx = activeSnapshots.findIndex((s: any) => s.stageLabel === name);
                  if (idx >= 0) onSnapshotChange(idx);
                }
              }}
              style={{ flex: 1, overflow: "auto" }}
            />
          </div>
        )}
        {spec && !treeOpen && (
          <button
            onClick={() => setTreeOpen(true)}
            title="Show pipeline tree"
            style={{ width: 28, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--bg-secondary)", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ▶
          </button>
        )}
        {/* Flowchart — uses OverlayFlowChart to update nodes/edges in-place */}
        {overlayFlowData && (
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              borderRight: detailOpen
                ? "1px solid var(--border)"
                : "none",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SubflowBreadcrumb
              breadcrumbs={subflowNav.breadcrumbs}
              onNavigate={subflowNav.navigateTo}
            />
            <div style={{ flex: 1 }}>
              <OverlayFlowChart
                flowData={overlayFlowData}
                theme={theme}
                onNodeClick={handleNodeClick}
              />
            </div>
            {/* Toggle to open detail panel when collapsed */}
            {!detailOpen && currentSnap && (
              <button
                onClick={() => setDetailOpen(true)}
                title="Show detail panel"
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 11,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  zIndex: 5,
                }}
              >
                ◀ Details
              </button>
            )}
          </div>
        )}

        {/* Collapsible detail panel with sub-tabs */}
        {detailOpen && currentSnap && (
          <div
            style={{
              width: "40%",
              minWidth: 280,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "var(--bg-primary)",
            }}
          >
            {/* Stage header with collapse button */}
            <div
              style={{
                padding: "10px 12px 0",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--accent)",
                    flex: 1,
                  }}
                >
                  {currentSnap.stageLabel}
                </span>
                {currentSnap.durationMs !== undefined && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      fontFamily: "'JetBrains Mono', monospace",
                      background: "var(--bg-tertiary)",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {currentSnap.durationMs}ms
                  </span>
                )}
                <button
                  onClick={() => setDetailOpen(false)}
                  title="Collapse detail panel"
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    borderRadius: 4,
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                >
                  ▶
                </button>
              </div>

              {/* Time-travel controls */}
              {activeSnapshots && activeSnapshots.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "6px 0",
                  }}
                >
                  <NavButton
                    label="◀"
                    disabled={!canPrev || playing}
                    onClick={() => { setPlaying(false); onSnapshotChange(snapshotIdx - 1); }}
                  />
                  <button
                    onClick={() => {
                      if (playing) {
                        setPlaying(false);
                      } else {
                        if (snapshotIdx >= total - 1) onSnapshotChange(0);
                        setPlaying(true);
                      }
                    }}
                    style={{
                      background: playing ? "var(--accent)" : "var(--bg-tertiary)",
                      border: "1px solid var(--border)",
                      color: playing ? "white" : "var(--text-primary)",
                      borderRadius: 6,
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                    title={playing ? "Pause" : "Play"}
                  >
                    {playing ? "⏸" : "▶"}
                  </button>
                  <NavButton
                    label="▶"
                    disabled={!canNext || playing}
                    onClick={() => { setPlaying(false); onSnapshotChange(snapshotIdx + 1); }}
                  />
                  {/* Tick-mark scrubber */}
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    {activeSnapshots.map((_: any, i: number) => {
                      const isActive = i === snapshotIdx;
                      const isDone = i < snapshotIdx;
                      return (
                        <button
                          key={i}
                          onClick={() => { setPlaying(false); onSnapshotChange(i); }}
                          title={activeSnapshots[i].stageLabel}
                          style={{
                            flex: 1,
                            height: isActive ? 12 : 6,
                            borderRadius: 3,
                            border: "none",
                            cursor: "pointer",
                            background: isActive
                              ? "var(--accent)"
                              : isDone
                                ? "var(--success, #22c55e)"
                                : "var(--bg-tertiary)",
                            opacity: isDone || isActive ? 1 : 0.4,
                            transition: "all 0.15s ease",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* StageDetailPanel with built-in Simple/Dev toggle */}
            {activeSnapshots && activeSnapshots.length > 0 && (
              <StageDetailPanel
                snapshots={activeSnapshots}
                selectedIndex={snapshotIdx}
                showToggle
                style={{ flex: 1, overflow: "auto" }}
              />
            )}
          </div>
        )}
      </div>

      {/* Collapsible Gantt timeline at bottom */}
      {activeSnapshots && activeSnapshots.length > 0 && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setGanttOpen((o) => !o)}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              borderBottom: ganttOpen ? "1px solid var(--border)" : "none",
              color: "var(--text-muted)",
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "4px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 8 }}>{ganttOpen ? "▼" : "▶"}</span>
            Timeline
          </button>
          {ganttOpen && (
            <GanttTimeline
              snapshots={activeSnapshots}
              selectedIndex={snapshotIdx}
              onSelect={onSnapshotChange}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Narrative Trace Panel (collapsible stage groups) ────────────────────────

interface NarrativeGroup {
  header: string;
  headerIdx: number;
  steps: { text: string; idx: number }[];
}

function parseNarrativeGroups(lines: string[]): NarrativeGroup[] {
  const groups: NarrativeGroup[] = [];
  let current: NarrativeGroup | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    const isStep = trimmed.startsWith("Step ") || /^\s/.test(line);

    if (!isStep || !current) {
      // This is a header line (stage, condition, parallel, etc.)
      current = { header: line, headerIdx: i, steps: [] };
      groups.push(current);
    } else {
      current.steps.push({ text: trimmed, idx: i });
    }
  }

  return groups;
}

function NarrativeTracePanel({
  progressiveNarrative,
  fullNarrative,
}: {
  progressiveNarrative: string[];
  fullNarrative: string[];
}) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());
  const latestGroupRef = useRef<HTMLDivElement>(null);

  const progressiveGroups = useMemo(
    () => parseNarrativeGroups(progressiveNarrative),
    [progressiveNarrative]
  );
  const futureGroups = useMemo(
    () => parseNarrativeGroups(fullNarrative.slice(progressiveNarrative.length)),
    [fullNarrative, progressiveNarrative.length]
  );

  // Auto-scroll only when the latest group is out of view
  useEffect(() => {
    latestGroupRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [progressiveGroups.length]);

  const toggleGroup = useCallback((headerIdx: number) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(headerIdx)) next.delete(headerIdx);
      else next.add(headerIdx);
      return next;
    });
  }, []);

  const lastGroupIdx = progressiveGroups.length - 1;

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        padding: 12,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {progressiveGroups.map((group, gi) => {
        const isLatest = gi === lastGroupIdx;
        const isCollapsed = collapsedGroups.has(group.headerIdx);
        const hasSteps = group.steps.length > 0;

        return (
          <div key={group.headerIdx} ref={isLatest ? latestGroupRef : undefined} style={{ marginBottom: 2 }}>
            {/* Stage header */}
            <div
              onClick={hasSteps ? () => toggleGroup(group.headerIdx) : undefined}
              style={{
                fontSize: 12,
                lineHeight: 1.7,
                color: isLatest ? "var(--text-primary)" : "var(--text-secondary)",
                padding: "4px 8px",
                borderRadius: 4,
                background: isLatest ? "var(--bg-tertiary)" : "transparent",
                borderLeft: isLatest
                  ? "3px solid var(--accent)"
                  : "3px solid var(--success, #22c55e)",
                cursor: hasSteps ? "pointer" : "default",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
                userSelect: "none",
                transition: "all 0.15s ease",
              }}
            >
              {hasSteps && (
                <span
                  style={{
                    fontSize: 9,
                    color: "var(--text-muted)",
                    transition: "transform 0.15s ease",
                    transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                    display: "inline-block",
                    width: 10,
                    flexShrink: 0,
                  }}
                >
                  ▼
                </span>
              )}
              {!hasSteps && <span style={{ width: 10, flexShrink: 0 }} />}
              <span>{group.header}</span>
            </div>

            {/* Step lines (collapsible) */}
            {!isCollapsed &&
              group.steps.map((step) => (
                <div
                  key={step.idx}
                  style={{
                    fontSize: 11,
                    lineHeight: 1.6,
                    color: isLatest ? "var(--text-secondary)" : "var(--text-muted)",
                    padding: "2px 8px 2px 32px",
                    opacity: isLatest ? 0.9 : 0.7,
                    transition: "all 0.15s ease",
                  }}
                >
                  {step.text}
                </div>
              ))}
          </div>
        );
      })}

      {/* Dimmed future groups */}
      {futureGroups.length > 0 && (
        <div style={{ opacity: 0.2 }}>
          {futureGroups.map((group) => (
            <div key={`f-${group.headerIdx}`} style={{ marginBottom: 2 }}>
              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: "var(--text-muted)",
                  padding: "4px 8px",
                  borderLeft: "3px solid var(--border)",
                  fontWeight: 600,
                  paddingLeft: 24,
                }}
              >
                {group.header}
              </div>
              {group.steps.map((step) => (
                <div
                  key={`f-${step.idx}`}
                  style={{
                    fontSize: 11,
                    lineHeight: 1.6,
                    color: "var(--text-muted)",
                    padding: "2px 8px 2px 32px",
                  }}
                >
                  {step.text}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI-Compatible Tab ───────────────────────────────────────────────────────

function AICompatibleSection({
  narrative,
  spec,
  vizSnapshots,
  theme,
}: {
  narrative: string[];
  spec: SpecNode | null;
  vizSnapshots: any[] | null;
  theme: string;
}) {
  const {
    subflowNav,
    activeSnapshots,
    snapshotIdx,
    setSnapshotIdx: onSnapshotChange,
    flowData: overlayFlowData,
  } = useFlowchartData(spec, vizSnapshots);

  const [playing, setPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = activeSnapshots?.length ?? 0;
  const canPrev = snapshotIdx > 0;
  const canNext = snapshotIdx < total - 1;

  // Progressive narrative: reveal lines grouped by stage boundaries.
  // Each "Stage N:" header (that isn't a step line) starts a new group.
  // We reveal groups proportionally to snapshotIdx / total vizSnapshots.
  const progressiveNarrative = useMemo(() => {
    if (!activeSnapshots || activeSnapshots.length === 0 || narrative.length === 0) return narrative;

    const boundaries: number[] = [];
    for (let i = 0; i < narrative.length; i++) {
      const trimmed = narrative[i].trimStart();
      if (
        (trimmed.startsWith("Stage ") && !trimmed.match(/^Stage\s+\d+:\s*Step\s/)) ||
        trimmed.startsWith("[")
      ) {
        boundaries.push(i);
      }
    }

    if (boundaries.length === 0) {
      const ratio = (snapshotIdx + 1) / activeSnapshots.length;
      return narrative.slice(0, Math.max(1, Math.ceil(narrative.length * ratio)));
    }

    const groupsToShow = Math.max(
      1,
      Math.min(
        Math.floor(((snapshotIdx + 1) / activeSnapshots.length) * boundaries.length) || 1,
        boundaries.length
      )
    );

    const endIdx = groupsToShow < boundaries.length
      ? boundaries[groupsToShow]
      : narrative.length;

    return narrative.slice(0, Math.max(1, endIdx));
  }, [activeSnapshots, snapshotIdx, narrative]);

  const fullText = narrative.join("\n");

  // Auto-advance during playback
  useEffect(() => {
    if (!playing || !activeSnapshots) return;
    if (snapshotIdx >= total - 1) {
      setPlaying(false);
      return;
    }
    const stageDur = activeSnapshots[snapshotIdx]?.durationMs ?? 1;
    const totalDur = activeSnapshots.reduce(
      (sum: number, s: any) => sum + (s.durationMs ?? 1),
      0
    );
    const normalized = totalDur > 0
      ? 300 + (stageDur / totalDur) * 1200
      : 600;
    playRef.current = setTimeout(() => {
      onSnapshotChange(snapshotIdx + 1);
    }, normalized);
    return () => {
      if (playRef.current) clearTimeout(playRef.current);
    };
  }, [playing, snapshotIdx, activeSnapshots, total, onSnapshotChange]);

  // Click a flowchart node → drill into subflow, or jump to that stage
  const handleNodeClick = useCallback(
    (_: unknown, node: { id: string }) => {
      if (subflowNav.handleNodeClick(node.id)) return;
      if (!activeSnapshots) return;
      const idx = activeSnapshots.findIndex(
        (s: any) => s.stageLabel === node.id
      );
      if (idx >= 0) {
        setPlaying(false);
        onSnapshotChange(idx);
      }
    },
    [activeSnapshots, onSnapshotChange, subflowNav]
  );

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Time-travel controls */}
      {activeSnapshots && activeSnapshots.length > 0 && (
        <div
          style={{
            padding: "6px 12px",
            background: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <NavButton
            label="◀"
            disabled={!canPrev || playing}
            onClick={() => { setPlaying(false); onSnapshotChange(snapshotIdx - 1); }}
          />
          <button
            onClick={() => {
              if (playing) {
                setPlaying(false);
              } else {
                if (snapshotIdx >= total - 1) onSnapshotChange(0);
                setPlaying(true);
              }
            }}
            style={{
              background: playing ? "var(--accent)" : "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              color: playing ? "white" : "var(--text-primary)",
              borderRadius: 6,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 14,
              flexShrink: 0,
            }}
            title={playing ? "Pause" : "Play"}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <NavButton
            label="▶"
            disabled={!canNext || playing}
            onClick={() => { setPlaying(false); onSnapshotChange(snapshotIdx + 1); }}
          />

          {/* Tick-mark timeline */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 2,
              padding: "0 4px",
            }}
          >
            {activeSnapshots.map((_: any, i: number) => {
              const isActive = i === snapshotIdx;
              const isDone = i < snapshotIdx;
              return (
                <button
                  key={i}
                  onClick={() => { setPlaying(false); onSnapshotChange(i); }}
                  title={activeSnapshots[i].stageLabel}
                  style={{
                    flex: 1,
                    height: isActive ? 14 : 8,
                    borderRadius: 3,
                    border: "none",
                    cursor: "pointer",
                    background: isActive
                      ? "var(--accent)"
                      : isDone
                        ? "var(--success, #22c55e)"
                        : "var(--bg-tertiary)",
                    opacity: isDone || isActive ? 1 : 0.4,
                    transition: "all 0.15s ease",
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Main area: flowchart + progressive narrative */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Flowchart with path overlay */}
        {overlayFlowData && (
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              borderRight: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SubflowBreadcrumb
              breadcrumbs={subflowNav.breadcrumbs}
              onNavigate={subflowNav.navigateTo}
            />
            <div style={{ flex: 1 }}>
              <OverlayFlowChart
                flowData={overlayFlowData}
                theme={theme}
                onNodeClick={handleNodeClick}
              />
            </div>
          </div>
        )}

        {/* Progressive narrative panel */}
        <div
          style={{
            width: overlayFlowData ? "40%" : "100%",
            minWidth: 280,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <SectionLabel>Narrative Trace</SectionLabel>
            <button
              onClick={() => navigator.clipboard.writeText(fullText)}
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                borderRadius: 4,
                padding: "2px 8px",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Copy All
            </button>
          </div>

          <NarrativeTracePanel
            progressiveNarrative={progressiveNarrative}
            fullNarrative={narrative}
          />
        </div>
      </div>

    </div>
  );
}
