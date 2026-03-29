import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { flowChart, FlowChartExecutor, decide, MetricRecorder } from "footprintjs";
import { ExplainableShell } from "footprint-explainable-ui";
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

// Story phase — drives the right-side reveal
type StoryPhase = "idle" | "tool_called" | "trace_ready";

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

// ── Chat Bubbles ────────────────────────────────────────────────────────────

function SystemBubble() {
  return (
    <div style={{
      padding: "12px 16px", background: "var(--bg-secondary)",
      border: "1px solid var(--border)", borderRadius: 12,
      fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, maxWidth: 420,
    }}>
      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>🤖 Claude</span>{" "}
      has a credit-decision flowchart as a tool. Send an applicant — watch the story unfold on the right.
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

// ── Story Panel ─────────────────────────────────────────────────────────────

const STORY_STEPS = [
  { label: "① The Tool" },
  { label: "② Claude Called" },
  { label: "③ The Trace" },
];

function StoryProgressBar({ phase }: { phase: StoryPhase }) {
  const activeIdx = phase === "idle" ? 0 : phase === "tool_called" ? 1 : 2;
  return (
    <div style={{ display: "flex", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
      {STORY_STEPS.map((step, i) => (
        <div key={step.label} style={{
          flex: 1, padding: "8px 0", textAlign: "center",
          fontSize: 11, fontWeight: 700,
          color: i <= activeIdx ? "var(--accent)" : "var(--text-muted)",
          borderBottom: `2px solid ${i <= activeIdx ? "var(--accent)" : "transparent"}`,
          transition: "color 0.4s, border-color 0.4s",
        }}>
          {step.label}
        </div>
      ))}
    </div>
  );
}

// Flowchart diagram — highlights the taken branch after decision
function FlowchartDiagram({ decision }: { decision?: string }) {
  const taken = decision?.includes("APPROVED") ? "approved"
    : decision?.includes("REJECTED") ? "rejected"
    : decision ? "manual-review"
    : undefined;

  const branches = [
    { id: "approved", label: "✅ Approve", activeColor: "#22c55e" },
    { id: "rejected", label: "❌ Reject", activeColor: "#ef4444" },
    { id: "manual-review", label: "⚠️ Review", activeColor: "#f59e0b" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "4px 0" }}>
      {/* Stage: AssessCredit */}
      <div style={{
        padding: "7px 20px", background: "var(--phase-build-dim)",
        border: "1.5px solid var(--accent)", borderRadius: 8,
        fontSize: 12, fontWeight: 700, color: "var(--accent)",
      }}>
        AssessCredit
      </div>
      <div style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1 }}>↓</div>
      {/* Decider: CreditDecision */}
      <div style={{
        padding: "7px 20px", background: "var(--phase-observe-dim)",
        border: "1.5px solid var(--success)", borderRadius: 8,
        fontSize: 12, fontWeight: 700, color: "var(--success)",
      }}>
        ◇ CreditDecision
      </div>
      <div style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1 }}>↓</div>
      {/* Branches */}
      <div style={{ display: "flex", gap: 8 }}>
        {branches.map(b => {
          const isActive = b.id === taken;
          const isOther = taken && !isActive;
          return (
            <div key={b.id} style={{
              padding: "5px 10px",
              border: `1.5px solid ${isActive ? b.activeColor : "var(--border)"}`,
              borderRadius: 6,
              fontSize: 11, fontWeight: 700,
              color: isActive ? b.activeColor : "var(--text-muted)",
              background: isActive ? `${b.activeColor}15` : "transparent",
              opacity: isOther ? 0.35 : 1,
              transition: "all 0.4s",
            }}>
              {b.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Story card shell
function SlideCard({ children, accentColor, delay = 0 }: { children: ReactNode; accentColor: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      style={{
        background: "var(--bg-secondary)",
        border: `1px solid ${accentColor}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {children}
    </motion.div>
  );
}

function SlideHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div style={{
      padding: "11px 16px", borderBottom: "1px solid var(--border)",
      background: "var(--bg-tertiary)",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{title}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{subtitle}</div>
      </div>
    </div>
  );
}

function Quote({ children }: { children: ReactNode }) {
  return (
    <div style={{
      margin: "12px 0 0",
      padding: "9px 12px",
      background: "var(--bg-tertiary)",
      border: "1px solid var(--border)",
      borderLeft: "3px solid var(--accent)",
      borderRadius: "0 8px 8px 0",
      fontSize: 11, color: "var(--text-muted)", lineHeight: 1.65, fontStyle: "italic",
    }}>
      {children}
    </div>
  );
}

// Slide 1 — always visible: The Tool
function SlideTheTool({ decision }: { decision?: string }) {
  return (
    <SlideCard accentColor="var(--accent)">
      <SlideHeader
        icon="🔧"
        title="The Flowchart IS the Tool"
        subtitle="chart.toMCPTool() — auto-generated from structure, no hand-written description"
      />
      <div style={{ padding: "16px" }}>
        <FlowchartDiagram decision={decision} />
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
            What the pattern produces
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, padding: "8px 10px", background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11, lineHeight: 1.55 }}>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>Build-time</div>
              <div style={{ color: "var(--text-muted)" }}>Self-describing tool — graph structure generates the MCP schema</div>
            </div>
            <div style={{ flex: 1, padding: "8px 10px", background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11, lineHeight: 1.55 }}>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>Runtime</div>
              <div style={{ color: "var(--text-muted)" }}>Causal trace — every read, write, decision captured during traversal</div>
            </div>
          </div>
          <Quote>
            "MCP standardizes the envelope. The pattern is the letter." — The tool description is real; the internals are no longer a black box.
          </Quote>
        </div>
      </div>
    </SlideCard>
  );
}

// Slide 2 — appears after Claude calls: What Claude Sent
function SlideClaudeCalled({ toolInput }: { toolInput: Record<string, unknown> }) {
  return (
    <SlideCard accentColor="var(--success)" delay={0.05}>
      <SlideHeader
        icon="🤖"
        title="Claude Invoked the Tool"
        subtitle="FootPrint is now executing with exactly these inputs"
      />
      <div style={{ padding: "16px" }}>
        <pre style={{
          margin: 0, padding: "10px 12px",
          background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 8,
          fontSize: 11, lineHeight: 1.65, color: "var(--text-secondary)",
          fontFamily: "JetBrains Mono, monospace", whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {JSON.stringify(toolInput, null, 2)}
        </pre>
        <Quote>
          Claude inferred the input schema from the flowchart structure — no hand-written tool description that could drift from reality.
        </Quote>
      </div>
    </SlideCard>
  );
}

// Slide 3 — appears after execution: Time Travel + Narrative
function SlideThTrace({ execState }: { execState: ExecState }) {
  return (
    <SlideCard accentColor="var(--phase-observe-border)" delay={0.05}>
      <SlideHeader
        icon="⚡"
        title="The Causal Trace"
        subtitle="Collected during traversal — time travel through every decision"
      />
      <div style={{ height: 460, overflow: "hidden" }}>
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
      </div>
      <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", background: "var(--bg-tertiary)" }}>
        <Quote>
          This trace was returned to Claude as the tool result. That's why the explanation is precise — not hallucinated. The trace does the reasoning for the model.
        </Quote>
      </div>
    </SlideCard>
  );
}

// ── Form fields ────────────────────────────────────────────────────────────

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
  const [storyPhase, setStoryPhase] = useState<StoryPhase>("idle");
  const [toolInputCapture, setToolInputCapture] = useState<Record<string, unknown> | null>(null);

  const { chart, spec } = useMemo(() => buildChart(), []);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const storyBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-scroll story feed as new slides appear
  useEffect(() => {
    if (storyPhase !== "idle") {
      setTimeout(() => storyBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 150);
    }
  }, [storyPhase]);

  async function send() {
    if (running || !apiKey.trim()) return;
    setRunning(true);

    // Reset story for new run
    setStoryPhase("idle");
    setToolInputCapture(null);
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
        throw new Error("Claude did not call the tool — try a different model.");
      }

      // Story: slide 2 unlocks
      setToolInputCapture(toolUse.input as Record<string, unknown>);
      setStoryPhase("tool_called");

      setMessages(prev => prev.map(m =>
        m.id === thinkingId ? { id: thinkingId, kind: "thinking" as const, label: "FootPrint running..." } : m
      ));

      // Run FootPrint with Claude's inputs
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

      const newExecState: ExecState = {
        snapshot, spec, narrativeEntries, runtimeStructure,
        toolOutput, decision, totalMs: Math.round(agg.totalDuration),
      };

      setExecState(newExecState);

      // Story: slide 3 unlocks
      setStoryPhase("trace_ready");

      setMessages(prev => prev.map(m =>
        m.id === thinkingId
          ? { id: thinkingId, kind: "fp_done" as const, decision, totalMs: Math.round(agg.totalDuration) }
          : m
      ));

      // Turn 2: feed trace back to Claude for explanation
      const thinkingId2 = uid();
      const assistantId = uid();
      setMessages(prev => [...prev, { id: thinkingId2, kind: "thinking", label: "Claude is explaining..." }]);

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
        <div style={{
          width: isMobile ? "100%" : "38%",
          display: "flex", flexDirection: "column", overflow: "hidden",
          borderRight: isMobile ? "none" : "1px solid var(--border)",
          flexShrink: 0,
        }}>
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
            <div ref={chatBottomRef} />
          </div>

          {/* Applicant form + send */}
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

        {/* RIGHT: Story slides */}
        {!isMobile && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

            {/* Story progress indicator */}
            <StoryProgressBar phase={storyPhase} />

            {/* Scrollable story feed — slides reveal progressively */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Slide 1: The Tool — always visible, updates to show decision after run */}
              <SlideTheTool decision={execState?.decision} />

              {/* Slide 2: Claude Called — unlocks when tool is invoked */}
              <AnimatePresence>
                {toolInputCapture && <SlideClaudeCalled key="called" toolInput={toolInputCapture} />}
              </AnimatePresence>

              {/* Slide 3: The Trace — unlocks after FootPrint executes */}
              <AnimatePresence>
                {execState && <SlideThTrace key="trace" execState={execState} />}
              </AnimatePresence>

              <div ref={storyBottomRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
