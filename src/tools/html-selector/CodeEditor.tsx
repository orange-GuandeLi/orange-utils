import { useEffect, useRef } from "react";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { html } from "@codemirror/lang-html";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter } from "@codemirror/language";

const lightTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "13px",
    backgroundColor: "#ffffff",
  },
  ".cm-scroller": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    overflow: "auto",
  },
  ".cm-content": {
    padding: "8px 0",
    caretColor: "#3b82f6",
  },
  ".cm-gutters": {
    backgroundColor: "#f8fafc",
    borderRight: "1px solid #e2e8f0",
    color: "#94a3b8",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#f1f5f9",
    color: "#475569",
  },
  ".cm-activeLine": {
    backgroundColor: "#f8fafc",
  },
  ".cm-foldGutter": {
    color: "#cbd5e1",
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "#3b82f6",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "#bfdbfe",
  },
  ".cm-matchingBracket": {
    backgroundColor: "#dbeafe",
    outline: "1px solid #93c5fd",
  },
});

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function CodeEditor({ value, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        bracketMatching(),
        foldGutter(),
        syntaxHighlighting(defaultHighlightStyle),
        html(),
        lightTheme,
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div ref={containerRef} className="h-full overflow-hidden" />
  );
}
