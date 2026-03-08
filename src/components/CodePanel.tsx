import { useRef, useEffect } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { motion } from "framer-motion";

interface CodePanelProps {
  code: string;
  highlightLines?: [number, number];
  newCodeRange?: [number, number];
}

type MonacoEditor = Parameters<OnMount>[0];
type Monaco = Parameters<OnMount>[1];

export function CodePanel({ code, highlightLines, newCodeRange }: CodePanelProps) {
  const editorRef = useRef<MonacoEditor>(undefined);
  const monacoRef = useRef<Monaco>(undefined);
  const decorationIds = useRef<string[]>([]);

  // Update decorations whenever props change
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const decorations: Parameters<typeof editor.deltaDecorations>[1] = [];
    const revealLine = newCodeRange?.[0] ?? highlightLines?.[0];

    if (newCodeRange) {
      decorations.push({
        range: new monaco.Range(newCodeRange[0], 1, newCodeRange[1], 1),
        options: {
          isWholeLine: true,
          className: "new-code-line",
          linesDecorationsClassName: "new-code-gutter",
        },
      });
    } else if (highlightLines) {
      decorations.push({
        range: new monaco.Range(highlightLines[0], 1, highlightLines[1], 1),
        options: {
          isWholeLine: true,
          className: "highlighted-line",
          linesDecorationsClassName: "highlighted-line-gutter",
        },
      });
    }

    decorationIds.current = editor.deltaDecorations(decorationIds.current, decorations);

    if (revealLine) {
      editor.revealLineInCenter(revealLine);
    }
  }, [code, highlightLines, newCodeRange]);

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
          editorRef.current = editor;
          monacoRef.current = monaco;

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

          // Apply initial decorations
          const decorations: Parameters<typeof editor.deltaDecorations>[1] = [];
          const revealLine = newCodeRange?.[0] ?? highlightLines?.[0];

          if (newCodeRange) {
            decorations.push({
              range: new monaco.Range(newCodeRange[0], 1, newCodeRange[1], 1),
              options: {
                isWholeLine: true,
                className: "new-code-line",
                linesDecorationsClassName: "new-code-gutter",
              },
            });
          } else if (highlightLines) {
            decorations.push({
              range: new monaco.Range(highlightLines[0], 1, highlightLines[1], 1),
              options: {
                isWholeLine: true,
                className: "highlighted-line",
                linesDecorationsClassName: "highlighted-line-gutter",
              },
            });
          }

          decorationIds.current = editor.deltaDecorations([], decorations);
          if (revealLine) {
            editor.revealLineInCenter(revealLine);
          }
        }}
      />
    </motion.div>
  );
}
