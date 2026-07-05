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
    post({ type: 'select', id: el.getAttribute('data-eid'), tag: el.tagName.toLowerCase(), styles: readStyles(el) });
  }

  function deselect() {
    if (editing) return;
    selected = null;
    if (overlay) overlay.style.left = '-9999px';
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

  // 找到最高层（最接近 SLIDE）的可编辑祖先，避免选中 span/strong/em 等内联子元素导致拖拽时脱离文档流
  function findTopEditable(target) {
    var el = target.closest ? target.closest('[data-eid]') : null;
    if (!el || el === SLIDE) return null;
    var top = el;
    var p = el.parentElement;
    while (p && p !== SLIDE && p !== document.body && p.parentElement) {
      if (p.hasAttribute && p.hasAttribute('data-eid') && p !== SLIDE) {
        top = p;
      }
      p = p.parentElement;
    }
    return top === SLIDE ? null : top;
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
  function startDrag(e, el) {
    if (editing) return;
    if (!el) el = findTopEditable(e.target);
    if (!el || el === SLIDE) return;
    e.preventDefault();
    e.stopPropagation();
    selectEl(el);
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
    emitUpdate();
  }

  function endDrag() {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    if (dragState) {
      var wasActive = dragState.active;
      dragState = null;
      if (wasActive) {
        post({ type: 'end' });
      }
      if (selected) post({ type: 'select', id: selected.getAttribute('data-eid'), tag: selected.tagName.toLowerCase(), styles: readStyles(selected) });
    }
  }

  // ---- 缩放 ----
  var RESIZE_THRESHOLD = 3;
  var resizeState = null;
  function startResize(e) {
    if (!selected) return;
    e.preventDefault();
    e.stopPropagation();
    var dir = e.target.getAttribute('data-dir');
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
    emitUpdate();
  }

  function endResize() {
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', endResize);
    if (resizeState) {
      var wasActive = resizeState.active;
      resizeState = null;
      if (wasActive) {
        post({ type: 'end' });
      }
      if (selected) post({ type: 'select', id: selected.getAttribute('data-eid'), tag: selected.tagName.toLowerCase(), styles: readStyles(selected) });
    }
  }

  // ---- 内联文本编辑 ----
  function startEdit(e) {
    if (editing || !selected) return;
    var tag = selected.tagName.toLowerCase();
    if (['img','iframe','video'].indexOf(tag) >= 0) return;
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
    var el = findTopEditable(e.target);
    if (el) {
      startDrag(e, el);
    } else if (!e.target.closest('[data-dir]') && !e.target.hasAttribute('data-eid')) {
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

  window.addEventListener('scroll', positionOverlay, true);
  window.addEventListener('resize', positionOverlay);
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') deselect();
  });

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
