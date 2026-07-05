import { useEffect, useRef, useState } from "react";
import type { FrameCommand } from "@/types";
import { useEditorStore } from "@/store/editorStore";
import { renderSlideForFrame } from "@/utils/slideParser";
import { EDITOR_SCRIPT } from "@/utils/editorScript";

interface CanvasProps {
  onReady: (send: (cmd: FrameCommand) => void) => void;
}

export default function Canvas({ onReady }: CanvasProps) {
  const idx = useEditorStore((s) => s.currentSlideIndex);
  const nonce = useEditorStore((s) => s.renderNonce);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [srcdoc, setSrcdoc] = useState("");
  const [zoom, setZoom] = useState(1);

  // 仅在离散事件时重算 srcdoc（renderNonce / 翻页时），拖拽过程中的实时更新不触发
  useEffect(() => {
    const doc = useEditorStore.getState().doc;
    if (!doc) return;
    setSrcdoc(renderSlideForFrame(doc, idx, EDITOR_SCRIPT));
  }, [idx, nonce]);

  // 监听 iframe 回传消息
  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      const data = ev.data;
      if (!data || data.source !== "slide-editor") return;
      const msg = data.payload;
      if (!msg) return;
      const s = useEditorStore.getState();
      switch (msg.type) {
        case "ready":
          break;
        case "select":
          s.selectElement(msg.id, msg.tag, msg.styles);
          break;
        case "begin":
          s.beginInteraction();
          break;
        case "update":
          s.updateSlideHTMLLive(msg.slideHTML);
          break;
        case "end":
          s.endInteraction();
          break;
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // 暴露发送函数
  useEffect(() => {
    const send = (cmd: FrameCommand) => {
      const win = iframeRef.current?.contentWindow;
      if (win) win.postMessage({ target: "slide-frame", payload: cmd }, "*");
    };
    onReady(send);
  }, [onReady, srcdoc]);

  const zoomIn = () => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)));

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-ink-950 bg-grid p-6">
      {/* 缩放控制 */}
      <div className="absolute right-6 top-6 z-10 flex items-center gap-1 rounded-lg border border-ink-700 bg-ink-900/80 px-1.5 py-1 backdrop-blur">
        <button
          onClick={zoomOut}
          className="flex h-7 w-7 items-center justify-center rounded text-ink-300 hover:bg-ink-700 hover:text-ink-100"
          aria-label="缩小"
        >
          <span className="text-base leading-none">−</span>
        </button>
        <span className="w-12 text-center text-xs tabular-nums text-ink-300">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={zoomIn}
          className="flex h-7 w-7 items-center justify-center rounded text-ink-300 hover:bg-ink-700 hover:text-ink-100"
          aria-label="放大"
        >
          <span className="text-base leading-none">+</span>
        </button>
      </div>

      {/* 16:9 舞台 */}
      <div
        className="relative shadow-panel"
        style={{
          width: 960 * zoom,
          height: 540 * zoom,
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left bg-white"
          style={{
            width: 960,
            height: 540,
            transform: `scale(${zoom})`,
          }}
        >
          <iframe
            ref={iframeRef}
            title="slide-canvas"
            srcDoc={srcdoc}
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-500">
        点击选中元素 · 拖拽移动 · 双击编辑文字 · 拖动手柄缩放
      </p>
    </div>
  );
}
