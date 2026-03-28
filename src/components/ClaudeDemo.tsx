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

interface ToolResult {
  toolName: string;
  stages: StageResult[];
  trace: string[];
  decision: string;
  totalMs: number;
}

type ChatMsg =
  | { id: string; kind: "system" }
  | { id: string; kind: "user"; applicant: ApplicantData }
  | { id: string; kind: "thinking"; label: string }
  | { id: string; kind: "tool_call"; status: "running" | "done"; result?: ToolResult }
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
        return decide(
          scope,
          [
            {
              when: (s) => args.creditScore >= 700 && s.dti < 0.43,
              then: "approved",
              label: "Strong credit profile",
            },
            {
              when: () => args.creditScore < 580,
              then: "rejected",
              label: "Credit score below minimum",
            },
          ],
          "manual-review",
        );
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

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function decisionInfo(d: string): { color: string; label: string; bg: string } {
  if (d.includes("APPROVED")) return { color: "#22c55e", label: "✅ APPROVED", bg: "rgba(34,197,94,0.08)" };
  if (d.includes("REJECTED")) return { color: "#ef4444", label: "❌ REJECTED", bg: "rgba(239,68,68,0.08)" };
  return { color: "#f59e0b", label: "⚠️ MANUAL REVIEW", bg: "rgba(245,158,11,0.08)" };
}

// ── Message components ─────────────────────────────────────────────────────

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
      maxWidth: 500,
    }}>
      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>🤖 Claude</span> has a credit-decision
      flowchart available as an MCP tool. Send an applicant and watch the tool call happen live.
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
        maxWidth: 340,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 6, opacity: 0.85, fontSize: 11 }}>
          ASSESS THIS APPLICATION
        </div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>👤 {applicant.applicantName}</div>
        <div style={{ opacity: 0.9 }}>Score: {applicant.creditScore}</div>
        <div style={{ opacity: 0.9 }}>Income: ${applicant.monthlyIncome.toLocaleString()}/mo</div>
        <div style={{ opacity: 0.9 }}>Debts: ${applicant.monthlyDebts.toLocaleString()}/mo · DTI: {dti}%</div>
      </div>
    </div>
  );
}

function ThinkingBubble({ label }: { label: string }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 14px",
      background: "var(--bg-secondary)",
      border: "1px solid var(--border)",
      borderRadius: "12px 12px 12px 2px",
      fontSize: 13,
      color: "var(--text-muted)",
    }}>
      <div style={{ display: "flex", gap: 3 }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
            style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--text-muted)" }}
          />
        ))}
      </div>
      {label}
    </div>
  );
}

