import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileCode2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFile: (file: File) => void;
  onSample: () => void;
}

const ACCEPT = ".html,.htm";

export default function UploadZone({ onFile, onSample }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError("");
      const ok = /\.(html?|htm)$/i.test(file.name) || file.type === "text/html";
      if (!ok) {
        setError("仅支持 .html / .htm 格式的文件");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("文件过大，请上传小于 5MB 的 HTML 文件");
        return;
      }
      onFile(file);
    },
    [onFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "group relative w-full max-w-3xl cursor-pointer rounded-2xl border-2 border-dashed p-16 text-center transition-all duration-300",
        "bg-ink-900/60 backdrop-blur-sm",
        dragging
          ? "border-amber shadow-glow scale-[1.01]"
          : "border-ink-600 hover:border-amber/60 hover:bg-ink-850/60",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {/* 装饰光晕 */}
      <div
        className={cn(
          "pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-amber/10 blur-3xl transition-opacity duration-500",
          dragging ? "opacity-100" : "opacity-0 group-hover:opacity-70",
        )}
      />

      <div className="relative flex flex-col items-center gap-5">
        <div
          className={cn(
            "flex h-20 w-20 items-center justify-center rounded-2xl border transition-all duration-300",
            dragging
              ? "border-amber bg-amber-soft text-amber"
              : "border-ink-600 bg-ink-800 text-ink-300 group-hover:border-amber/40 group-hover:text-amber",
          )}
        >
          <UploadCloud className="h-9 w-9" strokeWidth={1.5} />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold text-ink-100">
            拖拽 HTML 幻灯片到这里
          </h2>
          <p className="text-sm text-ink-400">
            或点击此区域选择文件 · 支持 .html / .htm 格式
          </p>
        </div>

        {error && (
          <div className="animate-fade-in rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <FileCode2 className="h-4 w-4" strokeWidth={1.5} />
            单文件渲染
          </span>
          <span className="text-ink-700">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-teal" strokeWidth={1.5} />
            可视化 + 代码双模式
          </span>
        </div>
      </div>

      {/* 示例入口 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSample();
        }}
        className="absolute bottom-5 right-6 text-xs font-medium text-teal transition-colors hover:text-amber"
      >
        没有文件？试试示例 →
      </button>
    </div>
  );
}
