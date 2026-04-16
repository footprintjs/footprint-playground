import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { useTheme } from "../ThemeContext";

function stripFrontMatter(md: string): string {
  if (!md.startsWith("---")) return md;
  const end = md.indexOf("\n---", 3);
  if (end === -1) return md;
  const after = md.indexOf("\n", end + 4);
  return after === -1 ? "" : md.slice(after + 1);
}

interface Props {
  markdown: string;
}

export function SampleExplainer({ markdown }: Props) {
  const { theme } = useTheme();
  const body = stripFrontMatter(markdown);
  const isDark = theme === "dark";

  const tableBorder = isDark ? "#2a2a36" : "#e5e7eb";
  const codeBg = isDark ? "#1e1e2e" : "#f4f4f6";
  const inlineCodeBg = isDark ? "#2a2a36" : "#eef0f3";
  const blockquoteBg = isDark ? "#1a1b24" : "#f8f9fb";

  return (
    <div
      className="sample-explainer"
      style={{
        flex: 1,
        overflow: "auto",
        padding: "28px 36px 48px",
        fontSize: 14,
        lineHeight: 1.65,
        color: "var(--text)",
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                margin: "0 0 16px",
                lineHeight: 1.25,
                color: "var(--text)",
              }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              style={{
                fontSize: 17,
                fontWeight: 700,
                margin: "28px 0 10px",
                lineHeight: 1.3,
                color: "var(--text)",
              }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                margin: "20px 0 8px",
                color: "var(--text)",
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p style={{ margin: "0 0 14px" }}>{children}</p>
          ),
          ul: ({ children }) => (
            <ul style={{ margin: "0 0 14px", paddingLeft: 22 }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ margin: "0 0 14px", paddingLeft: 22 }}>{children}</ol>
          ),
          li: ({ children }) => (
            <li style={{ margin: "0 0 4px" }}>{children}</li>
          ),
          strong: ({ children }) => (
            <strong style={{ fontWeight: 600, color: "var(--text)" }}>{children}</strong>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              style={{
                color: "var(--accent)",
                textDecoration: "none",
                borderBottom: "1px dashed var(--accent)",
              }}
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote
              style={{
                margin: "0 0 14px",
                padding: "10px 14px",
                background: blockquoteBg,
                borderLeft: "3px solid var(--accent)",
                borderRadius: 4,
                color: "var(--text-muted)",
              }}
            >
              {children}
            </blockquote>
          ),
          code: ({ inline, className, children, ...rest }: any) => {
            if (inline) {
              return (
                <code
                  {...rest}
                  style={{
                    background: inlineCodeBg,
                    padding: "1px 5px",
                    borderRadius: 3,
                    fontSize: "0.9em",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "var(--text)",
                  }}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...rest}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre
              style={{
                background: codeBg,
                padding: "12px 14px",
                borderRadius: 6,
                overflowX: "auto",
                margin: "0 0 14px",
                fontSize: 12.5,
                lineHeight: 1.55,
                fontFamily: "'JetBrains Mono', monospace",
                border: `1px solid ${tableBorder}`,
              }}
            >
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div style={{ overflowX: "auto", margin: "0 0 14px" }}>
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  fontSize: 13,
                }}
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th
              style={{
                textAlign: "left",
                padding: "8px 12px",
                borderBottom: `2px solid ${tableBorder}`,
                fontWeight: 600,
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                padding: "8px 12px",
                borderBottom: `1px solid ${tableBorder}`,
              }}
            >
              {children}
            </td>
          ),
          hr: () => (
            <hr
              style={{
                border: "none",
                borderTop: `1px solid ${tableBorder}`,
                margin: "24px 0",
              }}
            />
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