function ToolCallBubble({ status, result }: { status: "running" | "done"; result?: ToolResult }) {
  const [expanded, setExpanded] = useState(true);

  if (status === "running") {
    return (
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        background: "var(--phase-observe-dim)",
        border: "1px solid var(--phase-observe-border)",
        borderRadius: 10,
        fontSize: 13,
        color: "var(--text-secondary)",
      }}>
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ display: "inline-block", fontSize: 16 }}
        >
          ⟳
        </motion.span>
        <span><strong>FootPrint tool running</strong> — evaluating credit profile</span>
      </div>
    );
  }

  if (!result) return null;
  const di = decisionInfo(result.decision);

  return (
    <div style={{
      background: "var(--bg-secondary)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      overflow: "hidden",
      maxWidth: 520,
      fontSize: 13,
    }}>
      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: "100%",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          background: "var(--bg-tertiary)",
          border: "none",
          borderBottom: expanded ? "1px solid var(--border)" : "none",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 15 }}>🔧</span>
        <span style={{ fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>
          FootPrint Tool: <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>{result.toolName}</span>
        </span>
        <span style={{ color: di.color, fontWeight: 700, fontSize: 12, background: di.bg, padding: "2px 8px", borderRadius: 6 }}>
          {di.label}
        </span>
        <span style={{ color: "var(--text-muted)", marginLeft: 4, fontSize: 11 }}>{expanded ? "▲" : "▼"}</span>
      </button>

      <AnimatePresence>
        {expanded && result && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            {/* Execution stages */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Execution
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {result.stages.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "var(--success)", fontSize: 12, width: 14 }}>✓</span>
                    <span style={{ color: "var(--text-primary)", flex: 1 }}>{s.name}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
                      {s.durationMs}ms
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, textAlign: "right" }}>
                Total: {result.totalMs}ms
              </div>
            </div>

            {/* Causal trace */}
            <div style={{ padding: "10px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Causal Trace
              </div>
              {result.trace.length === 0 ? (
                <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No trace captured</span>
              ) : (
                result.trace.map((line, i) => (
                  <div key={i} style={{ color: "var(--text-secondary)", lineHeight: 1.55, paddingLeft: 8, borderLeft: "2px solid var(--border)", marginBottom: 4 }}>
                    {line}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
      maxWidth: 520,
      whiteSpace: "pre-wrap",
    }}>
      <div style={{ fontWeight: 700, color: "var(--accent)", marginBottom: 8, fontSize: 12 }}>🤖 CLAUDE</div>
      {text}
    </div>
  );
}

function ErrorBubble({ text }: { text: string }) {
  return (
    <div style={{
      padding: "10px 14px",
      background: "rgba(239,68,68,0.08)",
      border: "1px solid rgba(239,68,68,0.25)",
      borderRadius: 10,
      fontSize: 13,
      color: "#ef4444",
      maxWidth: 500,
    }}>
      ⚠️ {text}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

const FORM_FIELDS: Array<{ key: keyof ApplicantData; label: string; type: "text" | "number" }> = [
  { key: "applicantName", label: "Name", type: "text" },
  { key: "creditScore", label: "Credit Score", type: "number" },
  { key: "monthlyIncome", label: "Monthly Income ($)", type: "number" },
  { key: "monthlyDebts", label: "Monthly Debts ($)", type: "number" },
];

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

  const chart = useMemo(() => buildChart(), []);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (running || !apiKey.trim()) return;
    setRunning(true);

    const thinkingId = uid();
    const toolCallId = uid();

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

      // Turn 1: Claude decides to call the tool
      const first = await client.messages.create({
        model,
        max_tokens: 512,
        tools: [anthropicTool],
        messages: [{ role: "user", content: `Please assess this loan application:\n${JSON.stringify(snap, null, 2)}` }],
      });

      const toolUse = first.content.find(b => b.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        throw new Error("Claude did not call the tool — try rephrasing or use a different model.");
      }

      // Replace thinking with tool_call running
      setMessages(prev => prev.map(m =>
        m.id === thinkingId ? { id: toolCallId, kind: "tool_call" as const, status: "running" as const } : m
      ));

      // Run FootPrint executor
      const metricsRecorder = new MetricRecorder();
      const executor = new FlowChartExecutor(chart);
      executor.enableNarrative();
      executor.attachRecorder(metricsRecorder);
      await executor.run({ input: toolUse.input as Record<string, unknown> });

      const trace = executor.getNarrative();
      const snapshot = executor.getSnapshot();
      const decision = String((snapshot.sharedState as Record<string, unknown>).decision ?? "");
      const agg = metricsRecorder.getMetrics();

      const stages: StageResult[] = [];
      agg.stageMetrics.forEach(m => stages.push({ name: m.stageName, durationMs: Math.round(m.totalDuration) }));

      const toolResult: ToolResult = {
        toolName: mcpTool.name,
        stages,
        trace,
        decision,
        totalMs: Math.round(agg.totalDuration),
      };

      // Update tool_call to done
      setMessages(prev => prev.map(m =>
        m.id === toolCallId ? { id: toolCallId, kind: "tool_call" as const, status: "done" as const, result: toolResult } : m
      ));

      // Show thinking while Claude explains
      const thinkingId2 = uid();
      const assistantId = uid();
      setMessages(prev => [...prev, { id: thinkingId2, kind: "thinking", label: "Claude is explaining..." }]);

      // Turn 2: feed result back to Claude
      const final = await client.messages.create({
        model,
        max_tokens: 600,
        tools: [anthropicTool],
        messages: [
          { role: "user", content: `Please assess this loan application:\n${JSON.stringify(snap, null, 2)}` },
          { role: "assistant", content: first.content },
          {
            role: "user",
            content: [{ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify({ decision, trace }) }],
          },
        ],
      });

      const textBlock = final.content.find(b => b.type === "text");
      const responseText = textBlock?.type === "text" ? textBlock.text : "(No response text returned)";

      setMessages(prev => prev.map(m =>
        m.id === thinkingId2 ? { id: assistantId, kind: "assistant" as const, text: responseText } : m
      ));

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
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
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 8 : 12,
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
          <span style={{
            fontSize: 11, color: "var(--text-muted)", background: "var(--bg-tertiary)",
            border: "1px solid var(--border)", borderRadius: 5, padding: "1px 6px",
            fontFamily: "JetBrains Mono, monospace", whiteSpace: "nowrap",
          }}>
            {modelShort}
          </span>
        </div>

        {!apiKey && (
          <Link to="/try-with-ai" style={{
            fontSize: 11, color: "#ef4444", textDecoration: "none",
            padding: "3px 8px", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, flexShrink: 0,
          }}>
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
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {isMobile ? "</>" : "</> Code"}
        </button>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* Code panel */}
        <AnimatePresence>
          {showCode && (
            <motion.div
              key="code-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isMobile ? "100%" : "42%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{
                borderRight: isMobile ? "none" : "1px solid var(--border)",
                background: "var(--bg-secondary)",
                overflow: "auto",
                flexShrink: 0,
                ...(isMobile ? { position: "absolute", inset: 0, zIndex: 10 } : {}),
              }}
            >
              <div style={{
                padding: "10px 14px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "JetBrains Mono, monospace" }}>
                  llm-agent-tool.ts
                </span>
                {isMobile && (
                  <button onClick={() => setShowCode(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16 }}>✕</button>
                )}
              </div>
              <pre style={{
                margin: 0, padding: "14px 16px",
                fontSize: 11, lineHeight: 1.65,
                color: "var(--text-secondary)",
                fontFamily: "JetBrains Mono, monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}>
                {llmCode}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Message thread */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: isMobile ? "16px 12px" : "24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}>
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {msg.kind === "system" && <SystemBubble />}
                  {msg.kind === "user" && <UserBubble applicant={msg.applicant} />}
                  {msg.kind === "thinking" && <ThinkingBubble label={msg.label} />}
                  {msg.kind === "tool_call" && <ToolCallBubble status={msg.status} result={msg.result} />}
                  {msg.kind === "assistant" && <AssistantBubble text={msg.text} />}
                  {msg.kind === "error" && <ErrorBubble text={msg.text} />}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{
            borderTop: "1px solid var(--border)",
            padding: isMobile ? "12px" : "14px 24px",
            background: "var(--bg-secondary)",
            flexShrink: 0,
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              marginBottom: 10,
            }}>
              {FORM_FIELDS.map(field => (
                <div key={field.key}>
                  <label style={{
                    fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    display: "block", marginBottom: 3,
                  }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={applicant[field.key]}
                    onChange={e => setApplicant(prev => ({
                      ...prev,
                      [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value,
                    }))}
                    disabled={running}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      color: "var(--text-primary)",
                      fontSize: 13,
                      fontFamily: "inherit",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={send}
              disabled={running || !apiKey.trim()}
              style={{
                width: "100%",
                padding: "10px 0",
                background: apiKey.trim() && !running
                  ? "linear-gradient(135deg, var(--accent), var(--success))"
                  : "var(--bg-tertiary)",
                border: "none",
                borderRadius: 8,
                color: apiKey.trim() && !running ? "white" : "var(--text-muted)",
                fontSize: 14,
                fontWeight: 700,
                cursor: apiKey.trim() && !running ? "pointer" : "default",
                transition: "opacity 0.15s",
              }}
            >
              {running ? "Running..." : !apiKey.trim() ? "← Add API key to continue" : "Send to Claude →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
