import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { flowChart, FlowChartExecutor, decide, MetricRecorder } from "footprintjs";
import { ExplainableShell } from "footprint-explainable-ui";
import { useIsMobile } from "../hooks/useIsMobile";
import llmCode from "../tutorials/llm-agent-tool.ts?raw";

// ── Types ──────────────────────────────────────────────────────────────────

interface ApplicantData {
  applicantName: string;
  creditScore: number;
  monthlyIncome: number;
  monthlyDebts: number;
}

interface ExecState {
  snapshot: unknown;
  spec: unknown;
  narrativeEntries: unknown;
  runtimeStructure: unknown;
  toolInput: Record<string, unknown>;
  toolOutput: { decision: string; trace: string[] };
  decision: string;
  totalMs: number;
}

type ChatMsg =
  | { id: string; kind: "system" }
  | { id: string; kind: "user"; applicant: ApplicantData }
  | { id: string; kind: "thinking"; label: string }
  | { id: string; kind: "fp_done"; decision: string; totalMs: number }
  | { id: string; kind: "assistant"; text: string }
  | { id: string; kind: "error"; text: string };

type RightTab = "explainable" | "io" | "code";

// ── Flowchart ──────────────────────────────────────────────────────────────

interface CreditState {
  dti: number;
  riskFactors: string[];
  decision: string;
}

function buildChart() {
  const builder = flowChart<CreditState>(
    "AssessCredit",
    async (scope) => {
      const input = scope.$getArgs<ApplicantData>();
      scope.dti = Math.round((input.monthlyDebts / input.monthlyIncome) * 100) / 100;
      scope.riskFactors = [];
    },
    "assess-credit",
    undefined,
    "Compute DTI and assess credit profile",
  )
    .addDeciderFunction(
      "CreditDecision",
      (scope) => {
        const args = scope.$getArgs<ApplicantData>();
        return decide(scope, [
          { when: (s) => args.creditScore >= 700 && s.dti < 0.43, then: "approved", label: "Strong credit profile" },
          { when: () => args.creditScore < 580, then: "rejected", label: "Credit score below minimum" },
        ], "manual-review");
      },
      "credit-decision",
      "Route based on credit score and DTI",
    )
    .addFunctionBranch("approved", "Approve", async (scope) => { scope.decision = "APPROVED"; }, "Issue approval")
    .addFunctionBranch("rejected", "Reject", async (scope) => { scope.decision = "REJECTED"; }, "Issue rejection")
    .addFunctionBranch("manual-review", "ManualReview", async (scope) => { scope.decision = "MANUAL REVIEW"; }, "Flag for underwriter")
    .setDefault("manual-review")
    .end()
    .contract({
      input: z.object({
        applicantName: z.string(),
        creditScore: z.number(),
        monthlyIncome: z.number(),
        monthlyDebts: z.number(),
      }),
    });

  const chart = builder.build();
  const spec = (chart as unknown as Record<string, unknown>).buildTimeStructure;
  return { chart, spec };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function decisionInfo(d: string) {
  if (d.includes("APPROVED")) return { color: "#22c55e", label: "✅ APPROVED", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)" };
  if (d.includes("REJECTED")) return { color: "#ef4444", label: "❌ REJECTED", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" };
  return { color: "#f59e0b", label: "⚠️ MANUAL REVIEW", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" };
}

// ── Chat message components ────────────────────────────────────────────────

function SystemBubble() {
  return (
    <div style={{
      padding: "12px 16px", background: "var(--bg-secondary)",
      border: "1px solid var(--border)", borderRadius: 12,
      fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, maxWidth: 420,
    }}>
      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>🤖 Claude</span>{" "}
      has a credit-decision flowchart as a tool. Send an applicant — watch FootPrint execute on the right.
    </div>
  );
}

function UserBubble({ applicant }: { applicant: ApplicantData }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{
        padding: "12px 16px", background: "var(--accent)",
        borderRadius: "12px 12px 2px 12px", color: "white", fontSize: 13, maxWidth: 280,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, marginBottom: 6, letterSpacing: "0.06em" }}>
          ASSESS APPLICATION
        </div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>👤 {applicant.applicantName}</div>
        <div style={{ opacity: 0.9, fontSize: 12 }}>Score: {applicant.creditScore}</div>
        <div style={{ opacity: 0.9, fontSize: 12 }}>
          Income: ${applicant.monthlyIncome.toLocaleString()}/mo · Debts: ${applicant.monthlyDebts.toLocaleString()}/mo
        </div>
      </div>
    </div>
  );
}

function ThinkingBubble({ label }: { label: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "12px 12px 12px 2px", fontSize: 13, color: "var(--text-muted)" }}>
      <div style={{ display: "flex", gap: 3 }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
            style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--text-muted)" }}
          />
        ))}
      </div>
      {label}
    </div>
  );
}

