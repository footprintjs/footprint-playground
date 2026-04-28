import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { flowChart, FlowChartExecutor, decide, MetricRecorder } from "footprintjs";
import { ExplainableShell } from "footprint-explainable-ui";
import type { NarrativeEntry } from "footprint-explainable-ui";
import { useIsMobile } from "../hooks/useIsMobile";

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
  const mcpTool = chart.toMCPTool() as { name: string; description: string; inputSchema: Record<string, unknown> };
  return { chart, spec, mcpTool };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function decisionInfo(d: string) {
  if (d.includes("APPROVED")) return { color: "#22c55e", label: "✅ APPROVED", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)" };
  if (d.includes("REJECTED")) return { color: "#ef4444", label: "❌ REJECTED", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" };
  return { color: "#f59e0b", label: "⚠️ MANUAL REVIEW", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" };
}

// ── Chat Bubbles ────────────────────────────────────────────────────────────

function SystemBubble() {
  return (
    <div style={{ padding: "12px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, maxWidth: 420 }}>
      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>🤖 Claude</span>{" "}
      has a credit-decision flowchart as a tool. Send an applicant — step through the story on the right.
    </div>
  );
}

function UserBubble({ applicant }: { applicant: ApplicantData }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{ padding: "12px 16px", background: "var(--accent)", borderRadius: "12px 12px 2px 12px", color: "white", fontSize: 13, maxWidth: 280 }}>
        <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, marginBottom: 6, letterSpacing: "0.06em" }}>ASSESS APPLICATION</div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>👤 {applicant.applicantName}</div>
        <div style={{ opacity: 0.9, fontSize: 12 }}>Score: {applicant.creditScore}</div>
        <div style={{ opacity: 0.9, fontSize: 12 }}>Income: ${applicant.monthlyIncome.toLocaleString()}/mo · Debts: ${applicant.monthlyDebts.toLocaleString()}/mo</div>
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
            style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--text-muted)" }} />
        ))}
      </div>
      {label}
    </div>
  );
}

function FpDoneBubble({ decision, totalMs }: { decision: string; totalMs: number }) {
  const di = decisionInfo(decision);
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: di.bg, border: `1px solid ${di.border}`, borderRadius: 7, fontSize: 12 }}>
      <span style={{ fontWeight: 700, color: di.color }}>🔧 FootPrint</span>
      <span style={{ color: "var(--text-muted)" }}>{totalMs}ms →</span>
      <span style={{ fontWeight: 700, color: di.color }}>{di.label}</span>
    </div>
  );
}

function AssistantBubble({ text }: { text: string }) {
  return (
    <div style={{ padding: "12px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "12px 12px 12px 2px", fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, maxWidth: 420, whiteSpace: "pre-wrap" }}>
      <div style={{ fontWeight: 700, color: "var(--accent)", marginBottom: 8, fontSize: 11, letterSpacing: "0.05em" }}>🤖 CLAUDE</div>
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

// ── Wizard Slide Components ─────────────────────────────────────────────────

function CodeBlock({ value }: { value: unknown }) {
  return (
    <pre style={{
      margin: 0, padding: "12px 14px",
      background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 8,
      fontSize: 11, lineHeight: 1.7, color: "var(--text-secondary)",
      fontFamily: "JetBrains Mono, monospace", whiteSpace: "pre-wrap", wordBreak: "break-word",
      overflowX: "auto",
    }}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function SlideLabel({ children }: { children: string }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
      {children}
    </div>
  );
}

function Insight({ children }: { children: string }) {
  return (
    <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--phase-observe-dim)", border: "1px solid var(--phase-observe-border)", borderRadius: 8, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.65, fontStyle: "italic" }}>
      {children}
    </div>
  );
}

// Slide 1 — tool description (always available)
function SlideToolDescription({ mcpTool }: { mcpTool: { name: string; description: string; inputSchema: Record<string, unknown> } }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <SlideLabel>Tool name</SlideLabel>
        <div style={{ padding: "8px 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "var(--accent)", fontFamily: "JetBrains Mono, monospace" }}>
          {mcpTool.name}
        </div>
      </div>
      <div>
        <SlideLabel>Description — what Claude reads to decide whether to call this tool</SlideLabel>
        <div style={{ padding: "10px 14px", background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.65, fontFamily: "JetBrains Mono, monospace", whiteSpace: "pre-wrap" }}>
          {mcpTool.description}
        </div>
      </div>
      <div>
        <SlideLabel>Input schema — auto-generated from .contract()</SlideLabel>
        <CodeBlock value={mcpTool.inputSchema} />
      </div>
      <Insight>
        Auto-generated from chart.toMCPTool() — no hand-written tool description that can drift from reality. The graph structure IS the description.
      </Insight>
    </div>
  );
}

// Slide 2 — the tool call: what Claude sent + what FootPrint returned
function SlideToolCall({ execState }: { execState: ExecState | null }) {
  if (!execState) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "var(--text-muted)", textAlign: "center" }}>
        <div style={{ fontSize: 32 }}>📨</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>Send an applicant to see the tool call</div>
        <div style={{ fontSize: 12, maxWidth: 260, lineHeight: 1.6 }}>Claude will invoke the flowchart tool — you'll see exactly what it sends and what FootPrint returns.</div>
      </div>
    );
  }

  const di = decisionInfo(execState.decision);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <SlideLabel>What Claude sent to the tool</SlideLabel>
        <CodeBlock value={execState.toolInput} />
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            What FootPrint returned
          </div>
          <div style={{ padding: "2px 8px", background: di.bg, border: `1px solid ${di.border}`, borderRadius: 5, fontSize: 11, fontWeight: 700, color: di.color }}>
            {di.label}
          </div>
        </div>
        <CodeBlock value={execState.toolOutput} />
      </div>
      <Insight>
        The causal trace is in the tool result — that's what Claude reads to produce a precise explanation. No hallucination. No reconstruction.
      </Insight>
    </div>
  );
}

