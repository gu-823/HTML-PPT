import { useCallback, useEffect, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { FrameBridgeProvider } from "@/components/editor/FrameBridge";
import Toolbar from "@/components/editor/Toolbar";
import SlidePanel from "@/components/editor/SlidePanel";
import Canvas from "@/components/editor/Canvas";
import PropertyPanel from "@/components/editor/PropertyPanel";
import CodeEditor from "@/components/editor/CodeEditor";
import ExportModal from "@/components/editor/ExportModal";
import type { FrameCommand } from "@/types";

export default function Editor() {
  const mode = useEditorStore((s) => s.mode);
  const doc = useEditorStore((s) => s.doc);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const [sender, setSender] = useState<((cmd: FrameCommand) => void) | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const onReady = useCallback((send: (cmd: FrameCommand) => void) => {
    setSender(() => send);
  }, []);

  // 全局快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inField = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (inField) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  if (!doc) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-950">
        <p className="text-ink-400">无文档，请返回首页上传。</p>
      </div>
    );
  }

  return (
    <FrameBridgeProvider send={sender}>
      <div className="flex h-screen flex-col bg-ink-950">
        <Toolbar onExport={() => setExportOpen(true)} />
        <div className="flex min-h-0 flex-1">
          <SlidePanel />
          <main className="relative min-w-0 flex-1">
            {mode === "visual" ? <Canvas onReady={onReady} /> : <CodeEditor />}
          </main>
          <PropertyPanel />
        </div>
      </div>
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </FrameBridgeProvider>
  );
}
