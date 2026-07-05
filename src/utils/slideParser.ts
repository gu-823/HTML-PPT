import type { SlideDocument, SlideNode } from "@/types";

// 生成唯一 ID
let idCounter = 0;
const uid = (prefix = "el") => `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

// 判断哪些元素是"幻灯片"
function selectSlides(body: HTMLElement): HTMLElement[] {
  // 优先：带有 .slide / [data-slide] / [role=slide] 的元素
  const direct = body.querySelectorAll(".slide, [data-slide], [role='slide']");
  if (direct.length > 0) return Array.from(direct) as HTMLElement[];

  // 其次：body 的直接 section 子元素
  const sections = Array.from(body.children).filter((c) => c.tagName.toLowerCase() === "section");
  if (sections.length > 0) return sections as HTMLElement[];

  // 最后：把整个 body 内容当作一页
  return [body];
}

// 提取元素属性字符串
function attrsToString(el: Element): string {
  return Array.from(el.attributes)
    .map((a) => `${a.name}="${a.value.replace(/"/g, "&quot;")}"`)
    .join(" ");
}

// 解析 HTML 文档为结构化数据
export function parseDocument(html: string, filename: string): SlideDocument {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // 提取 head
  const headEl = doc.head;
  const head = headEl ? headEl.innerHTML : "";

  // 提取 body 属性
  const bodyEl = doc.body;
  const bodyAttrs = bodyEl ? attrsToString(bodyEl) : "";

  // 提取幻灯片
  const slideEls = selectSlides(bodyEl || doc.createElement("body"));

  const slides: SlideNode[] = slideEls.map((el, index) => {
    // 确保元素有 id（用于选中定位）
    if (!el.id) el.id = uid("slide");
    return {
      id: el.id,
      index,
      tag: el.tagName.toLowerCase(),
      attrs: attrsToString(el),
      innerHTML: el.innerHTML,
    };
  });

  // 如果没有幻灯片（空文档），创建一个空白页
  if (slides.length === 0) {
    const id = uid("slide");
    slides.push({
      id,
      index: 0,
      tag: "section",
      attrs: `class="slide" id="${id}"`,
      innerHTML: "",
    });
  }

  return { filename, head, bodyAttrs, slides };
}

// 序列化回完整 HTML 文档
export function serializeDocument(doc: SlideDocument): string {
  const slidesHTML = doc.slides
    .map((s) => `<${s.tag} ${s.attrs}>${s.innerHTML}</${s.tag}>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
${doc.head}
</head>
<body${doc.bodyAttrs ? " " + doc.bodyAttrs : ""}>
${slidesHTML}
</body>
</html>`;
}

// 为 iframe 渲染单页：构建完整文档字符串
export function renderSlideForFrame(doc: SlideDocument, slideIndex: number, editorScript: string): string {
  const slide = doc.slides[slideIndex];
  if (!slide) return "";

  // 注入：原 head + 编辑器脚本 + 使 section 可定位
  const wrapperStyle = `
    <style data-editor="true">
      html, body { margin: 0; padding: 0; overflow: hidden; width: 100%; height: 100%; }
      [data-eid] { cursor: move; }
      ${slide.tag} { position: relative; width: 100%; height: 100%; overflow: hidden; box-sizing: border-box; }
    </style>
  `;

  // 为每个可编辑元素打上 data-eid
  const slideHTML = tagEditableElements(slide.innerHTML);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
${doc.head}
${wrapperStyle}
</head>
<body${doc.bodyAttrs ? " " + doc.bodyAttrs : ""}>
<${slide.tag} ${slide.attrs}>
${slideHTML}
</${slide.tag}>
<script>${editorScript}</script>
</body>
</html>`;
}

// 为可编辑文本/图片/视频元素打上 data-eid
const EDITABLE_TAGS = ["H1", "H2", "H3", "H4", "H5", "H6", "P", "SPAN", "DIV", "IMG", "LI", "UL", "OL", "BLOCKQUOTE", "IFRAME", "VIDEO", "A", "LABEL", "STRONG", "EM", "FIGURE", "TABLE"];
export function tagEditableElements(html: string): string {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const els = wrapper.querySelectorAll(EDITABLE_TAGS.join(","));
  els.forEach((el) => {
    if (!el.getAttribute("data-eid")) {
      el.setAttribute("data-eid", uid("el"));
    }
  });
  return wrapper.innerHTML;
}

export { uid };

// 为缩略图渲染单页预览（不含编辑器脚本）
export function renderSlidePreview(doc: SlideDocument, slideIndex: number): string {
  const slide = doc.slides[slideIndex];
  if (!slide) return "";
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<base target="_blank">
<style>html,body{margin:0;padding:0;overflow:hidden;}</style>
${doc.head}
</head>
<body>
<${slide.tag} ${slide.attrs}>
${slide.innerHTML}
</${slide.tag}>
</body>
</html>`;
}
