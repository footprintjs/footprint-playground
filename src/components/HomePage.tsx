import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "../hooks/useIsMobile";

interface CardProps {
  phase: "build" | "execute" | "observe";
  icon: string;
  title: string;
  desc: string;
  cta: string;
  to: string;
  delay: number;
}

function Card({ phase, icon, title, desc, cta, to, delay }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: "easeOut" }}
    >
      <Link
        to={to}
        style={{ textDecoration: "none", display: "block", height: "100%" }}
      >
        <div
          style={{
            height: "100%",
            padding: "28px 24px",
            background: "var(--bg-secondary)",
            border: `1px solid var(--phase-${phase}-border)`,
            borderRadius: 14,
            cursor: "pointer",
            transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 24px var(--phase-${phase}-border)`;
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            (e.currentTarget as HTMLDivElement).style.transform = "none";
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              background: `var(--phase-${phase}-dim)`,
              border: `1px solid var(--phase-${phase}-border)`,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            {icon}
          </div>

          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              {desc}
            </div>
          </div>

          <div style={{ marginTop: "auto", paddingTop: 8 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: `var(--phase-${phase})`,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {cta}
              <span style={{ fontSize: 16 }}>→</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function HomePage() {
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "32px 20px" : "60px 40px",
        gap: isMobile ? 32 : 48,
        background: "var(--bg-primary)",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center", maxWidth: 600 }}
      >
        <div
          style={{
            fontSize: isMobile ? 13 : 14,
            fontWeight: 600,
            color: "var(--accent)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          footprintjs
        </div>
        <h1
          style={{
            fontSize: isMobile ? 32 : 48,
            fontWeight: 800,
            lineHeight: 1.1,
            margin: "0 0 16px",
            background: "linear-gradient(135deg, var(--text-primary) 40%, var(--accent-light))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Self-explainable pipelines
        </h1>
        <p
          style={{
            fontSize: isMobile ? 15 : 17,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Build → Run → Observe. Every stage documents itself as it runs.
          Zero extra code.
        </p>
      </motion.div>

      {/* 3 cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
          gap: 16,
          width: "100%",
          maxWidth: 900,
        }}
      >
        <Card
          phase="build"
          icon="🎬"
          title="How it works"
          desc="Watch a loan application flow through Build → Run → Observe. 2 minutes, no setup."
          cta="Take the tour"
          to="/tour"
          delay={0.15}
        />
        <Card
          phase="execute"
          icon="⚡"
          title="Playground"
          desc="30+ interactive samples — loops, subflows, decision trees, MCP tools. Edit and run live."
          cta="Open playground"
          to="/samples/loan-application"
          delay={0.25}
        />
        <Card
          phase="observe"
          icon="🤖"
          title="Try with your LLM"
          desc="Expose a flowchart as an MCP tool. Claude calls it and explains its decision using the causal trace."
          cta="Try with Claude"
          to="/try-with-ai"
          delay={0.35}
        />
      </div>

      {/* Footer links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}
      >
        {[
          { label: "Docs", href: "https://footprintjs.github.io/footPrint/" },
          { label: "GitHub", href: "https://github.com/footprintjs/footPrint" },
          { label: "npm", href: "https://www.npmjs.com/package/footprintjs" },
        ].map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "var(--text-secondary)")}
            onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "var(--text-muted)")}
          >
            {link.label}
          </a>
        ))}
      </motion.div>
    </div>
  );
}