// Slide 3 — how the trace was built (ExplainableShell)
function SlideHowBuilt({ execState }: { execState: ExecState | null }) {
  if (!execState) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "var(--text-muted)", textAlign: "center" }}>
        <div style={{ fontSize: 32 }}>⚡</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>Run the demo to unlock time travel</div>
        <div style={{ fontSize: 12, maxWidth: 260, lineHeight: 1.6 }}>After execution, you'll be able to step through every stage, see each read/write, and explore why the decision was made.</div>
      </div>
    );
  }

  return (
    <ExplainableShell
      runtimeSnapshot={execState.snapshot as any}
      spec={(execState.runtimeStructure ?? execState.spec) as any}
      title="Credit Decision"
      logs={[]}
      narrativeEntries={execState.narrativeEntries as NarrativeEntry[]}
      defaultTab="narrative"
      defaultExpanded={{ details: true }}
    />
  );
}

// ── Wizard Navigation ───────────────────────────────────────────────────────

const SLIDES = [
  { icon: "📋", title: "What Claude Sees", subtitle: "Tool description — auto-generated from structure" },
  { icon: "📨", title: "The Tool Call",     subtitle: "What Claude sent · what FootPrint returned" },
  { icon: "⚡", title: "How It Was Built",  subtitle: "Time travel through every decision" },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir * 48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -48, opacity: 0 }),
};

interface WizardPanelProps {
  mcpTool: { name: string; description: string; inputSchema: Record<string, unknown> };
  execState: ExecState | null;
  hasNewData: boolean;
}

