import { useNavigate } from "react-router-dom";
import {
  Layers,
  MousePointer2,
  Code2,
  Undo2,
  Redo2,
  Download,
  ChevronLeft,
  Home as HomeIcon,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import type { EditMode } from "@/types";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  onExport: () => void;
}

export default function Toolbar({ onExport }: ToolbarProps) {
  const navigate = useNavigate();
  const filename = useEditorStore((s) => s.filename);
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);
  const dirty = useEditorStore((s) => s.dirty);

  const ModeToggle = ({ value, label, icon: Icon }: { value: EditMode; label: string; icon: typeof Code2 }) => (
    <button
      onClick={() => setMode(value)}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        mode === value
          ? "bg-amber text-ink-950"
          : "text-ink-300 hover:bg-ink-700 hover:text-ink-100",
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </button>
  );

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-ink-800 bg-ink-900 px-4">
      {/* 左：Logo + 文件名 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-300 hover:bg-ink-700 hover:text-ink-100"
          title="返回首页"
        >
          <HomeIcon className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-soft text-amber">
            <Layers className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="max-w-[200px] truncate text-sm font-medium text-ink-100">
              {filename || "未命名"}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-ink-500">
              {dirty ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber" />
                  未保存
                </>
              ) : (
                "已同步"
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 中：模式切换 */}
      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-ink-700 bg-ink-850 p-1">
        <ModeToggle value="visual" label="可视化编辑" icon={MousePointer2} />
        <ModeToggle value="code" label="代码编辑" icon={Code2} />
      </div>

      {/* 右：撤销/重做 + 导出 */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={past.length === 0}
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-300 transition-colors hover:bg-ink-700 hover:text-ink-100 disabled:opacity-30 disabled:hover:bg-transparent"
          title="撤销 (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-300 transition-colors hover:bg-ink-700 hover:text-ink-100 disabled:opacity-30 disabled:hover:bg-transparent"
          title="重做 (Ctrl+Y)"
        >
          <Redo2 className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <div className="mx-2 h-5 w-px bg-ink-700" />
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 rounded-md bg-amber px-3.5 py-1.5 text-xs font-semibold text-ink-950 transition-colors hover:bg-amber-dark"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2} />
          导出
        </button>
      </div>
    </header>
  );
}
