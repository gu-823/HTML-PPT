// 注入到 iframe 内的编辑器脚本：实现元素选中、拖拽移动、缩放、内联文本编辑
// 通过 postMessage 与主框架通信
export const EDITOR_SCRIPT = `
(function () {
  var SLIDE = document.querySelector('section.slide, section, [data-slide]') || document.body.firstElementChild || document.body;
  var overlay = null;
  var handles = [];
  var selected = null;
  var editing = false;
  var rafPending = false;
  var lastHTML = '';

  function post(msg) {
    parent.postMessage({ source: 'slide-editor', payload: msg }, '*');
  }

  function throttle(fn) {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      fn();
    });
  }

  function readStyles(el) {
    var cs = getComputedStyle(el);
    var sr = SLIDE.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    return {
      x: Math.round(r.left - sr.left),
      y: Math.round(r.top - sr.top),
      width: Math.round(r.width),
      height: Math.round(r.height),
      fontSize: parseFloat(cs.fontSize) || 16,
      fontWeight: cs.fontWeight,
      fontStyle: cs.fontStyle,
      textDecoration: cs.textDecorationLine || cs.textDecoration,
      textAlign: cs.textAlign,
      color: rgbToHex(cs.color),
      background: rgbToHex(cs.backgroundColor),
      fontFamily: cs.fontFamily.split(',')[0].replace(/"/g, '')
    };
  }

  function rgbToHex(c) {
    if (!c || c === 'rgba(0, 0, 0, 0)' || c === 'transparent') return '';
    var m = c.match(/\\d+/g);
    if (!m) return c;
    return '#' + m.slice(0, 3).map(function (n) { return ('0' + parseInt(n, 10).toString(16)).slice(-2); }).join('');
  }

  function buildOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;pointer-events:none;z-index:99998;border:1.5px dashed #3DD6C8;';
    var dirs = [['nw','nwse-resize'],['n','ns-resize'],['ne','nesw-resize'],['e','ew-resize'],['se','nwse-resize'],['s','ns-resize'],['sw','nesw-resize'],['w','ew-resize']];
    dirs.forEach(function (d) {
      var h = document.createElement('div');
      h.setAttribute('data-dir', d[0]);
      h.style.cssText = 'position:absolute;width:11px;height:11px;background:#3DD6C8;border:1.5px solid #0E0E12;border-radius:3px;z-index:99999;pointer-events:auto;cursor:' + d[1] + ';box-shadow:0 2px 4px rgba(0,0,0,0.4);';
      h.addEventListener('mousedown', startResize);
      overlay.appendChild(h);
      handles.push(h);
    });
    document.body.appendChild(overlay);
  }

  function positionOverlay() {
    if (!overlay || !selected) return;
    var r = selected.getBoundingClientRect();
    overlay.style.left = (r.left - 5) + 'px';
    overlay.style.top = (r.top - 5) + 'px';
    overlay.style.width = (r.width + 10) + 'px';
    overlay.style.height = (r.height + 10) + 'px';
    var map = { nw: [0,0], n: [0.5,0], ne: [1,0], e: [1,0.5], se: [1,1], s: [0.5,1], sw: [0,1], w: [0,0.5] };
    handles.forEach(function (h) {
      var p = map[h.getAttribute('data-dir')];
      h.style.left = (p[0] * (r.width + 10) - 5) + 'px';
      h.style.top = (p[1] * (r.height + 10) - 5) + 'px';
    });
  }

  function selectEl(el) {
    selected = el;
    buildOverlay();
    positionOverlay();
    ensureGlassForSelected();
    post({ type: 'select', id: el.getAttribute('data-eid'), tag: el.tagName.toLowerCase(), styles: readStyles(el) });
  }

  function deselect() {
    if (editing) return;
    selected = null;
    if (overlay) overlay.style.left = '-9999px';
    removeGlass();
    post({ type: 'select', id: null, tag: '', styles: {} });
  }

  function makeAbsolute(el) {
    if (getComputedStyle(el).position === 'absolute') return;
    var tag = el.tagName.toLowerCase();
    var replaced = ['img','iframe','video','canvas','svg'].indexOf(tag) >= 0;
    var sr = SLIDE.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    var cs = getComputedStyle(el);
    el.style.position = 'absolute';
    el.style.left = Math.round(r.left - sr.left) + 'px';
    el.style.top = Math.round(r.top - sr.top) + 'px';
    if (replaced || (cs.width && cs.width !== 'auto' && cs.width !== '0px')) {
      el.style.width = Math.round(r.width) + 'px';
    }
    if (replaced || (cs.height && cs.height !== 'auto' && cs.height !== '0px')) {
      el.style.height = Math.round(r.height) + 'px';
    }
  }

  function isEditable(el) {
    return el && el !== SLIDE && el.closest && el.closest('[data-eid]') === el && el.hasAttribute && el.hasAttribute('data-eid');
  }

  // 判断是否是需要“视为整体”的替换元素
  function isReplacedElement(el) {
    if (!el) return false;
    var tag = el.tagName.toLowerCase();
    return ['img','iframe','video','canvas','svg','audio','embed','object'].indexOf(tag) >= 0;
  }

  // 判断是否是内联文本子元素（选中它们会破坏文本流）
  function isInlineTextElement(el) {
    if (!el) return false;
    var tag = el.tagName.toLowerCase();
    return ['span','strong','em','b','i','a','small','label','sub','sup','code'].indexOf(tag) >= 0;
  }

  // 判断元素是否是“容器型”元素（div/section 等）
  function isContainer(el) {
    if (!el) return false;
    var tag = el.tagName.toLowerCase();
    return ['div','section','article','aside','header','footer','main','nav','figure','li','td','th'].indexOf(tag) >= 0;
  }

  // 判断元素是否是块级文本元素
  function isBlockTextElement(el) {
    if (!el) return false;
    var tag = el.tagName.toLowerCase();
    return ['h1','h2','h3','h4','h5','h6','p','blockquote'].indexOf(tag) >= 0;
  }

  // 找到合适的可编辑元素：
  // - 点击替换元素（video/iframe/img）本身时，选中它自己
  // - 点击块级文本元素（h1-h6/p/blockquote）本身时，选中它自己，允许独立移动
  // - 点击内联文本子元素时，向上找到最近的块级可编辑容器
  function findTopEditable(target) {
    var el = target.closest ? target.closest('[data-eid]') : null;
    if (!el || el === SLIDE) return null;

    // 替换元素直接返回自身，便于拖拽/缩放
    if (isReplacedElement(el)) return el;

    // 块级文本元素直接返回自身，方便单独移动小标题/段落
    if (isBlockTextElement(el)) return el;

    // 如果当前元素是内联文本，向上找最近的块级/容器可编辑祖先
    if (isInlineTextElement(el)) {
      var p = el.parentElement;
      while (p && p !== SLIDE && p !== document.body) {
        if (p.hasAttribute && p.hasAttribute('data-eid')) return p;
        p = p.parentElement;
      }
      return el;
    }

    return el;
  }

  function emitUpdate() {
    throttle(function () {
      var html = SLIDE.innerHTML;
      if (html === lastHTML) return;
      lastHTML = html;
      post({ type: 'update', slideHTML: html });
      if (selected) positionOverlay();
    });
  }

  // ---- 拖拽移动 ----
  var DRAG_THRESHOLD = 5;
  var dragState = null;
  var interactionGlass = null;

  // 在 iframe/video 等替换元素上盖一个透明玻璃层，接管鼠标事件。
  // 原因：跨域 iframe 一旦收到 mousedown，后续 mousemove/mouseup 会被 iframe 吞掉，父文档收不到。
  // 因此必须在父文档里放一个 div 盖在上面，让所有鼠标事件都在父文档的这个 div 上发生。
  function attachGlass(el) {
    removeGlass();
    if (!el) return;
    if (!isReplacedElement(el)) return;
    var r = el.getBoundingClientRect();
    var glass = document.createElement('div');
    glass.setAttribute('data-editor-glass', '1');
    glass.style.cssText = 'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;background:transparent;z-index:99997;cursor:move;';
    document.body.appendChild(glass);
    interactionGlass = glass;
  }
  function removeGlass() {
    if (interactionGlass && interactionGlass.parentNode) {
      interactionGlass.parentNode.removeChild(interactionGlass);
    }
    interactionGlass = null;
  }
  // 选中替换元素时也覆盖一层玻璃，保证点击/拖拽/缩放都能在父文档处理
  function ensureGlassForSelected() {
    if (selected && isReplacedElement(selected)) {
      attachGlass(selected);
    } else {
      removeGlass();
    }
  }

  function startDrag(e, el) {
    if (editing) return;
    if (!el) el = findTopEditable(e.target);
    if (!el || el === SLIDE) return;
    e.preventDefault();
    e.stopPropagation();
    selectEl(el);
    // 立即在替换元素上盖玻璃层，抢在浏览器把事件交给 iframe 之前
    if (isReplacedElement(el)) attachGlass(el);
    dragState = {
      startX: e.clientX, startY: e.clientY,
      origLeft: 0, origTop: 0,
      active: false
    };
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
  }

  function onDrag(e) {
    if (!dragState || !selected) return;
    var dx = e.clientX - dragState.startX;
    var dy = e.clientY - dragState.startY;
    if (!dragState.active) {
      if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
      if (getComputedStyle(selected).position !== 'absolute') {
        makeAbsolute(selected);
      }
      var sr = SLIDE.getBoundingClientRect();
      var r0 = selected.getBoundingClientRect();
      dragState.origLeft = Math.round(r0.left - sr.left);
      dragState.origTop = Math.round(r0.top - sr.top);
      dragState.startX = e.clientX;
      dragState.startY = e.clientY;
      dragState.active = true;
      post({ type: 'begin' });
      return;
    }
    selected.style.left = (dragState.origLeft + (e.clientX - dragState.startX)) + 'px';
    selected.style.top = (dragState.origTop + (e.clientY - dragState.startY)) + 'px';
    positionOverlay();
    // 拖拽过程中保持玻璃层与选中元素位置对齐
    if (interactionGlass && isReplacedElement(selected)) {
      var rr = selected.getBoundingClientRect();
      interactionGlass.style.left = rr.left + 'px';
      interactionGlass.style.top = rr.top + 'px';
      interactionGlass.style.width = rr.width + 'px';
      interactionGlass.style.height = rr.height + 'px';
    }
    emitUpdate();
  }

  function endDrag() {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    if (dragState) {
      var wasActive = dragState.active;
      var el = selected;
      dragState = null;
      if (wasActive) {
        post({ type: 'end' });
      }
      if (el) {
        post({ type: 'select', id: el.getAttribute('data-eid'), tag: el.tagName.toLowerCase(), styles: readStyles(el) });
      }
    }
    // 拖拽结束后保留玻璃层（选中态下仍需要），由 selectEl/deselect 决定是否保留
    ensureGlassForSelected();
  }

  // ---- 缩放 ----
  var RESIZE_THRESHOLD = 3;
  var resizeState = null;
  function startResize(e) {
    if (!selected) return;
    e.preventDefault();
    e.stopPropagation();
    var dir = e.target.getAttribute('data-dir');
    // 缩放时确保替换元素上有玻璃层
    if (isReplacedElement(selected)) attachGlass(selected);
    resizeState = {
      dir: dir, startX: e.clientX, startY: e.clientY,
      left: 0, top: 0, width: 0, height: 0,
      active: false
    };
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', endResize);
  }

  function onResize(e) {
    if (!resizeState || !selected) return;
    var dx = e.clientX - resizeState.startX;
    var dy = e.clientY - resizeState.startY;
    if (!resizeState.active) {
      if (dx * dx + dy * dy < RESIZE_THRESHOLD * RESIZE_THRESHOLD) return;
      if (getComputedStyle(selected).position !== 'absolute') {
        makeAbsolute(selected);
      }
      var sr2 = SLIDE.getBoundingClientRect();
      var r2 = selected.getBoundingClientRect();
      resizeState.left = Math.round(r2.left - sr2.left);
      resizeState.top = Math.round(r2.top - sr2.top);
      resizeState.width = r2.width;
      resizeState.height = r2.height;
      resizeState.startX = e.clientX;
      resizeState.startY = e.clientY;
      resizeState.active = true;
      post({ type: 'begin' });
      return;
    }
    var ddx = e.clientX - resizeState.startX;
    var ddy = e.clientY - resizeState.startY;
    var d = resizeState.dir;
    var nw = resizeState.width, nh = resizeState.height, nl = resizeState.left, nt = resizeState.top;
    if (d.indexOf('e') >= 0) nw = Math.max(20, resizeState.width + ddx);
    if (d.indexOf('s') >= 0) nh = Math.max(20, resizeState.height + ddy);
    if (d.indexOf('w') >= 0) { nw = Math.max(20, resizeState.width - ddx); nl = resizeState.left + ddx; }
    if (d.indexOf('n') >= 0) { nh = Math.max(20, resizeState.height - ddy); nt = resizeState.top + ddy; }
    selected.style.width = Math.round(nw) + 'px';
    selected.style.height = Math.round(nh) + 'px';
    selected.style.left = Math.round(nl) + 'px';
    selected.style.top = Math.round(nt) + 'px';
    positionOverlay();
    // 缩放过程中同步玻璃层位置尺寸
    if (interactionGlass && isReplacedElement(selected)) {
      var rr = selected.getBoundingClientRect();
      interactionGlass.style.left = rr.left + 'px';
      interactionGlass.style.top = rr.top + 'px';
      interactionGlass.style.width = rr.width + 'px';
      interactionGlass.style.height = rr.height + 'px';
    }
    emitUpdate();
  }

  function endResize() {
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', endResize);
    if (resizeState) {
      var wasActive = resizeState.active;
      var el = selected;
      resizeState = null;
      if (wasActive) {
        post({ type: 'end' });
      }
      if (el) {
        post({ type: 'select', id: el.getAttribute('data-eid'), tag: el.tagName.toLowerCase(), styles: readStyles(el) });
      }
    }
    ensureGlassForSelected();
  }

  // ---- 内联文本编辑 ----
  function startEdit(e) {
    if (editing || !selected) return;
    if (isReplacedElement(selected)) return;
    e.preventDefault();
    e.stopPropagation();
    editing = true;
    selected.setAttribute('contenteditable', 'true');
    selected.focus();
    document.execCommand('selectAll', false, null);
    var onBlur = function () {
      selected.removeAttribute('contenteditable');
      selected.removeEventListener('blur', onBlur);
      editing = false;
      post({ type: 'begin' });
      post({ type: 'update', slideHTML: SLIDE.innerHTML });
      post({ type: 'end' });
      lastHTML = SLIDE.innerHTML;
      post({ type: 'select', id: selected.getAttribute('data-eid'), tag: selected.tagName.toLowerCase(), styles: readStyles(selected) });
    };
    selected.addEventListener('blur', onBlur);
  }

  // ---- 事件绑定 ----
  document.addEventListener('mousedown', function (e) {
    // 如果点击了玻璃层（覆盖在 iframe/video 上的透明代理），视为点击了当前选中的替换元素
    if (e.target === interactionGlass && selected) {
      startDrag(e, selected);
      return;
    }
    // 点击 resize 手柄，不做任何处理（startResize 在手柄自身的 mousedown 绑定中触发）
    if (e.target.getAttribute && e.target.getAttribute('data-dir')) {
      return;
    }
    var el = findTopEditable(e.target);
    if (el) {
      startDrag(e, el);
    } else if (!e.target.hasAttribute('data-eid')) {
      deselect();
    }
  });

  document.addEventListener('dblclick', function (e) {
    var el = findTopEditable(e.target);
    if (el) {
      selectEl(el);
      startEdit(e);
    }
  });

  window.addEventListener('scroll', function () { positionOverlay(); syncGlass(); }, true);
  window.addEventListener('resize', function () { positionOverlay(); syncGlass(); });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') deselect();
  });

  function syncGlass() {
    if (interactionGlass && selected && isReplacedElement(selected)) {
      var rr = selected.getBoundingClientRect();
      interactionGlass.style.left = rr.left + 'px';
      interactionGlass.style.top = rr.top + 'px';
      interactionGlass.style.width = rr.width + 'px';
      interactionGlass.style.height = rr.height + 'px';
    }
  }

  // ---- 接收主框架指令 ----
  window.addEventListener('message', function (ev) {
    var data = ev.data;
    if (!data || data.target !== 'slide-frame') return;
    var cmd = data.payload;
    if (!cmd) return;
    if (cmd.type === 'select') {
      if (!cmd.id) { deselect(); return; }
      var el = SLIDE.querySelector('[data-eid="' + cssEscape(cmd.id) + '"]');
      if (el) selectEl(el);
    } else if (cmd.type === 'applyStyle') {
      var t = SLIDE.querySelector('[data-eid="' + cssEscape(cmd.id) + '"]');
      if (!t) return;
      var needsAbs = false;
      Object.keys(cmd.styles).forEach(function (k) {
        if (['left','top','width','height'].indexOf(k) >= 0) needsAbs = true;
      });
      if (needsAbs && getComputedStyle(t).position !== 'absolute') {
        makeAbsolute(t);
      }
      Object.keys(cmd.styles).forEach(function (k) { t.style[k] = cmd.styles[k]; });
      if (selected === t) positionOverlay();
      lastHTML = SLIDE.innerHTML;
      post({ type: 'begin' });
      post({ type: 'update', slideHTML: SLIDE.innerHTML });
      post({ type: 'end' });
      post({ type: 'select', id: t.getAttribute('data-eid'), tag: t.tagName.toLowerCase(), styles: readStyles(t) });
    } else if (cmd.type === 'insertHTML') {
      SLIDE.insertAdjacentHTML('beforeend', cmd.html);
      lastHTML = SLIDE.innerHTML;
      post({ type: 'begin' });
      post({ type: 'update', slideHTML: SLIDE.innerHTML });
      post({ type: 'end' });
    } else if (cmd.type === 'delete') {
      var del = SLIDE.querySelector('[data-eid="' + cssEscape(cmd.id) + '"]');
      if (del) {
        del.remove();
        selected = null;
        if (overlay) overlay.style.left = '-9999px';
        lastHTML = SLIDE.innerHTML;
        post({ type: 'begin' });
        post({ type: 'update', slideHTML: SLIDE.innerHTML });
        post({ type: 'end' });
        post({ type: 'select', id: null, tag: '', styles: {} });
      }
    } else if (cmd.type === 'updateText') {
      var te = SLIDE.querySelector('[data-eid="' + cssEscape(cmd.id) + '"]');
      if (te) {
        te.textContent = cmd.text;
        lastHTML = SLIDE.innerHTML;
        post({ type: 'begin' });
        post({ type: 'update', slideHTML: SLIDE.innerHTML });
        post({ type: 'end' });
        post({ type: 'select', id: te.getAttribute('data-eid'), tag: te.tagName.toLowerCase(), styles: readStyles(te) });
      }
    }
  });

  function cssEscape(s) {
    return String(s).replace(/["\\\\]/g, '\\\\$&');
  }

  post({ type: 'ready' });
})();
`;
