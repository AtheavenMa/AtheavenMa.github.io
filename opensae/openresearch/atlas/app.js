/* OpenResearch Atlas: centered, source-backed trees with node focus navigation. */
(function () {
  "use strict";

  const DATA = window.OPENRESEARCH_ATLAS || {};
  const VIEWS = {
    core: { root: "q.research", primary: ["refines", "addresses", "decomposes"] },
    knowledge: { root: "q.cub.train", primary: ["refines", "addresses", "decomposes"] },
    code: { root: "code:root", primary: ["contains"] },
    environment: { root: "env:root", primary: ["contains"] },
    glossary: { root: "glossary:root", primary: ["contains"] }
  };
  const STATES = {
    planned: "#98a0ae",
    partial: "#d8a348",
    implemented: "#558da6",
    verified: "#479477",
    blocked: "#bf7272",
    observed: "#479477",
    synthetic: "#98a0ae"
  };
  const PALETTE = {
    root: "#e0e4e9", question: "#e6eaef", solve: "#f1f3f5",
    goal: "#fbfcfd", group: "#e8ebef", term: "#fbfcfd",
    module: "#f4f5f6", class: "#edf0f3", method: "#fcfcfc",
    function: "#fafbfc", device: "#f7f8fa", capability: "#fcfcfc"
  };

  const $ = id => document.getElementById(id);
  const config = {
    view: document.body?.dataset?.atlasView || "core",
    focusId: null,
    mode: "overview",
    expanded: new Set(),
    query: "",
    zoom: 1,
    outlineOpen: false,
    detailsOpen: false,
    diff: null,
    positions: new Map(),
    scene: { width: 700, height: 440 },
    visible: []
  };
  let parents = new Map(), children = new Map(), byId = new Map();
  let rootIds = [];
  let lastViewport = { width: 0, height: 0 };

  function el(tag, className, value) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (value !== undefined) item.textContent = String(value);
    return item;
  }
  function svg(tag, attrs, text) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attrs || {})) node.setAttribute(key, String(value));
    if (text !== undefined) node.textContent = String(text);
    return node;
  }
  function kind(node) { return node?.kind || node?.type || "goal"; }
  function graph() { return DATA[config.view] || { nodes: [], edges: [], gates: [] }; }
  function gate(id) { return (graph().gates || []).find(x => x.parent === id); }
  function plain(text) {
    return String(text || "").replace(/^\s*(问题|方案|目标|定义|现状)[:：]\s*/, "").replace(/\s+/g, " ").trim();
  }
  function matches(node) {
    const q = config.query.trim().toLocaleLowerCase();
    return !q || [node.id, node.title, node.description, node.signature, node.path,
      ...(node.aliases || []), ...(node.term_ids || []), ...(node.context_ids || [])]
      .join(" ").toLocaleLowerCase().includes(q);
  }
  function order(a, b) {
    const weights = { question: 0, solve: 1, goal: 2, root: 0,
      group: 1, module: 2, class: 3, function: 4, method: 5, term: 3 };
    return (weights[kind(a)] ?? 6) - (weights[kind(b)] ?? 6)
      || String(a.title).localeCompare(String(b.title), "zh");
  }
  function rebuildHierarchy() {
    byId = new Map((graph().nodes || []).map(n => [n.id, n]));
    parents = new Map(); children = new Map();
    for (const edge of graph().edges || []) {
      if (!VIEWS[config.view].primary.includes(edge.type)) continue;
      if (!byId.has(edge.source) || !byId.has(edge.target) || parents.has(edge.target)) continue;
      parents.set(edge.target, edge.source);
      if (!children.has(edge.source)) children.set(edge.source, []);
      children.get(edge.source).push(edge.target);
    }
    for (const siblings of children.values()) siblings.sort((a, b) => order(byId.get(a), byId.get(b)));
    const preferred = VIEWS[config.view].root;
    rootIds = byId.has(preferred) ? [preferred] : [...byId.keys()].filter(id => !parents.has(id));
  }
  function ancestors(id) {
    const result = []; const seen = new Set();
    let cursor = id;
    while (byId.has(cursor) && !seen.has(cursor) && result.length <= 16) {
      seen.add(cursor); result.push(cursor);
      cursor = parents.get(cursor);
    }
    return result.reverse();
  }
  function initialExpanded() {
    const result = new Set(rootIds);
    if (["core", "knowledge"].includes(config.view)) {
      for (const id of rootIds) for (const c of children.get(id) || []) result.add(c);
    }
    if (config.view === "environment") {
      for (const n of byId.values()) if (kind(n) === "group") result.add(n.id);
    }
    return result;
  }
  function getSearchFocus() {
    const raw = (window.location?.search || "").match(/[?&]focus=([^&]+)/);
    if (!raw) return null;
    try { return decodeURIComponent(raw[1].replace(/\+/g, "%20")); }
    catch (_) { return null; }
  }
  function setAddress(focusId, replace) {
    if (!window.history?.pushState || !window.location?.pathname) return;
    const path = window.location.pathname;
    const url = focusId ? path + "?focus=" + encodeURIComponent(focusId) : path;
    try {
      window.history[replace ? "replaceState" : "pushState"](
        { view: config.view, focusId: focusId || null }, "", url
      );
    } catch (_) { /* file:// mode may reject history; still allow local navigation */ }
  }
  function locateView(id) {
    if (byId.has(id)) return config.view;
    for (const key of Object.keys(VIEWS)) {
      if ((DATA[key]?.nodes || []).some(n => n.id === id)) return key;
    }
    return null;
  }
  function navigate(id, view, replace) {
    const target = view || locateView(id);
    if (!target || !(DATA[target]?.nodes || []).some(n => n.id === id)) return false;
    if (target !== config.view) {
      if (window.location) window.location.href = target + ".html?focus=" + encodeURIComponent(id);
      return true;
    }
    config.mode = "focus";
    config.focusId = id;
    config.query = "";
    $("search").value = "";
    config.outlineOpen = false;
    config.detailsOpen = false;
    setAddress(id, !!replace);
    render(true);
    return true;
  }
  function overview(push) {
    config.mode = "overview"; config.focusId = null; config.query = "";
    config.detailsOpen = false; config.zoom = 1;
    $("search").value = "";
    if (push) setAddress(null, false);
    render(true);
  }
  function openCross(id) { navigate(id, locateView(id), false); }
  function init() {
    if (!VIEWS[config.view] || !DATA[config.view]) config.view = "core";
    rebuildHierarchy();
    config.expanded = initialExpanded();
    const deep = getSearchFocus();
    if (deep && byId.has(deep)) {
      config.mode = "focus"; config.focusId = deep;
    }
    bind();
    render(true);
  }

  // SVG text wrapping uses a conservative display-width estimate for CJK and Latin.
  function charWidth(character, fontSize) {
    const code = character.codePointAt(0) || 0;
    if (code >= 0x2e80 || code >= 0x1100 && code <= 0x11ff) return fontSize;
    if (character === " ") return fontSize * .30;
    if ("il.,:;'!|".includes(character)) return fontSize * .32;
    if ("MW@%".includes(character)) return fontSize * .83;
    return fontSize * .56;
  }
  function wrap(text, width, fontSize, maxLines) {
    const chars = Array.from(plain(text));
    if (!chars.length) return [];
    const lines = []; let line = "", used = 0, at = 0;
    while (at < chars.length && lines.length < maxLines) {
      const ch = chars[at], w = charWidth(ch, fontSize);
      if (line && used + w > width) {
        lines.push(line.trim()); line = ""; used = 0;
      } else {
        line += ch; used += w; at++;
      }
    }
    if (line && lines.length < maxLines) lines.push(line.trim());
    if (at < chars.length && lines.length) {
      const i = lines.length - 1;
      lines[i] = lines[i].replace(/.{1,2}$/u, "") + "…";
    }
    return lines;
  }
  function measure(node, focused) {
    const w = focused ? 320 : 270;
    const title = wrap(node.title || node.id, gate(node.id) ? w - 93 : w - 45, focused ? 15 : 13.5, focused ? 3 : 2);
    const body = wrap(node.summary || node.description, w - 42, focused ? 12.4 : 11.8, focused ? 7 : 4);
    const height = Math.max(85, 22 + title.length * (focused ? 21 : 19)
      + (body.length ? 10 + body.length * (focused ? 19 : 17) : 0) + 18);
    return { w, h: height, title, body };
  }
  function visibleOverview() {
    const needed = new Set();
    if (config.query.trim()) {
      for (const n of byId.values()) if (matches(n)) {
        for (const id of ancestors(n.id)) needed.add(id);
      }
    }
    const seen = new Set(), list = [];
    function visit(id, depth) {
      if (!byId.has(id) || seen.has(id) || depth > 13) return;
      if (config.query && !needed.has(id)) return;
      seen.add(id); list.push({ id, depth, role: "overview" });
      if (config.query || config.expanded.has(id)) {
        for (const child of children.get(id) || []) visit(child, depth + 1);
      }
    }
    for (const id of rootIds) visit(id, 0);
    return list;
  }

  function layoutOverview() {
    const visible = visibleOverview();
    const allowed = new Set(visible.map(v => v.id));
    const sizes = new Map(), blocks = new Map(), positions = new Map();
    const VERTICAL_GAP = 18, HORIZONTAL_GAP = 56, ORIGIN_X = 30;
    function height(id) {
      if (blocks.has(id)) return blocks.get(id);
      const kids = (children.get(id) || []).filter(x => allowed.has(x));
      let total = kids.reduce((sum, child) => sum + height(child), 0)
        + Math.max(0, kids.length - 1) * VERTICAL_GAP;
      const own = sizes.get(id) || measure(byId.get(id), false);
      sizes.set(id, own);
      const result = Math.max(own.h, total);
      blocks.set(id, result);
      return result;
    }
    function place(id, depth, top) {
      const size = sizes.get(id), block = blocks.get(id);
      const centerY = top + block / 2;
      positions.set(id, { x: ORIGIN_X + depth * (270 + HORIZONTAL_GAP),
        y: centerY - size.h / 2, ...size, depth });
      const kids = (children.get(id) || []).filter(x => allowed.has(x));
      const total = kids.reduce((sum, child) => sum + blocks.get(child), 0)
        + Math.max(0, kids.length - 1) * VERTICAL_GAP;
      let childTop = top + (block - total) / 2;
      for (const child of kids) {
        place(child, depth + 1, childTop);
        childTop += blocks.get(child) + VERTICAL_GAP;
      }
    }
    let y = 34;
    for (const id of rootIds) if (allowed.has(id)) {
      const h = height(id); place(id, 0, y); y += h + 28;
    }
    return { visible, positions };
  }

  function layoutFocus() {
    const id = config.focusId;
    if (!byId.has(id)) return layoutOverview();
    const chain = ancestors(id);
    const ancestorsShown = chain.slice(Math.max(0, chain.length - 3), -1);
    const kids = (children.get(id) || []).filter(x => byId.has(x));
    const ids = [...ancestorsShown, id, ...kids];
    const positions = new Map();
    const horizontalGap = 58, xStart = 30;
    const focusSize = measure(byId.get(id), true);
    const childSizes = kids.map(k => measure(byId.get(k), false));
    const childTotal = childSizes.reduce((sum, s) => sum + s.h, 0)
      + Math.max(0, childSizes.length - 1) * 20;
    const center = 38 + Math.max(focusSize.h, childTotal) / 2;
    const depthOffset = ancestorsShown.length;
    const ownX = xStart + depthOffset * (270 + horizontalGap);
    positions.set(id, { x: ownX, y: center - focusSize.h / 2,
      ...focusSize, depth: depthOffset, role: "focus" });
    ancestorsShown.forEach((key, i) => {
      const size = measure(byId.get(key), false);
      positions.set(key, { x: xStart + i * (270 + horizontalGap),
        y: center - size.h / 2, ...size, depth: i, role: "ancestor" });
    });
    let y = center - childTotal / 2;
    kids.forEach((child, index) => {
      const size = childSizes[index];
      positions.set(child, { x: ownX + focusSize.w + horizontalGap,
        y, ...size, depth: depthOffset + 1, role: "child" });
      y += size.h + 20;
    });
    return { visible: ids.map(key => ({
      id: key, depth: positions.get(key).depth, role: positions.get(key).role
    })), positions };
  }
  function normalizeLayout(layout) {
    let maxX = 0, maxY = 0;
    for (const p of layout.positions.values()) {
      maxX = Math.max(maxX, p.x + p.w); maxY = Math.max(maxY, p.y + p.h);
    }
    return { ...layout, width: Math.max(600, maxX + 35),
      height: Math.max(300, maxY + 35) };
  }
  function textLines(group, lines, x, startY, lineHeight, className) {
    for (let i = 0; i < lines.length; i++) {
      group.appendChild(svg("text", { x, y: startY + i * lineHeight,
        class: className }, lines[i]));
    }
  }
  function gateLabel(id) {
    const item = gate(id);
    return item ? item.operator : null;
  }
  function drawCard(node, p, layer, positions, focus) {
    const k = kind(node), chosen = focus && node.id === config.focusId;
    const classes = ["graph-node", "node-" + k, chosen ? "node-selected" : "",
      config.diff && config.view === "code" &&
        (config.diff.added_ids || []).includes(node.id) ? "node-added" : "",
      config.diff && config.view === "code" &&
        (config.diff.changed || []).some(x => x.id === node.id) ? "node-changed" : ""
    ].filter(Boolean).join(" ");
    const card = svg("g", {
      class: classes, transform: "translate(" + p.x + "," + p.y + ")",
      role: "button", tabindex: "0",
      "aria-label": node.title + ": " + plain(node.description || ""),
      "data-node-id": node.id, "data-status": node.status || "unknown"
    });
    card.appendChild(svg("title", {}, (node.title || "") +
      (node.status ? " — " + node.status : "") + ". " + plain(node.description || "")));
    card.appendChild(svg("rect", {
      class: "node-surface", rx: 10, width: p.w, height: p.h,
      fill: PALETTE[k] || "#fbfbfc"
    }));
    const status = STATES[node.status];
    if (status) card.appendChild(svg("rect", {
      class: "node-status", rx: 2, x: 0, y: 9,
      width: 4, height: p.h - 18, fill: status
    }));
    const titleX = 17, top = 23, titleFont = chosen ? 15 : 13.5;
    textLines(card, p.title, titleX, top, chosen ? 21 : 19, "node-title");
    if (p.body.length) {
      const contentY = top + p.title.length * (chosen ? 21 : 19) + 7;
      textLines(card, p.body, titleX, contentY, chosen ? 19 : 17, "node-description");
    }
    const mark = gateLabel(node.id);
    if (mark) {
      const label = svg("g", { class: "gate-mark" });
      label.appendChild(svg("rect", {
        x: p.w - 47, y: 10, width: 36, height: 21, rx: 7
      }));
      label.appendChild(svg("text", {
        x: p.w - 29, y: 24, "text-anchor": "middle", class: "gate-text"
      }, mark));
      card.appendChild(label);
    }
    const count = (children.get(node.id) || []).length;
    if (count) {
      const label = svg("g", { class: "child-count", "aria-hidden": "true" });
      label.appendChild(svg("rect", {
        x: p.w - 41, y: p.h - 25, width: 29, height: 18, rx: 9
      }));
      label.appendChild(svg("text", {
        x: p.w - 26.5, y: p.h - 12, "text-anchor": "middle"
      }, String(count)));
      card.appendChild(label);
    }
    const onOpen = () => navigate(node.id, config.view, false);
    card.addEventListener("click", onOpen);
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault(); onOpen();
      }
    });
    layer.appendChild(card);
  }

  function drawSVG(layout) {
    const drawing = $("diagram");
    drawing.replaceChildren();
    const lines = svg("g", { class: "edges" });
    const cards = svg("g", { class: "cards" });
    const position = layout.positions;
    function link(source, target, secondary) {
      const a = position.get(source), b = position.get(target);
      if (!a || !b) return;
      const x1 = a.x + a.w, x2 = b.x;
      const y1 = a.y + a.h / 2, y2 = b.y + b.h / 2;
      if (x2 <= x1) return;
      const mid = (x1 + x2) / 2;
      lines.appendChild(svg("path", {
        class: secondary ? "edge-dependency" : "edge-main",
        d: "M " + x1 + " " + y1 + " C " + mid + " " + y1 +
          ", " + mid + " " + y2 + ", " + x2 + " " + y2
      }));
    }
    for (const item of layout.visible) {
      const p = parents.get(item.id);
      if (p) link(p, item.id, false);
    }
    if (config.mode === "focus") {
      for (const e of graph().edges || []) {
        if (["depends_on", "informed_by"].includes(e.type) &&
            position.has(e.source) && position.has(e.target)) link(e.source, e.target, true);
      }
    }
    for (const item of layout.visible) {
      const n = byId.get(item.id), p = position.get(item.id);
      if (n && p) drawCard(n, p, cards, position, config.mode === "focus");
    }
    drawing.append(lines, cards);
    drawing.setAttribute("viewBox", "0 0 " + layout.width + " " + layout.height);
    config.positions = position;
    config.scene = { width: layout.width, height: layout.height };
  }
  function fitZoom() {
    const v = $("canvasWrap");
    const w = Number(v.clientWidth) || 1150;
    const h = Number(v.clientHeight) || 630;
    const { width, height } = config.scene;
    const a = (w - 56) / width, b = (h - 48) / height;
    return Math.max(0.62, Math.min(config.mode === "focus" ? 1.10 : 1.02, a, b));
  }
  function centerSelected() {
    const v = $("canvasWrap");
    const p = config.positions.get(config.focusId);
    if (!p) return;
    const width = Number(v.clientWidth) || 1150;
    const height = Number(v.clientHeight) || 630;
    const x = config.zoom * (p.x + p.w / 2) - width / 2;
    const y = config.zoom * (p.y + p.h / 2) - height / 2;
    if (typeof v.scrollTo === "function") {
      v.scrollTo({ left: Math.max(0, x), top: Math.max(0, y),
        behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth" });
    }
  }
  function setScale() {
    const drawing = $("diagram");
    drawing.setAttribute("width", Math.round(config.scene.width * config.zoom));
    drawing.setAttribute("height", Math.round(config.scene.height * config.zoom));
    $("zoomValue").textContent = Math.round(config.zoom * 100) + "%";
  }
  function rowButton(id, label, indent) {
    const button = el("button", "outline-item" +
      (config.focusId === id ? " selected" : ""), label);
    button.style.paddingLeft = (13 + indent * 12) + "px";
    button.title = byId.get(id)?.description || label;
    button.addEventListener("click", () => navigate(id, config.view, false));
    return button;
  }
  function renderOutline() {
    const output = $("outline");
    output.replaceChildren();
    const list = visibleOverview();
    if (config.mode === "focus" && config.focusId) {
      const path = ancestors(config.focusId);
      const ids = new Set([...path, ...(children.get(config.focusId) || [])]);
      for (const id of ids) output.appendChild(rowButton(id, byId.get(id).title,
        Math.min(4, path.indexOf(id) >= 0 ? path.indexOf(id) : path.length)));
    } else {
      for (const item of list) output.appendChild(rowButton(item.id, byId.get(item.id).title, item.depth));
    }
    if (!output.children.length) output.appendChild(el("p", "empty-message", "No matching nodes"));
  }
  function setDrawerState() {
    $("sidebar").classList.toggle("is-hidden", !config.outlineOpen);
    $("detailDrawer").classList.toggle("is-hidden", !config.detailsOpen);
    $("detailsToggle").disabled = !config.focusId;
    $("overviewBack").classList.toggle("is-hidden", config.mode !== "focus");
  }
  function updateBreadcrumb() {
    const area = $("breadcrumb");
    area.replaceChildren();
    if (config.mode !== "focus" || !config.focusId) {
      area.appendChild(el("span", "crumb-current", config.view[0].toUpperCase() + config.view.slice(1)));
      return;
    }
    const path = ancestors(config.focusId);
    const visiblePath = path.slice(-3);
    if (path.length > 3) area.appendChild(el("span", "crumb-ellipsis", "…"));
    for (let i = 0; i < visiblePath.length; i++) {
      if (i) area.appendChild(el("span", "crumb-divider", "/"));
      const id = visiblePath[i], n = byId.get(id);
      if (id === config.focusId) area.appendChild(el("span", "crumb-current", n.title));
      else {
        const button = el("button", "crumb-link", n.title);
        button.addEventListener("click", () => navigate(id, config.view, false));
        area.appendChild(button);
      }
    }
  }
  function section(area, label) {
    const block = el("section", "context-section");
    block.appendChild(el("h4", "", label));
    area.appendChild(block);
    return block;
  }
  function refLink(id, label) {
    const target = locateView(id);
    const button = el("button", "context-link", label);
    button.addEventListener("click", () => openCross(id));
    button.title = target ? target + " · " + id : "Unknown node";
    return button;
  }
  function renderDetails() {
    const area = $("detailBody"); area.replaceChildren();
    const n = byId.get(config.focusId);
    if (!n) {
      area.appendChild(el("p", "empty-message", "Select a node to inspect evidence and cross-links."));
      return;
    }
    area.appendChild(el("h2", "detail-title", n.title));
    const status = el("div", "detail-status");
    const swatch = el("span", "detail-status-swatch");
    swatch.style.background = STATES[n.status] || "#adb2b9";
    status.appendChild(swatch);
    status.appendChild(el("span", "", n.status || kind(n)));
    area.appendChild(status);
    area.appendChild(el("p", "detail-description", plain(n.description || "")));
    if (n.signature) section(area, "Signature").appendChild(el("code", "signature", n.signature));
    if (n.why_it_matters) section(area, "Why this matters").appendChild(el("p", "", n.why_it_matters));
    if (n.aliases?.length) section(area, "Also known as").appendChild(el("p", "", n.aliases.join(" · ")));
    if (n.next) section(area, "Next step").appendChild(el("p", "", n.next));
    const logic = gate(n.id);
    if (logic) {
      const block = section(area, "Completion logic · " + logic.operator);
      for (const id of logic.children) block.appendChild(refLink(id, byId.get(id)?.title || id));
    }
    for (const [title, keys] of [
      ["Scientific knowledge", n.context_ids], ["Project context", n.core_ids],
      ["Scientific terms", n.term_ids]
    ]) {
      if (keys?.length) {
        const block = section(area, title);
        for (const key of keys) {
          const targetView = locateView(key);
          const source = (DATA[targetView]?.nodes || []).find(x => x.id === key);
          block.appendChild(refLink(key, source?.title || key));
        }
      }
    }
    if (n.foundation) {
      const block = section(area, "Background");
      const a = el("a", "context-link", n.foundation);
      a.href = "https://github.com/OpenSAE/OpenResearch/blob/main/" + n.foundation;
      a.target = "_blank"; a.rel = "noopener noreferrer"; block.appendChild(a);
    }
    if (n.evidence?.length) {
      const block = section(area, "Evidence");
      for (const source of n.evidence.slice(0, 12)) {
        const a = el("a", "context-link", source);
        const path = source.split(":")[0];
        if (path.startsWith("https://")) a.href = path;
        else if (!path.startsWith("/") && !path.includes("..")) {
          a.href = "https://github.com/OpenSAE/OpenResearch/blob/main/" + path;
        }
        a.target = "_blank"; a.rel = "noopener noreferrer"; block.appendChild(a);
      }
    }
    const extra = (graph().edges || []).filter(e =>
      (e.source === n.id || e.target === n.id) &&
      (!VIEWS[config.view].primary.includes(e.type) || parents.get(e.target) !== e.source));
    if (extra.length) {
      const block = section(area, "Related");
      for (const e of extra.slice(0, 16)) {
        const other = e.source === n.id ? e.target : e.source;
        block.appendChild(refLink(other, e.type + " · " + (byId.get(other)?.title || other)));
      }
    }
    if (config.view === "code" && config.diff) {
      const changed = config.diff.changed?.find(x => x.id === n.id);
      if (changed) section(area, "Observed change").appendChild(el("p", "", changed.fields.join(", ")));
    }
  }
  function render(autoFit) {
    const layout = normalizeLayout(config.mode === "focus" ? layoutFocus() : layoutOverview());
    config.visible = layout.visible;
    drawSVG(layout);
    if (autoFit) config.zoom = fitZoom();
    setScale();
    updateBreadcrumb(); renderOutline(); renderDetails(); setDrawerState();
    $("canvasWrap").classList.toggle("in-focus", config.mode === "focus");
    $("diffControl").classList.toggle("is-hidden", config.view !== "code");
    $("focusHint").textContent = config.view === "environment" && graph().synthetic
      ? "Synthetic example · not an observed machine" : "";
    $("collapse").disabled = config.mode === "focus";
    $("expand").disabled = config.mode === "focus";
    if (config.mode === "focus") centerSelected();
    else if (autoFit && typeof $("canvasWrap").scrollTo === "function") {
      $("canvasWrap").scrollTo({ left: 0, top: 0 });
    }
  }

  function bind() {
    // Each public HTML is a genuine URL; same-view focus changes use browser history.
    $("overviewBack").addEventListener("click", () => overview(true));
    $("outlineToggle").addEventListener("click", () => {
      config.outlineOpen = !config.outlineOpen;
      config.detailsOpen = false; setDrawerState();
    });
    $("outlineClose").addEventListener("click", () => {
      config.outlineOpen = false; setDrawerState();
    });
    $("detailsToggle").addEventListener("click", () => {
      if (!config.focusId) return;
      config.detailsOpen = !config.detailsOpen;
      config.outlineOpen = false; renderDetails(); setDrawerState();
    });
    $("detailsClose").addEventListener("click", () => {
      config.detailsOpen = false; setDrawerState();
    });
    $("search").addEventListener("input", event => {
      config.query = String(event.target.value || "");
      config.mode = "overview"; config.focusId = null; config.detailsOpen = false;
      config.outlineOpen = !!config.query.trim();
      if (window.location?.search?.includes("focus=")) setAddress(null, true);
      render(true);
    });
    $("collapse").addEventListener("click", () => {
      if (config.mode === "focus") return;
      config.expanded = new Set(rootIds);
      render(true);
    });
    $("expand").addEventListener("click", () => {
      if (config.mode === "focus") return;
      config.expanded = new Set(byId.keys());
      render(true);
    });
    $("fit").addEventListener("click", () => {
      config.zoom = fitZoom(); setScale();
      if (config.mode === "focus") centerSelected();
    });
    $("zoomIn").addEventListener("click", () => {
      config.zoom = Math.min(1.8, Math.round((config.zoom + 0.15) * 100) / 100);
      setScale(); if (config.mode === "focus") centerSelected();
    });
    $("zoomOut").addEventListener("click", () => {
      config.zoom = Math.max(0.45, Math.round((config.zoom - 0.15) * 100) / 100);
      setScale(); if (config.mode === "focus") centerSelected();
    });
    $("diffFile").addEventListener("change", async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const result = JSON.parse(await file.text());
        if (result.kind !== "code_diff") throw new Error("Expected a code_diff JSON report");
        config.diff = result;
        if (config.view !== "code") {
          if (window.location) window.location.href = "code.html";
        } else render(true);
      } catch (error) {
        if (typeof alert === "function") alert("Cannot load code-tree diff: " + error.message);
      }
      event.target.value = "";
    });
    if (window.addEventListener) {
      window.addEventListener("popstate", () => {
        const next = getSearchFocus();
        config.focusId = next && byId.has(next) ? next : null;
        config.mode = config.focusId ? "focus" : "overview";
        config.detailsOpen = false;
        config.query = ""; $("search").value = "";
        render(true);
      });
      window.addEventListener("keydown", event => {
        if (event.key === "Escape") {
          if (config.detailsOpen || config.outlineOpen) {
            config.detailsOpen = false; config.outlineOpen = false; setDrawerState();
          } else if (config.mode === "focus") overview(true);
        }
      });
      window.addEventListener("resize", () => {
        const v = $("canvasWrap"), next = {
          width: Number(v.clientWidth) || 0, height: Number(v.clientHeight) || 0
        };
        if (Math.abs(next.width - lastViewport.width) > 90 ||
            Math.abs(next.height - lastViewport.height) > 90) {
          lastViewport = next;
          render(true);
        }
      });
    }
  }

  init();
})();

