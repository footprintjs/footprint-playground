import React from "react";

export type FlowSubTab = "visual" | "description";
export type DescriptionFormat = "mcp" | "openapi" | "mermaid";

interface Props {
  active: FlowSubTab;
  onChange: (id: FlowSubTab) => void;
  /** Single caption shown below the deepest active segmented row. */
  caption: string;
  /** Format (only meaningful when active === "description"). */
  format?: DescriptionFormat;
  onFormatChange?: (f: DescriptionFormat) => void;
}

const SUB_TABS: { id: FlowSubTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "visual",
    label: "Visual",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <path d="M10 6.5h4M6.5 10v4M17.5 10v4M10 17.5h4" />
      </svg>
    ),
  },
  {
    id: "description",
    label: "Description",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
        <line x1="8" y1="9" x2="11" y2="9" />
      </svg>
    ),
  },
];

const FORMAT_TABS: { id: DescriptionFormat; label: string; icon: React.ReactNode }[] = [
  {
    id: "mcp",
    label: "MCP",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" />
        <path d="M9 12h.01M12 12h.01M15 12h.01" />
      </svg>
    ),
  },
  {
    id: "openapi",
    label: "OpenAPI",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </svg>
    ),
  },
  {
    id: "mermaid",
    label: "Mermaid",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="4" r="2" />
        <circle cx="5" cy="20" r="2" />
        <circle cx="19" cy="20" r="2" />
        <path d="M12 6v4M12 10l-6 8M12 10l6 8" />
      </svg>
    ),
  },
];

export function FlowchartTabs({ active, onChange, caption, format, onFormatChange }: Props) {
  const isDescription = active === "description";
  const formatLabel =
    isDescription && format ? FORMAT_TABS.find((t) => t.id === format)?.label : undefined;

  return (
    <div
      style={{
        padding: "10px 14px 10px",
        background: "var(--surface-alt, transparent)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Breadcrumb trail */}
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          letterSpacing: 0.4,
          textTransform: "uppercase",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span>Flowchart</span>
        <Chevron />
        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
          {active === "visual" ? "Visual" : "Description"}
        </span>
        {formatLabel && (
          <>
            <Chevron />
            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{formatLabel}</span>
          </>
        )}
      </div>

      {/* Level 2: Visual | Description */}
      <Segmented<FlowSubTab>
        tabs={SUB_TABS}
        active={active}
        onChange={onChange}
      />

      {/* Level 3: MCP | OpenAPI | Mermaid — only when Description is active */}
      {isDescription && format && onFormatChange && (
        <div style={{ marginTop: 6 }}>
          <Segmented<DescriptionFormat>
            tabs={FORMAT_TABS}
            active={format}
            onChange={onFormatChange}
          />
        </div>
      )}

      {/* Single caption — deepest meaning */}
      <div
        style={{
          marginTop: 8,
          fontSize: 11.5,
          color: "var(--text-muted)",
          fontStyle: "italic",
        }}
      >
        {caption}
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; icon: React.ReactNode }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 7,
        padding: 3,
        gap: 2,
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            aria-pressed={isActive}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              fontSize: 12.5,
              fontWeight: 500,
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              background: isActive ? "var(--accent)" : "transparent",
              color: isActive ? "white" : "var(--text-secondary)",
              boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
              transition: "background 0.15s, color 0.15s, box-shadow 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ display: "inline-flex" }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Chevron() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: 0.55 }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/** Subtle fade-in wrapper used on sub-tab content change. */
export function FadeIn({ children, deps }: { children: React.ReactNode; deps: unknown }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(false);
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, [deps]);
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.18s ease-out",
      }}
    >
      {children}
    </div>
  );
}
