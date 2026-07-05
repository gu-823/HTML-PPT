import { Plus, Copy } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { renderSlidePreview } from "@/utils/slideParser";
import { cn } from "@/lib/utils";

const THUMB_W = 200;
const PREVIEW_W = 320;
const SCALE = THUMB_W / PREVIEW_W;

export default function SlidePanel() {
  const doc = useEditorStore((s) => s.doc);
  const current = useEditorStore((s) => s.currentSlideIndex);
  const setCurrentSlide = useEditorStore((s) => s.setCurrentSlide);
  const updateSlideHTMLLive = useEditorStore((s) => s.updateSlideHTMLLive);
  const bumpRender = useEditorStore((s) => s.bumpRender);

  if (!doc) return null;

  const addSlide = () => {
    const id = `slide-${Date.now().toString(36)}`;
    const newSlide = {
      id,
      index: doc.slides.length,
      tag: "section",
      attrs: `class="slide" id="${id}"`,
      innerHTML: '<h2 style="padding:40px;">新幻灯片</h2>',
    };
    const newDoc = { ...doc, slides: [...doc.slides, newSlide] };
    useEditorStore.setState({ doc: newDoc, dirty: true });
    setCurrentSlide(doc.slides.length);
  };

  const duplicateSlide = (i: number) => {
    const s = doc.slides[i];
    const id = `slide-${Date.now().toString(36)}`;
    const copy = { ...s, id, attrs: s.attrs.replace(/id="[^"]*"/, `id="${id}"`) };
    const slides = [...doc.slides];
    slides.splice(i + 1, 0, copy);
    useEditorStore.setState({ doc: { ...doc, slides }, dirty: true });
    setCurrentSlide(i + 1);
  };

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-ink-800 bg-ink-900">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs font-medium text-ink-400">幻灯片</span>
        <button
          onClick={addSlide}
          className="flex h-6 w-6 items-center justify-center rounded text-ink-300 hover:bg-ink-700 hover:text-amber"
          title="新增幻灯片"
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-4">
        {doc.slides.map((slide, i) => (
          <div
            key={slide.id}
            onClick={() => setCurrentSlide(i)}
            className={cn(
              "group relative cursor-pointer rounded-lg p-1.5 transition-all ring-1",
              i === current
                ? "ring-amber bg-amber-soft shadow-glow"
                : "ring-ink-700 hover:ring-ink-600 bg-ink-850",
            )}
            style={{ height: THUMB_W * (9 / 16) + 36 }}
          >
            <div className="mb-1.5 flex items-center justify-between px-0.5">
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  i === current ? "bg-amber text-ink-950" : "bg-ink-700 text-ink-300",
                )}
              >
                {i + 1}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateSlide(i);
                }}
                className="opacity-0 transition-opacity group-hover:opacity-100 text-ink-400 hover:text-amber"
                title="复制此页"
              >
                <Copy className="h-3 w-3" strokeWidth={1.75} />
              </button>
            </div>
            <div
              className="pointer-events-none overflow-hidden rounded bg-white"
              style={{ width: THUMB_W, height: THUMB_W * (9 / 16) }}
            >
              <div
                style={{
                  width: PREVIEW_W,
                  height: PREVIEW_W * (9 / 16),
                  transform: `scale(${SCALE})`,
                  transformOrigin: "top left",
                }}
              >
                <iframe
                  title={`thumb-${i}`}
                  srcDoc={renderSlidePreview(doc, i)}
                  className="h-full w-full border-0"
                  sandbox="allow-same-origin"
                  tabIndex={-1}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-ink-800 px-4 py-2 text-[10px] text-ink-500">
        共 {doc.slides.length} 页
      </div>
    </aside>
  );
}
