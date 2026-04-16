import type { BuildTimeInfo } from "../runner/executeCode";
import type { DescriptionFormat } from "./FlowchartTabs";

export const FORMAT_CAPTION: Record<DescriptionFormat, string> = {
  mcp: "Expose to LLMs — what a model sees when calling this flow.",
  openapi: "Expose as REST — typed HTTP contract (richer when .contract() is declared).",
  mermaid: "Share in docs — copy-paste diagram syntax for READMEs, PRs, and issues.",
};

interface Props {
  buildTime: BuildTimeInfo;
  format: DescriptionFormat;
}

export function FlowDescription({ buildTime, format }: Props) {
  return (
    <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
      {format === "mcp" && <McpView data={buildTime.mcpTool} />}
      {format === "openapi" && (
        <OpenApiView data={buildTime.openAPI} error={buildTime.openAPIError} />
      )}
      {format === "mermaid" && <MermaidView text={buildTime.mermaid} />}
    </div>
  );
}

function McpView({ data }: { data: unknown }) {
  if (!data) {
    return (
      <EmptyState
        title="No MCP tool description available"
        body="This chart did not produce an MCP tool definition. Ensure you are using footprintjs v4.12+ which exposes chart.toMCPTool()."
      />
    );
  }
  return <JsonBlock data={data} />;
}

function OpenApiView({ data, error }: { data: unknown; error?: string }) {
  if (error || !data) {
    return (
      <EmptyState
        title="No OpenAPI spec"
        body={
          <>
            This flow does not declare a{" "}
            <code style={codeStyle}>.contract(&#123; input, output &#125;)</code>. Add one to the
            builder to generate a typed REST contract.
            {error ? (
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                ({error})
              </div>
            ) : null}
          </>
        }
        link={{
          href: "https://footprintjs.github.io/footPrint/guides/features/contract/",
          label: "Learn about contracts →",
        }}
      />
    );
  }
  return <JsonBlock data={data} />;
}

function MermaidView({ text }: { text: string }) {
  if (!text) {
    return (
      <EmptyState
        title="No Mermaid diagram available"
        body="This chart did not produce Mermaid output. Ensure the flowchart is fully built before running."
      />
    );
  }
  return <TextBlock text={text} />;
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre
      style={{
        margin: 0,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        lineHeight: 1.55,
        color: "var(--text)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function TextBlock({ text }: { text: string }) {
  return (
    <pre
      style={{
        margin: 0,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        lineHeight: 1.55,
        color: "var(--text)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {text}
    </pre>
  );
}

function EmptyState({
  title,
  body,
  link,
}: {
  title: string;
  body: React.ReactNode;
  link?: { href: string; label: string };
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        textAlign: "center",
        padding: "0 24px",
        color: "var(--text-muted)",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 420 }}>{body}</div>
      {link ? (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: 14,
            fontSize: 12,
            color: "var(--accent)",
            textDecoration: "none",
            borderBottom: "1px dashed var(--accent)",
          }}
        >
          {link.label}
        </a>
      ) : null}
    </div>
  );
}

const codeStyle: React.CSSProperties = {
  background: "var(--surface-alt, #f4f4f6)",
  padding: "1px 5px",
  borderRadius: 3,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "0.9em",
};
