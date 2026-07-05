import { useNavigate } from "react-router-dom";
import { Layers, MousePointer2, Code2, Download } from "lucide-react";
import UploadZone from "@/components/upload/UploadZone";
import { useEditorStore } from "@/store/editorStore";
import { SAMPLE_SLIDE_HTML } from "@/utils/sampleSlide";

export default function Home() {
  const navigate = useNavigate();
  const loadFromHtml = useEditorStore((s) => s.loadFromHtml);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const html = String(reader.result || "");
      loadFromHtml(html, file.name);
      navigate("/editor");
    };
    reader.readAsText(file);
  };

  const handleSample = () => {
    loadFromHtml(SAMPLE_SLIDE_HTML, "示例演示文稿.html");
    navigate("/editor");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 bg-grid bg-noise">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-amber/8 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-teal/6 blur-[120px]" />

      {/* 顶栏 */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-8 py-7">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-soft text-amber">
            <Layers className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-ink-100">
            SlideForge
          </span>
        </div>
        <span className="text-xs text-ink-400">HTML 幻灯片可视化编辑器</span>
      </header>

      {/* 主体 */}
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-8 pb-24 pt-10">
        {/* 标题区 */}
        <div className="mb-12 max-w-2xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900/60 px-4 py-1.5 text-xs text-ink-300">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-teal" />
            纯前端 · 无需安装 · 跨浏览器
          </div>
          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight text-ink-100">
            上传 HTML，
            <span className="bg-gradient-to-r from-amber to-teal bg-clip-text text-transparent">
              所见即所得
            </span>
            编辑幻灯片
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink-400">
            拖拽移动元素、调整样式、插入图片视频，或直接编辑源码。完成后覆盖保存或另存为新文件。
          </p>
        </div>

        {/* 上传区 */}
        <UploadZone onFile={handleFile} onSample={handleSample} />

        {/* 特性卡片 */}
        <div className="mt-16 grid w-full max-w-4xl grid-cols-3 gap-5">
          {[
            {
              icon: MousePointer2,
              title: "可视化编辑",
              desc: "拖拽移动、缩放、调整字体颜色，类 PPT 交互",
            },
            { icon: Code2, title: "代码编辑", desc: "Monaco 编辑器直接修改 HTML 源码" },
            {
              icon: Download,
              title: "灵活导出",
              desc: "覆盖原文件或另存为新文件，一键下载",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-ink-700 bg-ink-900/50 p-5 transition-colors hover:border-amber/30"
            >
              <f.icon className="mb-3 h-5 w-5 text-amber" strokeWidth={1.5} />
              <h3 className="mb-1 font-display text-sm font-semibold text-ink-100">
                {f.title}
              </h3>
              <p className="text-xs leading-relaxed text-ink-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
