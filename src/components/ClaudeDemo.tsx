import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { flowChart, FlowChartExecutor, decide, MetricRecorder } from "footprintjs";
import { useIsMobile } from "../hooks/useIsMobile";
import llmCode from "../tutorials/llm-agent-tool.ts?raw";

// ── Types ──────────────────────────────────────────────────────────────────

interface ApplicantData {
  applicantName: string;
  creditScore: number;
  monthlyIncome: number;
  monthlyDebts: number;
}

interface StageResult {
  name: string;
  durationMs: number;
}

interface ExecutionData {
  stages: StageResult[];
  trace: string[];
  decision: string;
  dti: number;
  totalMs: number;
}

type FlowState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; data: ExecutionData };

type ChatMsg =
  | { id: string; kind: "system" }
  | { id: string; kind: "user"; applicant: ApplicantData }
  | { id: string; kind: "thinking"; label: string }
  | { id: string; kind: "fp_done"; decision: string; totalMs: number }
  | { id: string; kind: "assistant"; text: string }
  | { id: string; kind: "error"; text: string };

// ── Flowchart ──────────────────────────────────────────────────────────────

interface CreditState {
  dti: number;
  riskFactors: string[];
  decision: string;
}

function buildChart() {
  return flowChart<CreditState>(
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
    })
    .build();
}

