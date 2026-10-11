import type { DescriptionFormat } from "./FlowchartTabs";

export const FORMAT_CAPTION: Record<DescriptionFormat, string> = {
  mcp: "Expose to LLMs — what a model sees when calling this flow.",
  openapi: "Expose as REST — typed HTTP contract (richer when .contract() is declared).",
  mermaid: "Share in docs — copy-paste diagram syntax for READMEs, PRs, and issues.",
};
