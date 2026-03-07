import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";

interface CodePanelProps {
  code: string;
  highlightLines?: [number, number];
}

export function CodePanel({ code, highlightLines }: CodePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{ width: "100%", height: "100%", borderRadius: 8, overflow: "hidden" }}
    >
      <Editor
        height="100%"
        language="typescript"
        theme="vs-dark"
        value={code}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: "none",
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
        }}
        onMount={(editor, monaco) => {
          // Custom dark theme matching our app
          monaco.editor.defineTheme("footprint-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [
              { token: "comment", foreground: "64748b" },
              { token: "keyword", foreground: "818cf8" },
              { token: "string", foreground: "22c55e" },
              { token: "number", foreground: "f59e0b" },
              { token: "type", foreground: "38bdf8" },
            ],
            colors: {
              "editor.background": "#1e293b",
              "editor.foreground": "#f8fafc",
              "editorLineNumber.foreground": "#475569",
              "editorLineNumber.activeForeground": "#94a3b8",
              "editor.lineHighlightBackground": "#334155",
            },
          });
          monaco.editor.setTheme("footprint-dark");

          // Highlight lines if specified
          if (highlightLines) {
            editor.revealLineInCenter(highlightLines[0]);
            editor.deltaDecorations(
              [],
              [
                {
                  range: new monaco.Range(
                    highlightLines[0],
                    1,
                    highlightLines[1],
                    1
                  ),
                  options: {
                    isWholeLine: true,
                    className: "highlighted-line",
                    linesDecorationsClassName: "highlighted-line-gutter",
                  },
                },
              ]
            );
          }
        }}
      />
    </motion.div>
  );
}