function FpDoneBubble({ decision, totalMs }: { decision: string; totalMs: number }) {
  const di = decisionInfo(decision);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 10px", background: di.bg, border: `1px solid ${di.border}`, borderRadius: 7, fontSize: 12,
    }}>
      <span style={{ fontWeight: 700, color: di.color }}>🔧 FootPrint</span>
      <span style={{ color: "var(--text-muted)" }}>{totalMs}ms →</span>
      <span style={{ fontWeight: 700, color: di.color }}>{di.label}</span>
    </div>
  );
}

function AssistantBubble({ text }: { text: string }) {
  return (
    <div style={{
      padding: "12px 16px", background: "var(--bg-secondary)",
      border: "1px solid var(--border)", borderRadius: "12px 12px 12px 2px",
      fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, maxWidth: 420, whiteSpace: "pre-wrap",
    }}>
      <div style={{ fontWeight: 700, color: "var(--accent)", marginBottom: 8, fontSize: 11, letterSpacing: "0.05em" }}>
        🤖 CLAUDE
      </div>
      {text}
    </div>
  );
}

function ErrorBubble({ text }: { text: string }) {
  return (
    <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, fontSize: 13, color: "#ef4444", maxWidth: 420 }}>
      ⚠️ {text}
    </div>
  );
}

// ── Right panel ────────────────────────────────────────────────────────────

function IdlePanel() {
  return (
    <div style={{ padding: "32px 24px", color: "var(--text-muted)", fontSize: 13, lineHeight: 1.7 }}>
      <div style={{ fontSize: 20, marginBottom: 12 }}>⚡</div>
      <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
        FootPrint execution will appear here
      </div>
      <div>Send an applicant on the left. When Claude calls the flowchart tool, you'll see:</div>
      <ul style={{ marginTop: 8, paddingLeft: 16 }}>
        <li>The flowchart executing stage by stage</li>
        <li>Time travel through each step</li>
        <li>The causal trace — why the decision was made</li>
        <li>Exactly what Claude received as the tool result</li>
      </ul>
    </div>
  );
}