function WizardPanel({ mcpTool, execState, hasNewData }: WizardPanelProps) {
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1);

  // When execution completes and user is on slide 0, nudge to slide 1
  useEffect(() => {
    if (hasNewData && slide === 0) {
      setDir(1);
      setSlide(1);
    }
  }, [hasNewData]); // eslint-disable-line react-hooks/exhaustive-deps

  function goTo(n: number) {
    if (n < 0 || n >= SLIDES.length) return;
    setDir(n > slide ? 1 : -1);
    setSlide(n);
  }

  const isLast = slide === SLIDES.length - 1;
  const isFirst = slide === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Slide header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)", flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Step {slide + 1} of {SLIDES.length}
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", marginTop: 3, display: "flex", alignItems: "center", gap: 8 }}>
          <span>{SLIDES[slide].icon}</span>
          {SLIDES[slide].title}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
          {SLIDES[slide].subtitle}
        </div>
      </div>

      {/* Slide content */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={slide}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              overflow: slide === 2 ? "hidden" : "auto",
              padding: slide === 2 ? 0 : "20px",
            }}
          >
            {slide === 0 && <SlideToolDescription mcpTool={mcpTool} />}
            {slide === 1 && <SlideToolCall execState={execState} />}
            {slide === 2 && <SlideHowBuilt execState={execState} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation bar */}
      <div style={{
        padding: "10px 20px", borderTop: "1px solid var(--border)", background: "var(--bg-secondary)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
      }}>
        {/* Prev */}
        <button
          onClick={() => goTo(slide - 1)}
          disabled={isFirst}
          style={{
            padding: "7px 14px", background: isFirst ? "transparent" : "var(--bg-tertiary)",
            border: "1px solid var(--border)", borderRadius: 8,
            color: isFirst ? "var(--text-muted)" : "var(--text-primary)",
            fontSize: 12, fontWeight: 600, cursor: isFirst ? "default" : "pointer",
            opacity: isFirst ? 0.3 : 1,
          }}
        >
          ← Prev
        </button>

        {/* Step dots */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {SLIDES.map((s, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              title={s.title}
              style={{
                width: i === slide ? 22 : 8, height: 8,
                borderRadius: 4,
                background: i === slide ? "var(--accent)" : i < slide ? "var(--success)" : "var(--border)",
                border: "none", cursor: "pointer",
                transition: "all 0.25s",
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Next */}
        <button
          onClick={() => goTo(slide + 1)}
          disabled={isLast}
          style={{
            padding: "7px 14px",
            background: isLast ? "transparent"
              : (slide === 0 && !execState) ? "linear-gradient(135deg, var(--accent), var(--success))"
              : "var(--bg-tertiary)",
            border: isLast ? "1px solid var(--border)" : `1px solid ${(slide === 0 && !execState) ? "transparent" : "var(--border)"}`,
            borderRadius: 8,
            color: isLast ? "var(--text-muted)"
              : (slide === 0 && !execState) ? "white"
              : "var(--text-primary)",
            fontSize: 12, fontWeight: 700,
            cursor: isLast ? "default" : "pointer",
            opacity: isLast ? 0.3 : 1,
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ── Form fields ─────────────────────────────────────────────────────────────

const FORM_FIELDS: Array<{ key: keyof ApplicantData; label: string; type: "text" | "number" }> = [
  { key: "applicantName", label: "Name", type: "text" },
  { key: "creditScore", label: "Credit Score", type: "number" },
  { key: "monthlyIncome", label: "Monthly Income ($)", type: "number" },
  { key: "monthlyDebts", label: "Monthly Debts ($)", type: "number" },
];

// ── Main Component ──────────────────────────────────────────────────────────

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
  // Bumped each time new execution data arrives — tells wizard to auto-advance
  const [execTick, setExecTick] = useState(0);

  const { chart, spec, mcpTool } = useMemo(() => buildChart(), []);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (running || !apiKey.trim()) return;
    setRunning(true);
    setExecState(null);

    const thinkingId = uid();
    const snap = { ...applicant };

    setMessages(prev => [
      ...prev,
      { id: uid(), kind: "user", applicant: snap },
      { id: thinkingId, kind: "thinking", label: "Asking Claude..." },
    ]);

    try {
      const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

      const anthropicTool = {
        name: mcpTool.name,
        description: mcpTool.description,
        input_schema: mcpTool.inputSchema,
      } as Anthropic.Tool;

      // Turn 1: Claude calls the tool
      const first = await client.messages.create({
        model, max_tokens: 512, tools: [anthropicTool],
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
      const trace = executor.getNarrativeEntries().map((e) => e.text);
      const decision = String((snapshot.sharedState as Record<string, unknown>).decision ?? "");
      const agg = metricsRecorder.getMetrics();
      const toolOutput = { decision, trace };

      setExecState({
        snapshot, spec, narrativeEntries, runtimeStructure,
        toolInput: toolUse.input as Record<string, unknown>,
        toolOutput, decision, totalMs: Math.round(agg.totalDuration),
      });
      setExecTick(t => t + 1); // signal wizard to advance

      setMessages(prev => prev.map(m =>
        m.id === thinkingId
          ? { id: thinkingId, kind: "fp_done" as const, decision, totalMs: Math.round(agg.totalDuration) }
          : m
      ));

      // Turn 2: Claude explains
      const thinkingId2 = uid();
      const assistantId = uid();
      setMessages(prev => [...prev, { id: thinkingId2, kind: "thinking", label: "Claude is explaining..." }]);

      const final = await client.messages.create({
        model, max_tokens: 600, tools: [anthropicTool],
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
      setMessages(prev => prev.filter(m => m.kind !== "thinking").concat({ id: uid(), kind: "error", text: msg }));
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
        borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)",
        display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, flexShrink: 0,
      }}>
        <Link to="/try-with-ai" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none", flexShrink: 0 }}>← Back</Link>
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
            <div ref={chatBottomRef} />
          </div>

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

        {/* RIGHT: Wizard */}
        {!isMobile && (
          <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
            <WizardPanel
              mcpTool={mcpTool}
              execState={execState}
              hasNewData={execTick > 0}
            />
          </div>
        )}
      </div>
    </div>
  );
}
