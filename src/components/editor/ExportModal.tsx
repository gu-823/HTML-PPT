import { useEffect, useState } from "react";
import { Download, X, FileDown, FilePlus2, Check } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { cn } from "@/lib/utils";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ExportModal({ open, onClose }: ExportModalProps) {
  const filename = useEditorStore((s) => s.filename);
  const exportHtml = useEditorStore((s) => s.exportHtml);
  const [mode, setMode] = useState<"overwrite" | "new">("overwrite");
  const [newName, setNewName] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setDone(false);
      setMode("overwrite");
      setNewName(stripExt(filename) + "-副本");
    }
  }, [open, filename]);

  if (!open) return null;

  const baseName = stripExt(filename) || "presentation";
  const finalName = mode === "overwrite" ? ensureHtmlExt(filename) : ensureHtmlExt(newName || baseName);

  const handleDownload = () => {
    const html = exportHtml();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    useEditorStore.setState({ dirty: false });
    setDone(true);
    setTimeout(onClose, 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-fade-in w-full max-w-md rounded-2xl border border-ink-700 bg-ink-900 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-soft text-amber">
              <Download className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-base font-semibold text-ink-100">导出 HTML 文件</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-ink-700 hover:text-ink-100"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <button
            onClick={() => setMode("overwrite")}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
              mode === "overwrite" ? "border-amber bg-amber-soft" : "border-ink-700 hover:border-ink-600",
            )}
          >
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", mode === "overwrite" ? "bg-amber text-ink-950" : "bg-ink-800 text-ink-300")}>
              <FileDown className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-ink-100">覆盖保存</div>
              <div className="text-xs text-ink-400">使用原文件名 {ensureHtmlExt(filename)}</div>
            </div>
            {mode === "overwrite" && <Check className="h-4 w-4 text-amber" strokeWidth={2} />}
          </button>

          <button
            onClick={() => setMode("new")}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
              mode === "new" ? "border-amber bg-amber-soft" : "border-ink-700 hover:border-ink-600",
            )}
          >
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", mode === "new" ? "bg-amber text-ink-950" : "bg-ink-800 text-ink-300")}>
              <FilePlus2 className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-ink-100">另存为新文件</div>
              <div className="text-xs text-ink-400">输入新文件名保存</div>
            </div>
            {mode === "new" && <Check className="h-4 w-4 text-amber" strokeWidth={2} />}
          </button>

          {mode === "new" && (
            <div className="animate-fade-in">
              <label className="mb-1.5 block text-xs text-ink-400">文件名</label>
              <div className="flex items-center rounded-lg border border-ink-700 bg-ink-850 px-3 focus-within:border-amber/50">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-transparent py-2 text-sm text-ink-100 focus:outline-none"
                  placeholder="输入文件名"
                  autoFocus
                />
                <span className="text-xs text-ink-500">.html</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-ink-800 px-5 py-4">
          <span className="text-xs text-ink-500">将下载：{finalName}</span>
          <button
            onClick={handleDownload}
            disabled={done}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              done ? "bg-teal text-ink-950" : "bg-amber text-ink-950 hover:bg-amber-dark",
            )}
          >
            {done ? (
              <>
                <Check className="h-4 w-4" strokeWidth={2} />
                已下载
              </>
            ) : (
              <>
                <Download className="h-4 w-4" strokeWidth={2} />
                下载文件
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function stripExt(name: string): string {
  return name.replace(/\.(html?|htm)$/i, "");
}
function ensureHtmlExt(name: string): string {
  return /\.(html?|htm)$/i.test(name) ? name : name + ".html";
}
