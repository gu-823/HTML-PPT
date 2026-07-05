import { useEffect, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Check, RotateCcw } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

export default function CodeEditor() {
  const code = useEditorStore((s) => s.code);
  const setCode = useEditorStore((s) => s.setCode);
  const applyCode = useEditorStore((s) => s.applyCode);
  const dirty = useEditorStore((s) => s.dirty);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme("slideforge", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0E0E12",
        "editorGutter.background": "#15151B",
        "editor.lineHighlightBackground": "#1B1B23",
      },
    });
    monaco.editor.setTheme("slideforge");
  };

  // Ctrl+S 应用代码
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        applyCode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyCode]);

  return (
    <div className="flex h-full flex-col bg-ink-950">
      <div className="flex items-center justify-between border-b border-ink-800 bg-ink-900 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-teal" />
          <span className="font-mono text-xs text-ink-300">HTML 源码编辑</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-ink-500">Ctrl + S 应用</span>
          <button
            onClick={applyCode}
            className="flex items-center gap-1.5 rounded-md bg-amber px-3 py-1 text-xs font-semibold text-ink-950 hover:bg-amber-dark"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2} />
            应用到画布
          </button>
          <button
            onClick={() => {
              const doc = useEditorStore.getState().doc;
              if (doc) setCode(useEditorStore.getState().exportHtml());
            }}
            className="flex items-center gap-1.5 rounded-md border border-ink-700 px-3 py-1 text-xs text-ink-300 hover:bg-ink-700"
            title="重置为当前文档"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
            重置
          </button>
        </div>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="html"
          value={code}
          onMount={handleMount}
          onChange={(val) => setCode(val || "")}
          options={{
            fontSize: 13,
            fontFamily: '"JetBrains Mono", monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
            lineNumbers: "on",
            padding: { top: 12 },
            smoothScrolling: true,
          }}
        />
      </div>
      {dirty && (
        <div className="border-t border-ink-800 bg-amber-soft px-4 py-1.5 text-[11px] text-amber">
          有未应用的更改 — 点击「应用到画布」同步至可视化模式
        </div>
      )}
    </div>
  );
}
