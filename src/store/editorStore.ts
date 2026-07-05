import { create } from "zustand";
import type { EditMode, ElementStyle, SlideDocument } from "@/types";
import { parseDocument, serializeDocument } from "@/utils/slideParser";

interface EditorState {
  // 文档
  doc: SlideDocument | null;
  filename: string;
  // 编辑状态
  currentSlideIndex: number;
  mode: EditMode;
  code: string;
  selectedId: string | null;
  selectedTag: string;
  selectedStyles: Partial<ElementStyle>;
  dirty: boolean;
  // 历史与交互
  past: string[];
  future: string[];
  interacting: boolean;
  // iframe 重载版本号：仅在离散事件时递增
  renderNonce: number;

  loadFromHtml: (html: string, filename: string) => void;
  setMode: (mode: EditMode) => void;
  setCode: (code: string) => void;
  applyCode: () => void;
  setCurrentSlide: (index: number) => void;
  selectElement: (id: string | null, tag: string, styles: Partial<ElementStyle>) => void;
  beginInteraction: () => void;
  updateSlideHTMLLive: (html: string) => void;
  endInteraction: () => void;
  setSelectedStyles: (styles: Partial<ElementStyle>) => void;
  bumpRender: () => void;
  undo: () => void;
  redo: () => void;
  exportHtml: () => string;
}

const snapshot = (doc: SlideDocument | null): string => (doc ? JSON.stringify(doc) : "");
const restore = (json: string): SlideDocument | null => {
  try {
    return JSON.parse(json) as SlideDocument;
  } catch {
    return null;
  }
};

export const useEditorStore = create<EditorState>((set, get) => ({
  doc: null,
  filename: "",
  currentSlideIndex: 0,
  mode: "visual",
  code: "",
  selectedId: null,
  selectedTag: "",
  selectedStyles: {},
  dirty: false,
  past: [],
  future: [],
  interacting: false,
  renderNonce: 0,

  loadFromHtml: (html, filename) => {
    const doc = parseDocument(html, filename);
    set({
      doc,
      filename,
      currentSlideIndex: 0,
      selectedId: null,
      selectedStyles: {},
      code: html,
      dirty: false,
      past: [],
      future: [],
      interacting: false,
      renderNonce: 1,
    });
  },

  setMode: (mode) => {
    const { doc } = get();
    if (mode === "code" && doc) {
      set({ mode, code: serializeDocument(doc), selectedId: null, selectedStyles: {} });
    } else {
      set((s) => ({ mode, selectedId: null, selectedStyles: {}, renderNonce: s.renderNonce + 1 }));
    }
  },

  setCode: (code) => set({ code }),

  applyCode: () => {
    const { code, filename, past, doc } = get();
    const newDoc = parseDocument(code, filename);
    set((s) => ({
      doc: newDoc,
      selectedId: null,
      selectedStyles: {},
      dirty: true,
      past: doc ? [...past.slice(-49), snapshot(doc)] : past,
      future: [],
      renderNonce: s.renderNonce + 1,
    }));
  },

  setCurrentSlide: (index) =>
    set((s) => ({
      currentSlideIndex: index,
      selectedId: null,
      selectedStyles: {},
      renderNonce: s.renderNonce + 1,
    })),

  selectElement: (id, tag, styles) =>
    set({ selectedId: id, selectedTag: tag, selectedStyles: styles }),

  beginInteraction: () => {
    const { interacting, doc, past } = get();
    if (interacting || !doc) return;
    set({
      interacting: true,
      past: [...past.slice(-49), snapshot(doc)],
      future: [],
    });
  },

  updateSlideHTMLLive: (html) => {
    const { doc, currentSlideIndex } = get();
    if (!doc) return;
    const slides = doc.slides.map((s, i) =>
      i === currentSlideIndex ? { ...s, innerHTML: html } : s,
    );
    set({ doc: { ...doc, slides }, dirty: true });
  },

  endInteraction: () => set({ interacting: false }),

  setSelectedStyles: (styles) =>
    set((state) => ({ selectedStyles: { ...state.selectedStyles, ...styles } })),

  bumpRender: () => set((s) => ({ renderNonce: s.renderNonce + 1 })),

  undo: () => {
    const { past, future, doc } = get();
    if (past.length === 0) return;
    const restored = restore(past[past.length - 1]);
    if (!restored) return;
    set((s) => ({
      doc: restored,
      past: past.slice(0, -1),
      future: doc ? [...future, snapshot(doc)] : future,
      selectedId: null,
      selectedStyles: {},
      dirty: true,
      renderNonce: s.renderNonce + 1,
    }));
  },

  redo: () => {
    const { past, future, doc } = get();
    if (future.length === 0) return;
    const restored = restore(future[future.length - 1]);
    if (!restored) return;
    set((s) => ({
      doc: restored,
      future: future.slice(0, -1),
      past: doc ? [...past, snapshot(doc)] : past,
      selectedId: null,
      selectedStyles: {},
      dirty: true,
      renderNonce: s.renderNonce + 1,
    }));
  },

  exportHtml: () => {
    const { doc } = get();
    return doc ? serializeDocument(doc) : "";
  },
}));
