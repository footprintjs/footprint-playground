/**
 * BlueprintView — renders each pipeline stage as an LLM-ready tool description.
 *
 * Each stage card shows: name, type, description, branches, and loop targets.
 * The entire blueprint is copy-pasteable as a tool schema for LLM agents.
 */
import { useState } from "react";
import type { BuildTimeInfo } from "../runner/executeCode";

interface SpecNode {
  name?: string;
  id?: string;
  type?: string;
  description?: string;
  children?: SpecNode[];
  next?: SpecNode;
  branchIds?: string[];
  hasDecider?: boolean;
  hasSelector?: boolean;
  loopTarget?: string;
}

interface StageCard {
  name: string;
  type: "stage" | "decider" | "selector" | "fork";
  description?: string;
  branches?: string[];
  loopTarget?: string;
  order: number;
}

function extractStages(node: SpecNode, seen: Set<string> = new Set()): StageCard[] {
  const cards: StageCard[] = [];
  const name = node.name || node.id || "unknown";
  if (seen.has(name)) return cards;
  seen.add(name);

  let type: StageCard["type"] = "stage";
  if (node.hasDecider || node.type === "decider") type = "decider";
  else if (node.hasSelector) type = "selector";
  else if (node.type === "fork") type = "fork";

  cards.push({
    name,
    type,
    description: node.description,
    branches: node.branchIds,
    loopTarget: node.loopTarget,
    order: cards.length + 1,
  });

  if (node.children) {
    for (const child of node.children) {
      cards.push(...extractStages(child, seen));
    }
  }
  if (node.next) {
    cards.push(...extractStages(node.next, seen));
  }

  return cards;
}

function stageToToolDescription(
  card: StageCard,
  stageDesc?: string
): string {
  const lines: string[] = [];
  lines.push(`name: "${card.name}"`);
  lines.push(`type: "${card.type}"`);

  const desc = stageDesc || card.description;
  if (desc) {
    lines.push(`description: "${desc}"`);
  }

  if (card.branches && card.branches.length > 0) {
    lines.push(`branches: [${card.branches.map((b) => `"${b}"`).join(", ")}]`);
  }

  if (card.loopTarget) {
    lines.push(`loopTarget: "${card.loopTarget}"`);
  }

  return lines.join("\n");
}

interface BlueprintViewProps {
  buildTime: BuildTimeInfo;
}

export function SpecView({ buildTime }: BlueprintViewProps) {
  const { spec, description, stageDescriptions } = buildTime;
  const stages = extractStages(spec as SpecNode);
  const [expandedJson, setExpandedJson] = useState(false);

  // Build full tool schema text for copy
  const toolSchemaText = stages
    .map((card, i) => {
      const desc = stageDescriptions[card.name];
      return `// Stage ${i + 1}\n{\n  ${stageToToolDescription(card, desc).replace(/\n/g, "\n  ")}\n}`;
    })
    .join("\n\n");

  const typeColors: Record<string, string> = {
    stage: "var(--success, #22c55e)",
    decider: "var(--accent, #7c6cf0)",
    selector: "var(--warning, #f59e0b)",
    fork: "var(--info, #3b82f6)",
  };

  const typeLabels: Record<string, string> = {
    stage: "STAGE",
    decider: "DECISION",
    selector: "SELECTOR",
    fork: "PARALLEL",
  };

  return (
    <div
      style={{
        height: "100%",
        overflow: "auto",
        padding: 16,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        color: "var(--text-primary)",
        background: "var(--bg-primary)",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: 16,
          padding: "10px 12px",
          background: "var(--bg-secondary)",
          borderRadius: 8,
          borderLeft: "3px solid var(--accent)",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            color: "var(--accent)",
            marginBottom: 6,
          }}
        >
          LLM Tool Descriptions
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Each stage below is a self-contained tool description. These can be passed
          directly as <code style={{ color: "var(--accent)" }}>tool_use</code> definitions
          for LLM agents — built automatically from the pipeline's code blocks.
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(toolSchemaText)}
          style={{
            marginTop: 8,
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            borderRadius: 4,
            padding: "3px 10px",
            fontSize: 10,
            cursor: "pointer",
          }}
        >
          Copy All Tool Descriptions
        </button>
      </div>

      {/* Pipeline description */}
      {description && (
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Pipeline Flow</SectionLabel>
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              fontSize: 11,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              padding: "8px 12px",
              background: "var(--bg-secondary)",
              borderRadius: 6,
            }}
          >
            {description}
          </pre>
        </div>
      )}

      {/* Stage cards */}
      <SectionLabel>Stage Definitions</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {stages.map((card, i) => {
          const desc = stageDescriptions[card.name] || card.description;
          const color = typeColors[card.type] || "var(--text-muted)";

          return (
            <div
              key={card.name}
              style={{
                padding: "10px 12px",
                background: "var(--bg-secondary)",
                borderRadius: 8,
                borderLeft: `3px solid ${color}`,
              }}
            >
              {/* Stage header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: desc || card.branches ? 6 : 0,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color,
                    background: `color-mix(in srgb, ${color} 15%, transparent)`,
                    padding: "2px 6px",
                    borderRadius: 3,
                  }}
                >
                  {typeLabels[card.type] || card.type}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}
                >
                  #{i + 1}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {card.name}
                </span>
              </div>

              {/* Description */}
              {desc && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    marginBottom: card.branches ? 6 : 0,
                    paddingLeft: 4,
                  }}
                >
                  {desc}
                </div>
              )}

              {/* Branches */}
              {card.branches && card.branches.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingLeft: 4 }}>
                  {card.branches.map((b) => (
                    <span
                      key={b}
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: "var(--bg-tertiary)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      &rarr; {b}
                    </span>
                  ))}
                </div>
              )}

              {/* Loop target */}
              {card.loopTarget && (
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--warning, #f59e0b)",
                    marginTop: 4,
                    paddingLeft: 4,
                  }}
                >
                  &#x21BA; loops back to {card.loopTarget}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Collapsible raw JSON */}
      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <button
            onClick={() => setExpandedJson(!expandedJson)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 0,
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                fontSize: 9,
                transition: "transform 0.15s ease",
                transform: expandedJson ? "rotate(0deg)" : "rotate(-90deg)",
                display: "inline-block",
              }}
            >
              &#9660;
            </span>
            Raw Structure (JSON)
          </button>
          {expandedJson && (
            <button
              onClick={() =>
                navigator.clipboard.writeText(JSON.stringify(spec, null, 2))
              }
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                borderRadius: 4,
                padding: "2px 8px",
                fontSize: 10,
                cursor: "pointer",
              }}
            >
              Copy JSON
            </button>
          )}
        </div>
        {expandedJson && (
          <pre
            style={{
              margin: 0,
              fontSize: 10,
              color: "var(--text-secondary)",
              background: "var(--bg-secondary)",
              padding: 8,
              borderRadius: 6,
              overflow: "auto",
              maxHeight: 300,
            }}
          >
            {JSON.stringify(spec, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: "var(--text-muted)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}
