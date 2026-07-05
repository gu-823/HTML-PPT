import { useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Image as ImageIcon,
  Video,
  Type,
  Move,
  Square,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { useFrameBridge } from "@/components/editor/FrameBridge";
import { uid } from "@/utils/slideParser";
import { parseVideoUrl } from "@/utils/video";
import type { ElementStyle } from "@/types";
import { cn } from "@/lib/utils";

const DEFAULTS: ElementStyle = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  fontSize: 16,
  fontWeight: "400",
  fontStyle: "normal",
  textDecoration: "none",
  textAlign: "left",
  color: "#ffffff",
  background: "",
  fontFamily: "",
};

export default function PropertyPanel() {
  const send = useFrameBridge();
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectedTag = useEditorStore((s) => s.selectedTag);
  const selectedStyles = useEditorStore((s) => s.selectedStyles);
  const setSelectedStyles = useEditorStore((s) => s.setSelectedStyles);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState("");

  const st = { ...DEFAULTS, ...selectedStyles };
  const isText = selectedId && ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "div", "li", "a", "label", "blockquote", "strong", "em"].includes(selectedTag);

  // 应用单个 CSS 属性到选中元素
  const applyStyle = (prop: string, value: string) => {
    if (!selectedId || !send) return;
    setSelectedStyles({ [propKey(prop)]: value } as Partial<ElementStyle>);
    send({ type: "applyStyle", id: selectedId, styles: { [prop]: value } });
  };

  const toggleStyle = (prop: string, onValue: string, offValue: string) => {
    const current = String(st[propKey(prop) as keyof ElementStyle] || offValue);
    applyStyle(prop, current === onValue ? offValue : onValue);
  };

  const handleImageUpload = (file: File) => {
    if (!send) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || "");
      const id = uid("el");
      const html = `<img data-eid="${id}" src="${src}" alt="" style="position:absolute;left:80px;top:160px;width:360px;height:auto;border-radius:8px;" />`;
      send({ type: "insertHTML", html });
    };
    reader.readAsDataURL(file);
  };

  const handleInsertVideo = () => {
    setVideoError("");
    if (!send) return;
    const embed = parseVideoUrl(videoUrl);
    if (!embed) {
      setVideoError("无法识别视频链接，请粘贴 YouTube 或 Bilibili 链接");
      return;
    }
    const id = uid("el");
    const html = embed.html.replace('data-eid=""', `data-eid="${id}"`);
    send({ type: "insertHTML", html });
    setVideoUrl("");
  };

  const handleDelete = () => {
    if (!selectedId || !send) return;
    send({ type: "delete", id: selectedId });
  };

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-ink-800 bg-ink-900">
      <div className="border-b border-ink-800 px-4 py-3">
        <h3 className="font-display text-sm font-semibold text-ink-100">属性面板</h3>
        <p className="mt-0.5 text-xs text-ink-500">
          {selectedId ? `已选中：${selectedTag.toUpperCase()}` : "点击画布元素以编辑"}
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {/* 插入工具 */}
        <Section title="插入元素" icon={Square}>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => imgInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-ink-700 bg-ink-850 py-2 text-xs text-ink-200 transition-colors hover:border-amber/40 hover:text-amber"
            >
              <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
              图片
            </button>
            <button
              onClick={() => {
                const id = uid("el");
                send?.({
                  type: "insertHTML",
                  html: `<div data-eid="${id}" style="position:absolute;left:80px;top:160px;width:420px;font-size:24px;color:#1a1a1a;line-height:1.5;">双击编辑文本</div>`,
                });
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-ink-700 bg-ink-850 py-2 text-xs text-ink-200 transition-colors hover:border-amber/40 hover:text-amber"
            >
              <Type className="h-3.5 w-3.5" strokeWidth={1.75} />
              文本框
            </button>
          </div>
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImageUpload(f);
              e.target.value = "";
            }}
          />
        </Section>

        {/* 视频嵌入 */}
        <Section title="嵌入视频" icon={Video}>
          <div className="flex gap-2">
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="粘贴 YouTube / Bilibili 链接"
              className="min-w-0 flex-1 rounded-md border border-ink-700 bg-ink-850 px-2.5 py-1.5 text-xs text-ink-100 placeholder:text-ink-500 focus:border-amber/50 focus:outline-none"
            />
            <button
              onClick={handleInsertVideo}
              className="shrink-0 rounded-md bg-ink-700 px-2.5 text-xs text-ink-100 hover:bg-ink-600"
            >
              嵌入
            </button>
          </div>
          {videoError && <p className="mt-1.5 text-[11px] text-danger">{videoError}</p>}
          <p className="mt-1.5 text-[10px] text-ink-500">
            支持 youtube.com / youtu.be / bilibili.com
          </p>
        </Section>

        {/* 选中元素的变换 */}
        {selectedId && (
          <Section title="变换" icon={Move}>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="X" value={Math.round(st.x)} onChange={(v) => applyStyle("left", v + "px")} />
              <NumberField label="Y" value={Math.round(st.y)} onChange={(v) => applyStyle("top", v + "px")} />
              <NumberField label="宽" value={Math.round(st.width)} onChange={(v) => applyStyle("width", v + "px")} />
              <NumberField label="高" value={Math.round(st.height)} onChange={(v) => applyStyle("height", v + "px")} />
            </div>
          </Section>
        )}

        {/* 文字样式 */}
        {selectedId && isText && (
          <Section title="文字" icon={Type}>
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs text-ink-400">字号</label>
                  <span className="text-xs tabular-nums text-ink-300">{Math.round(st.fontSize)}px</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={96}
                  value={Math.round(st.fontSize)}
                  onChange={(e) => applyStyle("fontSize", e.target.value + "px")}
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-1">
                <ToggleBtn active={st.fontWeight === "700" || st.fontWeight === "bold"} onClick={() => toggleStyle("fontWeight", "700", "400")} title="加粗">
                  <Bold className="h-3.5 w-3.5" strokeWidth={2} />
                </ToggleBtn>
                <ToggleBtn active={st.fontStyle === "italic"} onClick={() => toggleStyle("fontStyle", "italic", "normal")} title="斜体">
                  <Italic className="h-3.5 w-3.5" strokeWidth={2} />
                </ToggleBtn>
                <ToggleBtn active={st.textDecoration !== "none" && !!st.textDecoration} onClick={() => toggleStyle("textDecoration", "underline", "none")} title="下划线">
                  <Underline className="h-3.5 w-3.5" strokeWidth={2} />
                </ToggleBtn>
                <div className="mx-1 h-5 w-px bg-ink-700" />
                <ToggleBtn active={st.textAlign === "left" || !st.textAlign} onClick={() => applyStyle("textAlign", "left")} title="左对齐">
                  <AlignLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
                </ToggleBtn>
                <ToggleBtn active={st.textAlign === "center"} onClick={() => applyStyle("textAlign", "center")} title="居中">
                  <AlignCenter className="h-3.5 w-3.5" strokeWidth={1.75} />
                </ToggleBtn>
                <ToggleBtn active={st.textAlign === "right"} onClick={() => applyStyle("textAlign", "right")} title="右对齐">
                  <AlignRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </ToggleBtn>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <ColorField label="文字色" value={st.color || "#ffffff"} onChange={(v) => applyStyle("color", v)} />
                <ColorField label="背景" value={st.background || "#000000"} onChange={(v) => applyStyle("background", v)} allowClear />
              </div>
            </div>
          </Section>
        )}

        {/* 删除 */}
        {selectedId && (
          <button
            onClick={handleDelete}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 py-2 text-xs font-medium text-danger transition-colors hover:bg-danger/20"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            删除元素
          </button>
        )}
      </div>
    </aside>
  );
}

