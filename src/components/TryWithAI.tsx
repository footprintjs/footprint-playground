import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "../hooks/useIsMobile";

type Provider = "claude" | "openai" | "langchain";

interface ProviderCardProps {
  id: Provider;
  logo: string;
  name: string;
  keyLabel: string;
  keyPlaceholder: string;
  active: boolean;
  comingSoon?: boolean;
  onClick?: () => void;
}

function ProviderCard({
  logo,
  name,
  active,
  comingSoon,
  onClick,
}: ProviderCardProps) {
  return (
    <button
      onClick={comingSoon ? undefined : onClick}
      disabled={comingSoon}
      style={{
        flex: 1,
        padding: "16px 18px",
        background: active
          ? "var(--phase-observe-dim)"
          : "var(--bg-secondary)",
        border: `1.5px solid ${active ? "var(--success)" : "var(--border)"}`,
        borderRadius: 10,
        cursor: comingSoon ? "default" : "pointer",
        textAlign: "left",
        opacity: comingSoon ? 0.45 : 1,
        transition: "border-color 0.15s, background 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ fontSize: 22 }}>{logo}</span>
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {name}
        </div>
        {comingSoon && (
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            Coming soon
          </div>
        )}
        {active && (
          <div style={{ fontSize: 11, color: "var(--success)", marginTop: 2 }}>
            Available
          </div>
        )}
      </div>
    </button>
  );
}

export function TryWithAI() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [provider] = useState<Provider>("claude");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const providerConfig: Record<Provider, { keyLabel: string; keyPlaceholder: string }> = {
    claude: { keyLabel: "Anthropic API Key", keyPlaceholder: "sk-ant-api03-..." },
    openai: { keyLabel: "OpenAI API Key", keyPlaceholder: "sk-..." },
    langchain: { keyLabel: "Anthropic API Key", keyPlaceholder: "sk-ant-api03-..." },
  };

  const { keyLabel, keyPlaceholder } = providerConfig[provider];

  function launch() {
    if (!apiKey.trim()) return;
    const inputJson = JSON.stringify(
      {
        apiKey: apiKey.trim(),
        applicant: {
          applicantName: "Sarah Chen",
          creditScore: 720,
          monthlyIncome: 5000,
          monthlyDebts: 1800,
        },
      },
      null,
      2,
    );
    navigate("/samples/llm-agent-tool", { state: { inputJson } });
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "32px 20px" : "60px 40px",
        background: "var(--bg-primary)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {/* Back */}
        <Link
          to="/"
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          ← Home
        </Link>

        {/* Title */}
        <div>
          <h1
            style={{
              fontSize: isMobile ? 24 : 30,
              fontWeight: 800,
              margin: "0 0 8px",
              color: "var(--text-primary)",
            }}
          >
            Try FootPrint with your LLM
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Expose a flowchart as an MCP tool. Your LLM calls it and explains the
            decision using the automatic causal trace — no extra code.
          </p>
        </div>

        {/* Provider selection */}
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 10,
            }}
          >
            Choose provider
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <ProviderCard
              id="claude"
              logo="🟣"
              name="Claude"
              keyLabel="Anthropic API Key"
              keyPlaceholder="sk-ant-api03-..."
              active={provider === "claude"}
            />
            <ProviderCard
              id="openai"
              logo="⚫"
              name="OpenAI"
              keyLabel="OpenAI API Key"
              keyPlaceholder="sk-..."
              active={provider === "openai"}
              comingSoon
            />
            <ProviderCard
              id="langchain"
              logo="🦜"
              name="LangChain"
              keyLabel="Anthropic API Key"
              keyPlaceholder="sk-ant-api03-..."
              active={provider === "langchain"}
              comingSoon
            />
          </div>
        </div>

        {/* API key input */}
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              display: "block",
              marginBottom: 8,
            }}
          >
            {keyLabel}
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && launch()}
              placeholder={keyPlaceholder}
              autoComplete="off"
              style={{
                width: "100%",
                padding: "12px 44px 12px 14px",
                background: "var(--bg-secondary)",
                border: "1.5px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-primary)",
                fontSize: 14,
                fontFamily: "JetBrains Mono, monospace",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) =>
                ((e.target as HTMLInputElement).style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                ((e.target as HTMLInputElement).style.borderColor = "var(--border)")
              }
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 14,
                padding: 4,
              }}
            >
              {showKey ? "🙈" : "👁"}
            </button>
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>🔒</span>
            Key runs entirely in your browser — never sent to any server.
          </div>
        </div>

        {/* What it does */}
        <div
          style={{
            padding: "14px 16px",
            background: "var(--phase-observe-dim)",
            border: "1px solid var(--phase-observe-border)",
            borderRadius: 10,
            fontSize: 13,
            color: "var(--text-secondary)",
            lineHeight: 1.55,
          }}
        >
          <div
            style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}
          >
            What this demo does
          </div>
          Runs a credit decision flowchart, exposes it as an MCP tool via{" "}
          <code
            style={{
              fontFamily: "JetBrains Mono, monospace",
              background: "var(--bg-tertiary)",
              padding: "1px 5px",
              borderRadius: 4,
            }}
          >
            chart.toMCPTool()
          </code>
          , and asks Claude to evaluate a loan applicant. Claude calls the tool,
          FootPrint captures the decision evidence, and the narrative flows back
          into Claude's response.
        </div>

        {/* Launch button */}
        <button
          onClick={launch}
          disabled={!apiKey.trim()}
          style={{
            padding: "14px 0",
            background: apiKey.trim()
              ? "linear-gradient(135deg, var(--accent), var(--success))"
              : "var(--bg-tertiary)",
            border: "none",
            borderRadius: 10,
            color: apiKey.trim() ? "white" : "var(--text-muted)",
            fontSize: 15,
            fontWeight: 700,
            cursor: apiKey.trim() ? "pointer" : "default",
            transition: "opacity 0.15s, transform 0.1s",
            boxShadow: apiKey.trim()
              ? "0 4px 20px rgba(124, 108, 240, 0.35)"
              : "none",
          }}
          onMouseEnter={(e) => {
            if (apiKey.trim())
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "none";
          }}
        >
          Launch demo →
        </button>
      </motion.div>
    </div>
  );
}