function ToolIOPanel({ toolInput, toolOutput }: { toolInput: Record<string, unknown>; toolOutput: { decision: string; trace: string[] } }) {
  return (
    <div style={{ padding: "16px", overflow: "auto", height: "100%", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
          📥 Tool Input — what Claude sent
        </div>
        <pre style={{ margin: 0, padding: "10px 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11, lineHeight: 1.65, color: "var(--text-secondary)", fontFamily: "JetBrains Mono, monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {JSON.stringify(toolInput, null, 2)}
        </pre>
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
          📤 Tool Output — what FootPrint returned to Claude
        </div>
        <pre style={{ margin: 0, padding: "10px 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11, lineHeight: 1.65, color: "var(--text-secondary)", fontFamily: "JetBrains Mono, monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {JSON.stringify(toolOutput, null, 2)}
        </pre>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
          ↑ This is why Claude can explain the decision precisely — FootPrint captured the full causal trace.
        </div>
      </div>
    </div>
  );
}

// ── Form ───────────────────────────────────────────────────────────────────

const FORM_FIELDS: Array<{ key: keyof ApplicantData; label: string; type: "text" | "number" }> = [
  { key: "applicantName", label: "Name", type: "text" },
  { key: "creditScore", label: "Credit Score", type: "number" },
  { key: "monthlyIncome", label: "Monthly Income ($)", type: "number" },
  { key: "monthlyDebts", label: "Monthly Debts ($)", type: "number" },
];

// ── Main component ─────────────────────────────────────────────────────────

export function ClaudeDemo() {
  const location = useLocation();
  const isMobile = useIsMobile();

  const navState = (location.state as { apiKey?: string; model?: string; applicant?: Partial<ApplicantData> } | null) ?? {};

  const [apiKey] = useState(navState.apiKey ?? "");
  const [model] = useState(navState.model ?? "claude-haiku-4-5-20251001");
  const [applicant, setApplicant] = useState<ApplicantData>({
    applicantName: navState.applicant?.applicantName ?? "Sarah Chen",
    creditScore: navState.applicant?.creditScore ?? 720,
    monthlyIncome: navState.applicant?.monthlyIncome ?? 5000,
    monthlyDebts: navState.applicant?.monthlyDebts ?? 1800,
  });

  const [messages, setMessages] = useState<ChatMsg[]>([{ id: "intro", kind: "system" }]);
  const [running, setRunning] = useState(false);
  const [execState, setExecState] = useState<ExecState | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("explainable");

  const { chart, spec } = useMemo(() => buildChart(), []);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Switch to explainable tab when execution completes
  useEffect(() => {
    if (execState) setRightTab("explainable");
  }, [execState]);

  async function send() {
    if (running || !apiKey.trim()) return;
    setRunning(true);

    const thinkingId = uid();
    const snap = { ...applicant };

    setMessages(prev => [
      ...prev,
      { id: uid(), kind: "user", applicant: snap },
      { id: thinkingId, kind: "thinking", label: "Asking Claude..." },
    ]);

    try {
      const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

      const mcpTool = chart.toMCPTool();
      const anthropicTool = {
        name: mcpTool.name,
        description: mcpTool.description,
        input_schema: mcpTool.inputSchema,
      } as Anthropic.Tool;

      // Turn 1: Claude calls the tool
      const first = await client.messages.create({
        model,
        max_tokens: 512,
        tools: [anthropicTool],
        messages: [{ role: "user", content: `Please assess this loan application:\n${JSON.stringify(snap, null, 2)}` }],
      });

      const toolUse = first.content.find(b => b.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        throw new Error("Claude did not call the tool — try a different model.");
      }

      setMessages(prev => prev.map(m =>
        m.id === thinkingId ? { id: thinkingId, kind: "thinking" as const, label: "FootPrint running..." } : m
      ));

      // Run FootPrint
      const metricsRecorder = new MetricRecorder();
      const executor = new FlowChartExecutor(chart);
      executor.enableNarrative();
      executor.attachRecorder(metricsRecorder);
      await executor.run({ input: toolUse.input as Record<string, unknown> });

      const snapshot = executor.getSnapshot();
      const narrativeEntries = executor.getNarrativeEntries();
      const runtimeStructure = executor.getRuntimeStructure?.() ?? null;
      const trace = executor.getNarrative();

      const decision = String((snapshot.sharedState as Record<string, unknown>).decision ?? "");
      const agg = metricsRecorder.getMetrics();

      const toolOutput = { decision, trace };

      setExecState({
        snapshot,
        spec,
        narrativeEntries,
        runtimeStructure,
        toolInput: toolUse.input as Record<string, unknown>,
        toolOutput,
        decision,
        totalMs: Math.round(agg.totalDuration),
      });

      setMessages(prev => prev.map(m =>
        m.id === thinkingId ? { id: thinkingId, kind: "fp_done" as const, decision, totalMs: Math.round(agg.totalDuration) } : m
      ));

      const thinkingId2 = uid();
      const assistantId = uid();
      setMessages(prev => [...prev, { id: thinkingId2, kind: "thinking", label: "Claude is explaining..." }]);

      // Turn 2: feed trace back to Claude
      const final = await client.messages.create({
        model,
        max_tokens: 600,
        tools: [anthropicTool],
        messages: [
          { role: "user", content: `Please assess this loan application:\n${JSON.stringify(snap, null, 2)}` },
          { role: "assistant", content: first.content },
          { role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify(toolOutput) }] },
        ],
      });

      const textBlock = final.content.find(b => b.type === "text");
      const responseText = textBlock?.type === "text" ? textBlock.text : "(No response)";

      setMessages(prev => prev.map(m =>
        m.id === thinkingId2 ? { id: assistantId, kind: "assistant" as const, text: responseText } : m
      ));

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages(prev =>
        prev.filter(m => m.kind !== "thinking")
          .concat({ id: uid(), kind: "error", text: msg })
      );
    } finally {
      setRunning(false);
    }
  }

  const modelShort = model.replace("claude-", "").replace(/-20\d{6}$/, "");

  const RIGHT_TABS: Array<{ id: RightTab; label: string }> = [
    { id: "explainable", label: "⚡ Execution" },
    { id: "io", label: "📤 Tool I/O" },
    { id: "code", label: "</> Code" },
  ];

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>

      {/* Header */}
      <header style={{
        padding: isMobile ? "10px 14px" : "10px 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, flexShrink: 0,
      }}>
        <Link to="/try-with-ai" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none", flexShrink: 0 }}>
          ← Back
        </Link>
        <div style={{ width: 1, height: 16, background: "var(--border)", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Claude + FootPrint</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 5, padding: "1px 6px", fontFamily: "JetBrains Mono, monospace" }}>
            {modelShort}
          </span>
        </div>
        {!apiKey && (
          <Link to="/try-with-ai" style={{ fontSize: 11, color: "#ef4444", textDecoration: "none", padding: "3px 8px", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, flexShrink: 0 }}>
            ⚠️ Add key
          </Link>
        )}
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT: Chat */}
        <div style={{ width: isMobile ? "100%" : "38%", display: "flex", flexDirection: "column", overflow: "hidden", borderRight: isMobile ? "none" : "1px solid var(--border)", flexShrink: 0 }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 12px" : "20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  {msg.kind === "system" && <SystemBubble />}
                  {msg.kind === "user" && <UserBubble applicant={msg.applicant} />}
                  {msg.kind === "thinking" && <ThinkingBubble label={msg.label} />}
                  {msg.kind === "fp_done" && <FpDoneBubble decision={msg.decision} totalMs={msg.totalMs} />}
                  {msg.kind === "assistant" && <AssistantBubble text={msg.text} />}
                  {msg.kind === "error" && <ErrorBubble text={msg.text} />}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: "1px solid var(--border)", padding: isMobile ? "12px" : "14px 20px", background: "var(--bg-secondary)", flexShrink: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
              {FORM_FIELDS.map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 3 }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={applicant[field.key]}
                    onChange={e => setApplicant(prev => ({ ...prev, [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value }))}
                    disabled={running}
                    style={{ width: "100%", padding: "6px 10px", background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-primary)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={send}
              disabled={running || !apiKey.trim()}
              style={{
                width: "100%", padding: "10px 0",
                background: apiKey.trim() && !running ? "linear-gradient(135deg, var(--accent), var(--success))" : "var(--bg-tertiary)",
                border: "none", borderRadius: 8,
                color: apiKey.trim() && !running ? "white" : "var(--text-muted)",
                fontSize: 14, fontWeight: 700, cursor: apiKey.trim() && !running ? "pointer" : "default",
              }}
            >
              {running ? "Running..." : !apiKey.trim() ? "← Add API key" : "Send to Claude →"}
            </button>
          </div>
        </div>

        {/* RIGHT: FootPrint visualization */}
        {!isMobile && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)", flexShrink: 0 }}>
              {RIGHT_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRightTab(tab.id)}
                  style={{
                    padding: "8px 16px",
                    background: rightTab === tab.id ? "var(--bg-primary)" : "transparent",
                    border: "none",
                    borderBottom: `2px solid ${rightTab === tab.id ? "var(--accent)" : "transparent"}`,
                    color: rightTab === tab.id ? "var(--accent)" : "var(--text-muted)",
                    cursor: "pointer", fontSize: 12, fontWeight: 600,
                    transition: "all 0.15s",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              {rightTab === "explainable" && (
                execState ? (
                  <ExplainableShell
                    runtimeSnapshot={execState.snapshot as any}
                    spec={(execState.runtimeStructure ?? execState.spec) as any}
                    title="Credit Decision"
                    logs={[]}
                    narrativeEntries={execState.narrativeEntries as any}
                    tabs={["explainable", "result", "ai-compatible"]}
                    defaultTab="explainable"
                    defaultExpanded={{ details: true }}
                  />
                ) : (
                  <IdlePanel />
                )
              )}

              {rightTab === "io" && (
                execState ? (
                  <ToolIOPanel toolInput={execState.toolInput} toolOutput={execState.toolOutput} />
                ) : (
                  <IdlePanel />
                )
              )}

              {rightTab === "code" && (
                <pre style={{ margin: 0, padding: "16px", fontSize: 11, lineHeight: 1.65, color: "var(--text-secondary)", fontFamily: "JetBrains Mono, monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", height: "100%", boxSizing: "border-box", overflow: "auto" }}>
                  {llmCode}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
