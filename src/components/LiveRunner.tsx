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
import { toVisualizationSnapshots, GanttTimeline } from "footprint-explainable-ui";
import { useTheme } from "../ThemeContext";
import { samples } from "../samples/catalog";
import {
  executeCode,
  type ExecutionResult,
} from "../runner/executeCode";
import {
  specToReactFlow,
  StageNode,
  type ExecutionOverlay,
} from "footprint-explainable-ui/flowchart";
import { SpecView } from "./SpecView";

const nodeTypes: NodeTypes = { stage: StageNode as any };

type LeftTab = "code" | "spec" | "flowchart";
type RightTab = "result" | "trace" | "narrative";

export function LiveRunner() {
  const { theme, toggle } = useTheme();
  const { sampleId } = useParams<{ sampleId: string }>();
  const navigate = useNavigate();

  // Resolve sample from URL param, fallback to first sample
  const resolvedSample = samples.find((s) => s.id === sampleId) ?? samples[0];

  const [code, setCode] = useState(resolvedSample.code);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [running, setRunning] = useState(false);
  const [snapshotIdx, setSnapshotIdx] = useState(0);
  const [leftTab, setLeftTab] = useState<LeftTab>("code");
  const [rightTab, setRightTab] = useState<RightTab>("result");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [inputJson, setInputJson] = useState(resolvedSample.defaultInput ?? "");
  const [inputOpen, setInputOpen] = useState(!!resolvedSample.defaultInput);
  const [showInputModal, setShowInputModal] = useState(false);

  const selectedId = resolvedSample.id;
  const selectedSample = resolvedSample;
  const hasDefaultInput = !!selectedSample?.defaultInput;

  // Sync state when URL param changes
  useEffect(() => {
    setCode(resolvedSample.code);
    setInputJson(resolvedSample.defaultInput ?? "");
    setInputOpen(!!resolvedSample.defaultInput);
    setResult(null);
    setSnapshotIdx(0);
    setLeftTab("code");
    setRightTab("result" as RightTab);
  }, [resolvedSample.id]);

  const handleSampleChange = useCallback((id: string) => {
    navigate(`/samples/${id}`);
  }, [navigate]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setResult(null);
    setSnapshotIdx(0);
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
  }, [code, inputJson]);

  // Derive visualization snapshots for time-travel
  const vizSnapshots = useMemo(() => {
    if (!result?.snapshot) return null;
    try {
      return toVisualizationSnapshots(result.snapshot as any);
    } catch {
      return null;
    }
  }, [result]);

  const currentSnap = vizSnapshots?.[snapshotIdx];

  // Build-time flowchart (plain gray — no execution overlay)
  const buildTimeFlowData = useMemo(() => {
    if (!result?.buildTime?.spec) return null;
    try {
      return specToReactFlow(result.buildTime.spec as any);
    } catch {
      return null;
    }
  }, [result]);

  // Build-time flowchart WITH execution path overlay (for Explainable tab)
  // Re-derives when snapshotIdx changes so the active node updates
  //
  // IMPORTANT: We use stageLabel (= runtime node.name = human-readable stage name)
  // NOT stageName (= runtime node.id = runId) because flowchart node IDs come from
  // the spec tree's node.name, which matches stageLabel.
  const overlayFlowData = useMemo(() => {
    if (!result?.buildTime?.spec || !vizSnapshots) return null;
    try {
      const executionOrder = vizSnapshots
        .slice(0, snapshotIdx + 1)
        .map((s: any) => s.stageLabel as string);
      const doneStages = new Set(
        vizSnapshots.slice(0, snapshotIdx).map((s: any) => s.stageLabel)
      );
      const activeStage = vizSnapshots[snapshotIdx]?.stageLabel ?? null;
      const executedStages = new Set([...doneStages]);
      if (activeStage) executedStages.add(activeStage);

      const overlay: ExecutionOverlay = {
        doneStages,
        activeStage,
        executedStages,
        executionOrder,
      };
      return specToReactFlow(result.buildTime.spec as any, overlay);
    } catch {
      return null;
    }
  }, [result, vizSnapshots, snapshotIdx]);

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
        onSampleChange={handleSampleChange}
        onToggleTheme={toggle}
      />

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* === Left Panel (collapsible) === */}
        {leftCollapsed ? (
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
        ) : (
          /* Expanded: full left panel */
          <div
            style={{
              width: "45%",
              borderRight: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <TabBar
              tabs={[
                { id: "code", label: "Code" },
                {
                  id: "spec",
                  label: "Flow Definition",
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
                <div style={{ width: "100%", height: "100%" }}>
                  <ReactFlow
                    nodes={buildTimeFlowData.nodes}
                    edges={buildTimeFlowData.edges}
                    nodeTypes={nodeTypes}
                    fitView
                    proOptions={{ hideAttribution: true }}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    panOnDrag
                    zoomOnScroll
                  >
                    <Background
                      color={theme === "dark" ? "#2e2938" : "#e4d5c3"}
                      gap={20}
                      size={1}
                    />
                  </ReactFlow>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === Right Panel === */}
        <div
          style={{
            flex: 1,
            display: "flex",
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
                    disabled: !overlayFlowData && !vizSnapshots,
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
                    overlayFlowData={overlayFlowData}
                    vizSnapshots={vizSnapshots}
                    snapshotIdx={snapshotIdx}
                    currentSnap={currentSnap}
                    stageDescriptions={
                      result.buildTime?.stageDescriptions ?? {}
                    }
                    theme={theme}
                    onSnapshotChange={setSnapshotIdx}
                  />
                )}

                {rightTab === "narrative" && (
                  <AICompatibleSection
                    narrative={result.narrative}
                    overlayFlowData={overlayFlowData}
                    vizSnapshots={vizSnapshots}
                    snapshotIdx={snapshotIdx}
                    theme={theme}
                    onSnapshotChange={setSnapshotIdx}
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
              setSnapshotIdx(0);
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
  onSampleChange,
  onToggleTheme,
}: {
  selectedId: string;
  description?: string;
  theme: string;
  onSampleChange: (id: string) => void;
  onToggleTheme: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 16,
          color: "var(--accent)",
          letterSpacing: "-0.5px",
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
          fontSize: 13,
          cursor: "pointer",
          outline: "none",
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

// ─── Scope Diff Utility ──────────────────────────────────────────────────────

interface DiffEntry {
  key: string;
  type: "added" | "removed" | "changed" | "unchanged";
  oldValue?: unknown;
  newValue?: unknown;
}

function computeScopeDiff(
  prev: Record<string, unknown> | null,
  curr: Record<string, unknown>
): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const allKeys = new Set([
    ...Object.keys(prev ?? {}),
    ...Object.keys(curr),
  ]);

  for (const key of allKeys) {
    const inPrev = prev != null && key in prev;
    const inCurr = key in curr;
    const oldVal = prev?.[key];
    const newVal = curr[key];

    if (!inPrev && inCurr) {
      entries.push({ key, type: "added", newValue: newVal });
    } else if (inPrev && !inCurr) {
      entries.push({ key, type: "removed", oldValue: oldVal });
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      entries.push({
        key,
        type: "changed",
        oldValue: oldVal,
        newValue: newVal,
      });
    } else {
      entries.push({ key, type: "unchanged", newValue: newVal });
    }
  }

  // Sort: changes first, then unchanged
  const order = { added: 0, changed: 1, removed: 2, unchanged: 3 };
  entries.sort((a, b) => order[a.type] - order[b.type]);
  return entries;
}

function formatValue(v: unknown): string {
  if (typeof v === "string") return `"${v}"`;
  if (typeof v === "object" && v !== null)
    return JSON.stringify(v, null, 2);
  return String(v);
}

// ─── Explainable Tab ─────────────────────────────────────────────────────────
// Side-by-side: flowchart (with overlay) | collapsible detail panel with sub-tabs
// Slider time-travel. Gantt at bottom.

type DetailTab = "stage" | "diff" | "semantic";

function ExplainableSection({
  overlayFlowData,
  vizSnapshots,
  snapshotIdx,
  currentSnap,
  stageDescriptions,
  theme,
  onSnapshotChange,
}: {
  overlayFlowData: { nodes: any[]; edges: any[] } | null;
  vizSnapshots: any[] | null;
  snapshotIdx: number;
  currentSnap: any;
  stageDescriptions: Record<string, string>;
  theme: string;
  onSnapshotChange: (idx: number) => void;
}) {
  const [detailOpen, setDetailOpen] = useState(true);
  const [detailTab, setDetailTab] = useState<DetailTab>("stage");
  const [ganttOpen, setGanttOpen] = useState(true);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = vizSnapshots?.length ?? 0;
  const canPrev = snapshotIdx > 0;
  const canNext = snapshotIdx < total - 1;

  // Auto-advance during playback — uses actual stage durations from Gantt
  useEffect(() => {
    if (!playing || !vizSnapshots) return;
    if (snapshotIdx >= total - 1) {
      setPlaying(false);
      return;
    }
    // Use the current stage's duration (clamped to a reasonable playback range)
    const stageDur = vizSnapshots[snapshotIdx]?.durationMs ?? 1;
    const totalDur = vizSnapshots.reduce(
      (sum: number, s: any) => sum + (s.durationMs ?? 1),
      0
    );
    // Normalize: map real durations to 300ms–1500ms playback range
    const normalized = totalDur > 0
      ? 300 + (stageDur / totalDur) * 1200
      : 600;
    playRef.current = setTimeout(() => {
      onSnapshotChange(snapshotIdx + 1);
    }, normalized);
    return () => {
      if (playRef.current) clearTimeout(playRef.current);
    };
  }, [playing, snapshotIdx, vizSnapshots, total, onSnapshotChange]);

  // Scope diff between previous and current snapshot
  const scopeDiff = useMemo(() => {
    if (!vizSnapshots || !currentSnap) return null;
    const prevSnap =
      snapshotIdx > 0 ? vizSnapshots[snapshotIdx - 1] : null;
    return computeScopeDiff(
      prevSnap?.memory ?? null,
      currentSnap.memory ?? {}
    );
  }, [vizSnapshots, currentSnap, snapshotIdx]);

  // Click a flowchart node → jump to that stage's snapshot
  // Match by stageLabel (= node.name) since flowchart node IDs use spec names
  const handleNodeClick = useCallback(
    (_: unknown, node: { id: string }) => {
      if (!vizSnapshots) return;
      const idx = vizSnapshots.findIndex(
        (s: any) => s.stageLabel === node.id
      );
      if (idx >= 0) {
        onSnapshotChange(idx);
        setDetailOpen(true);
      }
    },
    [vizSnapshots, onSnapshotChange]
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
      {/* Main area: flowchart + collapsible detail panel */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
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
            }}
          >
            <OverlayFlowChart
              flowData={overlayFlowData}
              theme={theme}
              onNodeClick={handleNodeClick}
            />
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
              {vizSnapshots && vizSnapshots.length > 0 && (
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
                    {vizSnapshots.map((_: any, i: number) => {
                      const isActive = i === snapshotIdx;
                      const isDone = i < snapshotIdx;
                      return (
                        <button
                          key={i}
                          onClick={() => { setPlaying(false); onSnapshotChange(i); }}
                          title={vizSnapshots[i].stageLabel}
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

            {/* Detail sub-tabs */}
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid var(--border)",
                flexShrink: 0,
                padding: "0 12px",
              }}
            >
              {(
                [
                  { id: "stage", label: "Stage" },
                  { id: "diff", label: "Diff" },
                  { id: "semantic", label: "Semantic" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDetailTab(t.id)}
                  style={{
                    padding: "6px 12px",
                    border: "none",
                    borderBottom:
                      detailTab === t.id
                        ? "2px solid var(--accent)"
                        : "2px solid transparent",
                    background: "transparent",
                    color:
                      detailTab === t.id
                        ? "var(--accent)"
                        : "var(--text-muted)",
                    fontSize: 11,
                    fontWeight: detailTab === t.id ? 600 : 400,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
              {detailTab === "stage" && (
                <StageDetailView
                  snap={currentSnap}
                  description={
                    stageDescriptions[currentSnap.stageName]
                  }
                />
              )}
              {detailTab === "diff" && scopeDiff && (
                <DiffView diff={scopeDiff} />
              )}
              {detailTab === "semantic" && (
                <SemanticView snap={currentSnap} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Gantt timeline at bottom */}
      {vizSnapshots && vizSnapshots.length > 0 && (
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
              snapshots={vizSnapshots}
              selectedIndex={snapshotIdx}
              onSelect={onSnapshotChange}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Detail Sub-views ────────────────────────────────────────────────────────

function StageDetailView({
  snap,
  description,
}: {
  snap: any;
  description?: string;
}) {
  return (
    <>
      {/* Build-time description */}
      {description && (
        <div
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            marginBottom: 10,
            padding: "8px 10px",
            background: "var(--bg-tertiary)",
            borderRadius: 6,
            borderLeft: "3px solid var(--accent)",
            lineHeight: 1.5,
          }}
        >
          <MiniLabel>Description</MiniLabel>
          {description}
        </div>
      )}

      {/* Runtime narrative */}
      {snap.narrative && (
        <div
          style={{
            fontSize: 12,
            color: "var(--text-primary)",
            marginBottom: 10,
            padding: "8px 10px",
            background: "var(--bg-secondary)",
            borderRadius: 6,
            borderLeft: "3px solid #22c55e",
            lineHeight: 1.5,
          }}
        >
          <MiniLabel>What Happened</MiniLabel>
          {snap.narrative}
        </div>
      )}

      {/* Memory state */}
      <MiniLabel>Memory</MiniLabel>
      <pre
        style={{
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          color: "var(--text-primary)",
          background: "var(--bg-secondary)",
          padding: 8,
          borderRadius: 6,
          overflow: "auto",
          margin: 0,
        }}
      >
        {JSON.stringify(snap.memory, null, 2)}
      </pre>
    </>
  );
}

function DiffView({ diff }: { diff: DiffEntry[] }) {
  const hasChanges = diff.some((d) => d.type !== "unchanged");

  return (
    <>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 8,
        }}
      >
        Scope changes at this stage
      </div>

      {!hasChanges && (
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            fontStyle: "italic",
            padding: 8,
          }}
        >
          No scope changes
        </div>
      )}

      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
        }}
      >
        {diff.map((entry) => {
          if (entry.type === "unchanged") return null;

          return (
            <div
              key={entry.key}
              style={{
                marginBottom: 6,
                padding: "6px 8px",
                borderRadius: 4,
                background:
                  entry.type === "added"
                    ? "rgba(34, 197, 94, 0.1)"
                    : entry.type === "removed"
                      ? "rgba(239, 68, 68, 0.1)"
                      : "rgba(234, 179, 8, 0.1)",
                borderLeft: `3px solid ${
                  entry.type === "added"
                    ? "#22c55e"
                    : entry.type === "removed"
                      ? "#ef4444"
                      : "#eab308"
                }`,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  color:
                    entry.type === "added"
                      ? "#22c55e"
                      : entry.type === "removed"
                        ? "#ef4444"
                        : "#eab308",
                  marginBottom: 2,
                }}
              >
                {entry.type === "added" && "+ "}
                {entry.type === "removed" && "- "}
                {entry.type === "changed" && "~ "}
                {entry.key}
              </div>

              {entry.type === "changed" && (
                <>
                  <div style={{ color: "#ef4444", opacity: 0.8 }}>
                    - {formatValue(entry.oldValue)}
                  </div>
                  <div style={{ color: "#22c55e" }}>
                    + {formatValue(entry.newValue)}
                  </div>
                </>
              )}
              {entry.type === "added" && (
                <div style={{ color: "#22c55e" }}>
                  {formatValue(entry.newValue)}
                </div>
              )}
              {entry.type === "removed" && (
                <div style={{ color: "#ef4444", opacity: 0.8 }}>
                  {formatValue(entry.oldValue)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function SemanticView({ snap }: { snap: any }) {
  return (
    <>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 8,
        }}
      >
        Scope-level recorded data (audit trail)
      </div>

      {/* Narrative for this stage */}
      {snap.narrative && (
        <div
          style={{
            fontSize: 12,
            color: "var(--text-primary)",
            marginBottom: 10,
            padding: "8px 10px",
            background: "var(--bg-secondary)",
            borderRadius: 6,
            lineHeight: 1.6,
          }}
        >
          {snap.narrative}
        </div>
      )}

      {/* Memory keys as semantic entries */}
      <MiniLabel>Scope State After Stage</MiniLabel>
      {Object.entries(snap.memory ?? {}).map(([key, value]) => (
        <div
          key={key}
          style={{
            marginBottom: 4,
            padding: "4px 8px",
            borderRadius: 4,
            background: "var(--bg-secondary)",
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>
            {key}
          </span>
          <span style={{ color: "var(--text-muted)" }}> = </span>
          <span style={{ color: "var(--text-primary)" }}>
            {typeof value === "object"
              ? JSON.stringify(value)
              : String(value)}
          </span>
        </div>
      ))}
    </>
  );
}

function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        color: "var(--text-muted)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 4,
      }}
    >
      {children}
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
  overlayFlowData,
  vizSnapshots,
  snapshotIdx,
  theme,
  onSnapshotChange,
}: {
  narrative: string[];
  overlayFlowData: { nodes: any[]; edges: any[] } | null;
  vizSnapshots: any[] | null;
  snapshotIdx: number;
  theme: string;
  onSnapshotChange: (idx: number) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = vizSnapshots?.length ?? 0;
  const canPrev = snapshotIdx > 0;
  const canNext = snapshotIdx < total - 1;

  // Progressive narrative: reveal lines grouped by stage boundaries.
  // Each "Stage N:" header (that isn't a step line) starts a new group.
  // We reveal groups proportionally to snapshotIdx / total vizSnapshots.
  const progressiveNarrative = useMemo(() => {
    if (!vizSnapshots || vizSnapshots.length === 0 || narrative.length === 0) return narrative;

    // Find stage group boundary indices: lines that start a new stage section.
    // Step lines ("  Step N:") are NOT boundaries — they belong to the preceding stage.
    const boundaries: number[] = [];
    for (let i = 0; i < narrative.length; i++) {
      const trimmed = narrative[i].trimStart();
      // Stage headers: "Stage N: ...", "[Parallel]: ...", "[Condition]: ..."
      // But NOT "  Step N: ..." (indented step lines under a stage)
      if (
        (trimmed.startsWith("Stage ") && !trimmed.match(/^Stage\s+\d+:\s*Step\s/)) ||
        trimmed.startsWith("[")
      ) {
        boundaries.push(i);
      }
    }

    if (boundaries.length === 0) {
      // No structure detected — reveal proportionally
      const ratio = (snapshotIdx + 1) / vizSnapshots.length;
      return narrative.slice(0, Math.max(1, Math.ceil(narrative.length * ratio)));
    }

    // Map snapshotIdx to group count: reveal proportionally (floor to stay in sync with flowchart)
    const groupsToShow = Math.max(
      1,
      Math.min(
        Math.floor(((snapshotIdx + 1) / vizSnapshots.length) * boundaries.length) || 1,
        boundaries.length
      )
    );

    // End index: start of next group, or end of narrative
    const endIdx = groupsToShow < boundaries.length
      ? boundaries[groupsToShow]
      : narrative.length;

    return narrative.slice(0, Math.max(1, endIdx));
  }, [vizSnapshots, snapshotIdx, narrative]);

  const fullText = narrative.join("\n");

  // Auto-advance during playback
  useEffect(() => {
    if (!playing || !vizSnapshots) return;
    if (snapshotIdx >= total - 1) {
      setPlaying(false);
      return;
    }
    const stageDur = vizSnapshots[snapshotIdx]?.durationMs ?? 1;
    const totalDur = vizSnapshots.reduce(
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
  }, [playing, snapshotIdx, vizSnapshots, total, onSnapshotChange]);

  // Click a flowchart node → jump to that stage
  const handleNodeClick = useCallback(
    (_: unknown, node: { id: string }) => {
      if (!vizSnapshots) return;
      const idx = vizSnapshots.findIndex(
        (s: any) => s.stageLabel === node.id
      );
      if (idx >= 0) {
        setPlaying(false);
        onSnapshotChange(idx);
      }
    },
    [vizSnapshots, onSnapshotChange]
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
      {vizSnapshots && vizSnapshots.length > 0 && (
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
            {vizSnapshots.map((_: any, i: number) => {
              const isActive = i === snapshotIdx;
              const isDone = i < snapshotIdx;
              return (
                <button
                  key={i}
                  onClick={() => { setPlaying(false); onSnapshotChange(i); }}
                  title={vizSnapshots[i].stageLabel}
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
            }}
          >
            <OverlayFlowChart
              flowData={overlayFlowData}
              theme={theme}
              onNodeClick={handleNodeClick}
            />
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