// ---- 子组件 ----
function Section({ title, icon: Icon, children }: { title: string; icon: typeof Type; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-ink-400" strokeWidth={1.75} />
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink-400">{title}</span>
      </div>
      {children}
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-850 px-2 py-1">
      <span className="text-[10px] text-ink-500">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
        className="w-full bg-transparent text-xs text-ink-100 focus:outline-none"
      />
    </label>
  );
}

function ToggleBtn({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        active ? "bg-amber text-ink-950" : "bg-ink-800 text-ink-300 hover:bg-ink-700",
      )}
    >
      {children}
    </button>
  );
}

function ColorField({ label, value, onChange, allowClear }: { label: string; value: string; onChange: (v: string) => void; allowClear?: boolean }) {
  return (
    <label className="flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-850 px-2 py-1">
      <span className="shrink-0 text-[10px] text-ink-500">{label}</span>
      <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded border border-ink-600">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute -left-1 -top-1 h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
        />
      </div>
      <span className="truncate text-[10px] tabular-nums text-ink-300">{value}</span>
      {allowClear && (
        <button
          onClick={() => onChange("transparent")}
          className="ml-auto text-[10px] text-ink-500 hover:text-danger"
        >
          清除
        </button>
      )}
    </label>
  );
}

// CSS 属性名 → ElementStyle 键
function propKey(prop: string): keyof ElementStyle {
  const map: Record<string, keyof ElementStyle> = {
    left: "x",
    top: "y",
    width: "width",
    height: "height",
    fontSize: "fontSize",
    fontWeight: "fontWeight",
    fontStyle: "fontStyle",
    textDecoration: "textDecoration",
    textAlign: "textAlign",
    color: "color",
    background: "background",
    fontFamily: "fontFamily",
  };
  return map[prop] || "x";
}
