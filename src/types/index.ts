// 幻灯片文档数据模型
export interface SlideDocument {
  filename: string;
  head: string;
  bodyAttrs: string;
  slides: SlideNode[];
}

export interface SlideNode {
  id: string;
  index: number;
  tag: string;
  attrs: string;
  innerHTML: string;
}

// 编辑模式
export type EditMode = "visual" | "code";

// 选中元素的样式快照（由 iframe 回传）
export interface ElementStyle {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  textAlign: string;
  color: string;
  background: string;
  fontFamily: string;
}

// iframe ↔ 主框架通信协议
export type FrameMessage =
  | { type: "ready" }
  | { type: "select"; id: string | null; tag: string; styles: Partial<ElementStyle> }
  | { type: "update"; slideHTML: string }
  | { type: "dblclick"; id: string; text: string };

export type FrameCommand =
  | { type: "select"; id: string | null }
  | { type: "applyStyle"; id: string; styles: Record<string, string> }
  | { type: "insertHTML"; html: string }
  | { type: "delete"; id: string }
  | { type: "updateText"; id: string; text: string };