// ── Helpers ────────────────────────────────────────────────────────────────

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function decisionInfo(d: string): { color: string; label: string; bg: string; border: string } {
  if (d.includes("APPROVED")) return { color: "#22c55e", label: "✅ APPROVED", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)" };
  if (d.includes("REJECTED")) return { color: "#ef4444", label: "❌ REJECTED", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" };
  return { color: "#f59e0b", label: "⚠️ MANUAL REVIEW", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" };
}

// ── Flow Panel (right side visualization) ─────────────────────────────────

function FlowPanel({ state, applicant }: { state: FlowState; applicant: ApplicantData }) {
  const dti = state.status === "done" ? state.data.dti : Math.round((applicant.monthlyDebts / applicant.monthlyIncome) * 100) / 100;
  const running = state.status === "running";
  const done = state.status === "done";
  const data = done ? state.data : null;

  const decision = data?.decision ?? "";
  const di = data ? decisionInfo(decision) : null;
  const branchStage = done ? (decision.includes("APPROVED") ? "Approve" : decision.includes("REJECTED") ? "Reject" : "ManualReview") : null;

  const stageBoxStyle = (active: boolean) => ({
    padding: "10px 14px",
    borderRadius: 10,
    border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
    background: active ? "var(--phase-build-dim)" : "var(--bg-secondary)",
    opacity: running ? 0.5 : 1,
    transition: "all 0.3s",
    position: "relative" as const,
  });

  const pulse = running ? {
    animate: { opacity: [0.4, 1, 0.4] },
    transition: { duration: 1.5, repeat: Infinity },
  } : {};

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      padding: "20px 16px",
      overflowY: "auto",
      gap: 0,
    }}>
      {/* Header */}
      <div style={{
        fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.08em",
        marginBottom: 20,
      }}>
        FootPrint Execution
      </div>

      {/* Idle hint */}
      {state.status === "idle" && (
        <div style={{ color: "var(--text-muted)", fontSize: 12, lineHeight: 1.6 }}>
          Send an applicant to see the flowchart execute live.
        </div>
      )}

      {/* Stages */}
      {state.status !== "idle" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 0 }}>

          {/* Stage 1: AssessCredit */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: running ? 0.5 : 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0 }}
            {...pulse}
          >
            <div style={stageBoxStyle(done)}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Stage 1</div>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: done ? 6 : 0 }}>
                AssessCredit
              </div>
              {done && (
                <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 2 }}>
                  <span>creditScore: <strong>{applicant.creditScore}</strong></span>
                  <span>dti: <strong style={{ color: "var(--accent)" }}>{dti}</strong></span>
                  {data && <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{data.stages[0]?.durationMs ?? 0}ms</span>}
                </div>
              )}
            </div>
          </motion.div>

          {/* Connector */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: done ? 1 : 0.3 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            style={{ width: 2, height: 20, background: done ? "var(--accent)" : "var(--border)", alignSelf: "center", transformOrigin: "top" }}
          />

          {/* Stage 2: CreditDecision */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: running ? 0.5 : 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            {...pulse}
          >
            <div style={stageBoxStyle(done)}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Decision</div>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: done ? 6 : 0 }}>
                CreditDecision
              </div>
              {done && (
                <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ color: applicant.creditScore >= 700 ? "#22c55e" : "#ef4444" }}>
                    score {applicant.creditScore} {applicant.creditScore >= 700 ? "≥" : "<"} 700 {applicant.creditScore >= 700 ? "✓" : "✗"}
                  </span>
                  <span style={{ color: dti < 0.43 ? "#22c55e" : "#f59e0b" }}>
                    dti {dti} {dti < 0.43 ? "<" : "≥"} 0.43 {dti < 0.43 ? "✓" : "✗"}
                  </span>
                  {data && <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{data.stages[1]?.durationMs ?? 0}ms</span>}
                </div>
              )}
            </div>
          </motion.div>

          {/* Branch connector */}
          {done && di && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <div style={{ width: 2, height: 12, background: di.color }} />
              <div style={{ fontSize: 10, color: di.color, fontWeight: 700, marginBottom: 4 }}>
                {decision.includes("APPROVED") ? "approved" : decision.includes("REJECTED") ? "rejected" : "manual-review"}
              </div>
            </motion.div>
          )}
          {running && (
            <div style={{ width: 2, height: 20, background: "var(--border)", alignSelf: "center" }} />
          )}

          {/* Stage 3: Branch outcome */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: running ? 0.5 : 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            {...pulse}
          >
            <div style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: done && di ? `1.5px solid ${di.border}` : "1.5px solid var(--border)",
              background: done && di ? di.bg : "var(--bg-secondary)",
              opacity: running ? 0.5 : 1,
              transition: "all 0.3s",
            }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Outcome</div>
              <div style={{ fontWeight: 700, color: done && di ? di.color : "var(--text-primary)" }}>
                {done ? branchStage : "—"}
              </div>
              {done && di && (
                <div style={{ fontSize: 13, fontWeight: 800, color: di.color, marginTop: 4 }}>
                  {di.label}
                </div>
              )}
              {done && data && (
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  {data.totalMs}ms total
                </div>
              )}
            </div>
          </motion.div>

          {/* Causal trace */}
          {done && data && data.trace.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ marginTop: 20 }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Causal Trace
              </div>
              {data.trace.map((line, i) => (
                <div key={i} style={{
                  fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6,
                  paddingLeft: 8, borderLeft: "2px solid var(--border)", marginBottom: 4,
                }}>
                  {line}
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Chat message components ────────────────────────────────────────────────

function SystemBubble() {
  return (
    <div style={{
      padding: "12px 16px",
      background: "var(--bg-secondary)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      fontSize: 13,
      color: "var(--text-secondary)",
      lineHeight: 1.55,
      maxWidth: 460,
    }}>
      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>🤖 Claude</span>{" "}
      has a credit-decision flowchart available as a tool. Send an applicant — Claude will call it and explain why.
    </div>
  );
}

function UserBubble({ applicant }: { applicant: ApplicantData }) {
  const dti = Math.round((applicant.monthlyDebts / applicant.monthlyIncome) * 100);
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{
        padding: "12px 16px",
        background: "var(--accent)",
        borderRadius: "12px 12px 2px 12px",
        color: "white",
        fontSize: 13,
        maxWidth: 300,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.75, marginBottom: 6, letterSpacing: "0.06em" }}>ASSESS APPLICATION</div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>👤 {applicant.applicantName}</div>
        <div style={{ opacity: 0.9 }}>Score: {applicant.creditScore} · DTI: {dti}%</div>
        <div style={{ opacity: 0.9 }}>Income: ${applicant.monthlyIncome.toLocaleString()}/mo</div>
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
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "7px 12px",
      background: di.bg, border: `1px solid ${di.border}`, borderRadius: 8,
      fontSize: 12,
    }}>
      <span style={{ fontWeight: 700, color: di.color }}>🔧 FootPrint</span>
      <span style={{ color: "var(--text-muted)" }}>evaluated in {totalMs}ms →</span>
      <span style={{ fontWeight: 700, color: di.color }}>{di.label}</span>
    </div>
  );
}

