import { useState, useCallback, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  ReactFlow,
  Background,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ExplainableShell } from "footprint-explainable-ui";
import { useTheme } from "../ThemeContext";
import { samples } from "../samples/catalog";
import {
  executeCode,
  type ExecutionResult,
} from "../runner/executeCode";
import {
  StageNode,
  SubflowBreadcrumb,
  useSubflowNavigation,
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

type LeftTab = "code" | "spec" | "flowchart";

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
  // Right panel tabs managed by ExplainableShell internally
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

  // Prefer runtime structure (has resolved lazy subflows for drill-down) over build-time spec
  const buildTimeSpec = (result?.runtimeStructure as unknown as SpecNode)
    ?? (result?.buildTime?.spec as unknown as SpecNode)
    ?? null;
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

              <div style={{ flex: 1, overflow: "hidden" }}>
                <ExplainableShell
                  runtimeSnapshot={result.snapshot as any}
                  spec={buildTimeSpec as any}
                  title={resolvedSample?.name ?? "Pipeline"}
                  logs={result.logs}
                  narrativeEntries={result.narrativeEntries as any}
                  tabs={["result", "explainable", "ai-compatible"]}
                  defaultTab="explainable"
                  defaultExpanded={{ details: true }}
                />
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