function AssistantBubble({ text }: { text: string }) {
  return (
    <div style={{
      padding: "12px 16px",
      background: "var(--bg-secondary)",
      border: "1px solid var(--border)",
      borderRadius: "12px 12px 12px 2px",
      fontSize: 13,
      color: "var(--text-primary)",
      lineHeight: 1.6,
      maxWidth: 460,
      whiteSpace: "pre-wrap",
    }}>
      <div style={{ fontWeight: 700, color: "var(--accent)", marginBottom: 8, fontSize: 11, letterSpacing: "0.05em" }}>🤖 CLAUDE</div>
      {text}
    </div>
  );
}

function ErrorBubble({ text }: { text: string }) {
  return (
    <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, fontSize: 13, color: "#ef4444", maxWidth: 460 }}>
      ⚠️ {text}
    </div>
  );
}

// ── Form fields ────────────────────────────────────────────────────────────

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
  const [showCode, setShowCode] = useState(false);
  const [flowState, setFlowState] = useState<FlowState>({ status: "idle" });

  const chart = useMemo(() => buildChart(), []);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

      // Update thinking to "FootPrint running" and trigger flow panel
      setMessages(prev => prev.map(m =>
        m.id === thinkingId ? { id: thinkingId, kind: "thinking" as const, label: "FootPrint evaluating..." } : m
      ));
      setFlowState({ status: "running" });

      // Run FootPrint
      const metricsRecorder = new MetricRecorder();
      const executor = new FlowChartExecutor(chart);
      executor.enableNarrative();
      executor.attachRecorder(metricsRecorder);
      await executor.run({ input: toolUse.input as Record<string, unknown> });

      const trace = executor.getNarrative();
      const snapshot = executor.getSnapshot();
      const decision = String((snapshot.sharedState as Record<string, unknown>).decision ?? "");
      const dtiVal = Number((snapshot.sharedState as Record<string, unknown>).dti ?? 0);
      const agg = metricsRecorder.getMetrics();

      const stages: StageResult[] = [];
      agg.stageMetrics.forEach(m => stages.push({ name: m.stageName, durationMs: Math.round(m.totalDuration) }));

      const execData: ExecutionData = { stages, trace, decision, dti: dtiVal, totalMs: Math.round(agg.totalDuration) };

      // Flow panel → done
      setFlowState({ status: "done", data: execData });

      // Replace thinking with fp_done badge in chat
      setMessages(prev => prev.map(m =>
        m.id === thinkingId ? { id: thinkingId, kind: "fp_done" as const, decision, totalMs: execData.totalMs } : m
      ));

      // Thinking while Claude explains
      const thinkingId2 = uid();
      const assistantId = uid();
      setMessages(prev => [...prev, { id: thinkingId2, kind: "thinking", label: "Claude is explaining..." }]);

      // Turn 2: feed trace back
      const final = await client.messages.create({
        model,
        max_tokens: 600,
        tools: [anthropicTool],
        messages: [
          { role: "user", content: `Please assess this loan application:\n${JSON.stringify(snap, null, 2)}` },
          { role: "assistant", content: first.content },
          { role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify({ decision, trace }) }] },
        ],
      });

      const textBlock = final.content.find(b => b.type === "text");
      const responseText = textBlock?.type === "text" ? textBlock.text : "(No response)";

      setMessages(prev => prev.map(m =>
        m.id === thinkingId2 ? { id: assistantId, kind: "assistant" as const, text: responseText } : m
      ));

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFlowState({ status: "idle" });
      setMessages(prev =>
        prev.filter(m => m.id !== thinkingId && m.kind !== "thinking")
          .concat({ id: uid(), kind: "error", text: msg })
      );
    } finally {
      setRunning(false);
    }
  }

  const modelShort = model.replace("claude-", "").replace(/-20\d{6}$/, "");

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>

      {/* Header */}
      <header style={{
        padding: isMobile ? "10px 14px" : "10px 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        display: "flex", alignItems: "center", gap: isMobile ? 8 : 12,
        flexShrink: 0,
      }}>
        <Link to="/try-with-ai" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none", flexShrink: 0 }}>
          ← Back
        </Link>
        <div style={{ width: 1, height: 16, background: "var(--border)", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
            Claude + FootPrint
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 5, padding: "1px 6px", fontFamily: "JetBrains Mono, monospace", whiteSpace: "nowrap" }}>
            {modelShort}
          </span>
        </div>
        {!apiKey && (
          <Link to="/try-with-ai" style={{ fontSize: 11, color: "#ef4444", textDecoration: "none", padding: "3px 8px", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, flexShrink: 0 }}>
            ⚠️ Add key
          </Link>
        )}
        <button
          onClick={() => setShowCode(v => !v)}
          style={{
            padding: isMobile ? "5px 8px" : "5px 12px",
            background: showCode ? "var(--phase-build-dim)" : "var(--bg-tertiary)",
            border: `1px solid ${showCode ? "var(--accent)" : "var(--border)"}`,
            borderRadius: 7,
            color: showCode ? "var(--accent)" : "var(--text-muted)",
            cursor: "pointer", fontSize: 12, fontWeight: 600, flexShrink: 0,
          }}
        >
          {isMobile ? "</>" : "</> Code"}
        </button>
      </header>

      {/* Body: chat left + panel right */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Chat */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 12px" : "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
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
          <div style={{ borderTop: "1px solid var(--border)", padding: isMobile ? "12px" : "14px 24px", background: "var(--bg-secondary)", flexShrink: 0 }}>
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
              {running ? "Running..." : !apiKey.trim() ? "← Add API key to continue" : "Send to Claude →"}
            </button>
          </div>
        </div>

        {/* Right panel: FlowPanel or Code (desktop only unless toggled) */}
        {(!isMobile || showCode) && (
          <div style={{
            width: isMobile ? "100%" : "38%",
            borderLeft: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0,
            ...(isMobile ? { position: "absolute" as const, inset: "49px 0 0 0", zIndex: 10 } : {}),
          }}>
            {/* Panel tab */}
            <div style={{
              display: "flex",
              borderBottom: "1px solid var(--border)",
              flexShrink: 0,
            }}>
              {[
                { id: "flow", label: "⚡ Execution" },
                { id: "code", label: "</> Code" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setShowCode(tab.id === "code")}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    background: (tab.id === "code") === showCode ? "var(--phase-build-dim)" : "transparent",
                    border: "none",
                    borderBottom: `2px solid ${(tab.id === "code") === showCode ? "var(--accent)" : "transparent"}`,
                    color: (tab.id === "code") === showCode ? "var(--accent)" : "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {tab.label}
                </button>
              ))}
              {isMobile && (
                <button onClick={() => setShowCode(false)} style={{ padding: "8px 12px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}>
                  ✕
                </button>
              )}
            </div>

            {/* Panel content */}
            <div style={{ flex: 1, overflow: "auto" }}>
              {showCode ? (
                <pre style={{ margin: 0, padding: "14px 16px", fontSize: 11, lineHeight: 1.65, color: "var(--text-secondary)", fontFamily: "JetBrains Mono, monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {llmCode}
                </pre>
              ) : (
                <FlowPanel state={flowState} applicant={applicant} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
