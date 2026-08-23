// ============================================================================
// blocks.ts — a tiny composable layout framework
//
// Everything below returns a plain HTMLElement, so you can mix and nest
// these functions however you want. Sections are labelled so you can find
// (and copy out) just the piece you need.
//
//   SECTION 1: Shared style type + helper
//   SECTION 2: BIG BLOCK        — reserves page space, holds other blocks
//   SECTION 3: TEXT BOX         — a little block
//   SECTION 4: IMAGE BLOCK      — a little block
//   SECTION 5: COLUMNS          — a little block that lays out 3 (or n) sub-blocks
//   SECTION 6: TREE             — nested-array tree of customizable nodes
//   SECTION 7: mount() helper
//   SECTION 8: PANNABLE VIEWPORT — a fixed-size window you click-and-drag to
//                                   pan around a larger block (Google-Maps style)
//   SECTION 9: SECTION (page band) — a full-bleed background band with a
//                                     centered, max-width content column
//   SECTION 10: TREE NODE POPUP — click any tree node to open a shared modal
//                                   (label + body text + placeholder image)
//   SECTION 11: BUTTON          — a little block, clickable, no-op by default
//   SECTION 12: TREE NODE HOVER TOOLTIP — brief preview on hover, hinting
//                                   that a node is clickable
// ============================================================================


// ----------------------------------------------------------------------------
// SECTION 1: Shared style type + helper
//
// Every block-creating function below takes an optional `style` object of
// this shape. Add fields here if you want to control more CSS properties
// globally across every block type.
// ----------------------------------------------------------------------------
export interface BlockStyle {
  backgroundColor?: string;
  background?: string; // raw CSS background (gradients, etc.) — takes precedence over backgroundColor when set
  textColor?: string;
  padding?: string;
  margin?: string;
  gap?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  width?: string;
  height?: string;
  minHeight?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: "normal" | "italic";
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textAlign?: "left" | "center" | "right" | "justify";
  alignItems?: string;
  justifyContent?: string;
  flex?: string; // e.g. "1" to let a block grow inside a flex/grid parent
}

// Applies a BlockStyle object onto a real DOM element. Called internally by
// every create___ function below, so any block you build supports the same
// style keys.
function applyStyle(el: HTMLElement, style: BlockStyle = {}): void {
  if (style.background) el.style.background = style.background;
  else if (style.backgroundColor) el.style.backgroundColor = style.backgroundColor;
  if (style.textColor) el.style.color = style.textColor;
  if (style.padding) el.style.padding = style.padding;
  if (style.margin) el.style.margin = style.margin;
  if (style.gap) el.style.gap = style.gap;
  if (style.border) el.style.border = style.border;
  if (style.borderRadius) el.style.borderRadius = style.borderRadius;
  if (style.boxShadow) el.style.boxShadow = style.boxShadow;
  if (style.width) el.style.width = style.width;
  if (style.height) el.style.height = style.height;
  if (style.minHeight) el.style.minHeight = style.minHeight;
  if (style.fontSize) el.style.fontSize = style.fontSize;
  if (style.fontFamily) el.style.fontFamily = style.fontFamily;
  if (style.fontWeight) el.style.fontWeight = style.fontWeight;
  if (style.fontStyle) el.style.fontStyle = style.fontStyle;
  if (style.lineHeight) el.style.lineHeight = style.lineHeight;
  if (style.letterSpacing) el.style.letterSpacing = style.letterSpacing;
  if (style.textTransform) el.style.textTransform = style.textTransform;
  if (style.textAlign) el.style.textAlign = style.textAlign;
  if (style.alignItems) el.style.alignItems = style.alignItems;
  if (style.justifyContent) el.style.justifyContent = style.justifyContent;
  if (style.flex) el.style.flex = style.flex;
}


// ----------------------------------------------------------------------------
// SECTION 2: BIG BLOCK
//
// A "big block" just reserves a region of the page (a section, a row, a
// full-width band, whatever) and stacks whatever children you give it. Big
// blocks can hold little blocks OR other big blocks — nest freely to build
// a custom grid of any shape.
// ----------------------------------------------------------------------------
export function createBigBlock(
  children: HTMLElement[] = [],
  style: BlockStyle = {},
  direction: "row" | "column" = "column"
): HTMLElement {
  const block = document.createElement("div");
  block.classList.add("bf-big-block");
  block.style.display = "flex";
  block.style.flexDirection = direction;
  block.style.boxSizing = "border-box";
  block.style.width = style.width ?? "100%";
  block.style.gap = style.gap ?? "16px";
  applyStyle(block, style);
  children.forEach((child) => block.appendChild(child));
  return block;
}


// ----------------------------------------------------------------------------
// SECTION 3: TEXT BOX (little block)
//
// Plain text content. Pass `tag` if you want it to render as a heading
// (e.g. "h1", "h2") instead of a paragraph-like div.
// ----------------------------------------------------------------------------
export function createTextBox(
  text: string,
  style: BlockStyle = {},
  tag: keyof HTMLElementTagNameMap = "div"
): HTMLElement {
  const box = document.createElement(tag);
  box.classList.add("bf-text-box");
  box.textContent = text;
  box.style.boxSizing = "border-box";
  applyStyle(box, style);
  return box;
}

// createRichText: like createTextBox, but content is an array of plain
// strings and/or { text, style } segments, each rendered as its own <span>.
// Use it for mixed-style runs within one line — e.g. a heading that's
// mostly one color/weight except for a single italicized, differently
// colored word.
export interface TextSegment {
  text: string;
  style?: BlockStyle;
}

export function createRichText(
  segments: (string | TextSegment)[],
  style: BlockStyle = {},
  tag: keyof HTMLElementTagNameMap = "div"
): HTMLElement {
  const box = document.createElement(tag);
  box.classList.add("bf-text-box", "bf-rich-text");
  box.style.boxSizing = "border-box";
  applyStyle(box, style);
  segments.forEach((seg) => {
    if (typeof seg === "string") {
      box.appendChild(document.createTextNode(seg));
      return;
    }
    const span = document.createElement("span");
    span.textContent = seg.text;
    applyStyle(span, seg.style ?? {});
    box.appendChild(span);
  });
  return box;
}


// ----------------------------------------------------------------------------
// SECTION 4: IMAGE BLOCK (little block)
// ----------------------------------------------------------------------------
export function createImageBlock(
  src: string,
  alt: string = "",
  style: BlockStyle = {}
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.classList.add("bf-image-block");
  wrapper.style.boxSizing = "border-box";
  wrapper.style.overflow = "hidden";
  applyStyle(wrapper, style);

  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  img.style.width = "100%";
  img.style.height = style.height ? "100%" : "auto";
  img.style.objectFit = "cover";
  img.style.display = "block";
  if (style.borderRadius) img.style.borderRadius = style.borderRadius;

  wrapper.appendChild(img);
  return wrapper;
}


// ----------------------------------------------------------------------------
// SECTION 5: COLUMN (little block that stacks sub-blocks vertically)
//
// Stacks child blocks top-to-bottom — a "column" of smaller pieces of
// information. `maxItems` optionally caps how many items go in a single
// column (defaults to 3, per "stack smaller pieces of information in
// columns of 3"); pass more items than that and they'll wrap into
// additional columns placed side by side, so you still get a grid when you
// have more content than one column holds.
// Each item can itself be any block — a text box, image, another column
// block, or even a big block — so you can build arbitrarily deep layouts.
// ----------------------------------------------------------------------------
export function createColumns(
  items: HTMLElement[],
  maxItems: number = 3,
  style: BlockStyle = {}
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.classList.add("bf-columns-block");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "row";
  wrapper.style.alignItems = "flex-start";
  wrapper.style.gap = style.gap ?? "16px";
  wrapper.style.boxSizing = "border-box";
  wrapper.style.width = style.width ?? "100%";
  applyStyle(wrapper, style);

  for (let i = 0; i < items.length; i += maxItems) {
    const column = document.createElement("div");
    column.classList.add("bf-column");
    column.style.display = "flex";
    column.style.flexDirection = "column";
    column.style.flex = "1";
    column.style.gap = style.gap ?? "16px";
    items.slice(i, i + maxItems).forEach((item) => column.appendChild(item));
    wrapper.appendChild(column);
  }

  return wrapper;
}


// ----------------------------------------------------------------------------
// SECTION 6: TREE
//
// Build a tree from a nested-array description. A node is either:
//   - a plain value (string | number)             -> a leaf, one person
//   - a couple({...})                              -> two people sharing one
//                                                      spot in the tree (see
//                                                      below), still a leaf
//                                                      unless given children
//   - a 2-tuple [value, childrenArray]             -> a node with children
//
// Example from the spec: [1, [2, 3]]
//   1 is the root; 2 and 3 are children one level below it.
//
// Deeper example: [1, [ [2, [4, 5]], 3 ]]
//   1 is the root
//     -> 2 (which itself has children 4 and 5)
//     -> 3
//
// FAMILY-TREE STYLE ("couples"):
// Use the couple() helper to put two people in one slot, joined by a short
// marriage bar, with a single line dropping down to their shared children:
//   [couple("Alice", "Bob"), ["Child 1", "Child 2"]]
//
// CROSS-BRANCH LINES:
// Real family trees sometimes need a line that ISN'T a parent/child line —
// e.g. two cousins from different branches marrying. Give any person or
// couple an `id` and list extra links via the `connections` option on
// createTree; those get drawn as dashed lines overlaid on the whole tree
// after it's on the page.
//
// PER-LEVEL SIZING:
// Pass `levelStyles` on createTree to override the style at specific
// depths — index 0 is the root, index 1 is its children, and so on. Handy
// for making the root visually bigger than everything under it. Depths
// past the end of the array just keep the base `style`.
//
// CLICK-TO-OPEN DETAIL:
// Every node opens a shared popup when clicked (label + body text + a
// placeholder image slot) — see SECTION 10. Give a node `detail` text to
// customize the popup body; otherwise it falls back to generic placeholder
// copy built from the node's own label.
//
// FLOATING NODES:
// Sometimes a node relates to *several* things at once and forcing it to
// pick one real parent would misrepresent the other relationships. Instead
// of nesting it in `def` at all, list it under `floatingNodes` on
// createTree with an `anchorId` — it renders outside the hierarchy
// entirely, vertically aligned with whichever real node that anchor id
// points to (i.e. "the same row as"), positioned just to that anchor's
// right. Wire it up to whatever it relates to using `connections` (below),
// same as any other cross-branch line.
//
// CROSS-BRANCH LINE STYLE:
// Each connection can be `style: "straight"` (default, a direct diagonal
// line) or `style: "elbow"` (a right-angle path — horizontal, then
// vertical, then horizontal). Elbow reads better when the two ends sit in
// roughly the same row, since it avoids cutting diagonally across the real
// hierarchy lines in between.
//
// ALWAYS-VISIBLE BODY TEXT:
// `detail` only shows up inside the click popup. Give a node a `body`
// instead (or as well) and that text renders right inside the node box
// itself, under the label, all the time — no click needed. Handy for
// something like a timeline where you want the description visible at a
// glance rather than tucked behind an interaction.
//
// HOVER PREVIEW:
// Every clickable node also shows a small tooltip on hover — label's
// `detail` (or `body` if there's no `detail`), so people get a hint that
// there's more to see before they click.
//
// POPUP IMAGE:
// Give a node `image` (a URL) and its popup shows that picture instead of
// the generic dashed placeholder box — `imageAlt` sets its alt text.
// ----------------------------------------------------------------------------
export type TreePerson = string | number | {
  id: string;
  label: string | number;
  detail?: string;
  body?: string;
  image?: string;
  imageAlt?: string;
};

export interface TreeCouple {
  couple: TreePerson[]; // exactly 2 people sharing one slot in the tree
}

export type TreeNodeValue = TreePerson | TreeCouple;
export type TreeNodeDef = TreeNodeValue | [TreeNodeValue, TreeNodeDef[]];

// Convenience helper for building a couple slot instead of writing the
// {couple: [...]} object by hand.
export function couple(a: TreePerson, b: TreePerson): TreeCouple {
  return { couple: [a, b] };
}

export interface TreeConnection {
  from: string; // id of a person or couple slot (see `id` on TreePerson)
  to: string;
  color?: string;
  dashed?: boolean; // defaults to true — dashed reads as "not a direct parent/child line"
  style?: "straight" | "elbow"; // "straight" (default) = direct line; "elbow" = right-angle path
}

// A node rendered outside the normal parent/child hierarchy entirely,
// aligned to the same row as `anchorId`'s node. See "FLOATING NODES" above.
export interface FloatingTreeNode {
  person: TreePerson;
  anchorId: string; // id of the real tree node whose row this should align with
  offsetX?: string; // horizontal gap from the anchor's right edge, default "40px"
  offsetY?: string; // vertical nudge from the anchor's top edge, default "0px" — negative moves up
}

export interface TreeStyle extends BlockStyle {
  lineColor?: string; // color of the normal parent/child connector lines
  levelGap?: string; // distance a connector line travels between generations, e.g. "60px"
  orientation?: "vertical" | "horizontal"; // vertical: root top-center, grows down. horizontal: root center-left, grows right.
  connections?: TreeConnection[]; // extra, non-hierarchical lines between ids
  levelStyles?: BlockStyle[]; // per-depth style overrides, layered on top of the base style — index 0 is the root
  floatingNodes?: FloatingTreeNode[]; // nodes rendered outside the hierarchy, row-aligned to an anchor
}

function isCouple(value: TreeNodeValue): value is TreeCouple {
  return typeof value === "object" && value !== null && "couple" in value;
}

function personLabel(p: TreePerson): string {
  return typeof p === "object" ? String(p.label) : String(p);
}

function personId(p: TreePerson): string {
  return typeof p === "object" ? p.id : String(p);
}

function personDetail(p: TreePerson): string | undefined {
  return typeof p === "object" ? p.detail : undefined;
}

function personBody(p: TreePerson): string | undefined {
  return typeof p === "object" ? p.body : undefined;
}

function personImage(p: TreePerson): string | undefined {
  return typeof p === "object" ? p.image : undefined;
}

function personImageAlt(p: TreePerson): string {
  return (typeof p === "object" && p.imageAlt) || personLabel(p);
}

// Fills a node element with either just the label (plain, single-line —
// the default) or label + always-visible body text stacked underneath, when
// the person has `body` set. `maxWidth` caps the wrap width of that body
// text — pass a wider value via the tree's own `width` style to make
// bigger boxes.
function renderPersonContent(el: HTMLElement, person: TreePerson, maxWidth: string = "260px"): void {
  const body = personBody(person);
  if (!body) {
    el.textContent = personLabel(person);
    return;
  }

  el.style.flexDirection = "column";
  el.style.alignItems = "flex-start";
  el.style.whiteSpace = "normal";
  el.style.textAlign = "left";
  el.style.maxWidth = maxWidth;

  const labelEl = document.createElement("div");
  labelEl.textContent = personLabel(person);
  labelEl.style.fontWeight = "700";
  labelEl.style.marginBottom = "4px";

  const bodyEl = document.createElement("div");
  bodyEl.textContent = body;
  bodyEl.style.fontWeight = "400";
  bodyEl.style.fontSize = "0.82em";
  bodyEl.style.lineHeight = "1.5";
  bodyEl.style.opacity = "0.75";

  el.append(labelEl, bodyEl);
}

// Wires up both interactions every clickable tree node gets: click opens
// the full popup (SECTION 10), hover shows a brief preview tooltip
// (SECTION 12) so people know there's more to see before they click.
function wireNodeInteractions(el: HTMLElement, person: TreePerson): void {
  el.style.cursor = "pointer";
  el.addEventListener("click", () =>
    openTreeNodePopup(personLabel(person), personDetail(person), personImage(person), personImageAlt(person))
  );
  el.addEventListener("mouseenter", () => showTreeNodeTooltip(el, personDetail(person) ?? personBody(person)));
  el.addEventListener("mouseleave", hideTreeNodeTooltip);
}

export function createTree(def: TreeNodeDef, style: TreeStyle = {}): HTMLElement {
  const orientation = style.orientation ?? "vertical";

  const container = document.createElement("div");
  container.classList.add("bf-tree-container");
  container.classList.add(orientation === "horizontal" ? "bf-tree-container-horizontal" : "bf-tree-container-vertical");
  if (style.lineColor) {
    container.style.setProperty("--bf-tree-line-color", style.lineColor);
  }
  if (style.levelGap) {
    container.style.setProperty("--bf-tree-gap", style.levelGap);
  }

  const rootList = document.createElement("ul");
  rootList.classList.add("bf-tree", "bf-tree-root");
  if (orientation === "horizontal") rootList.classList.add("bf-tree-horizontal");

  // Track every id -> rendered element so cross-branch connections can find
  // their endpoints once everything is built.
  const idMap = new Map<string, HTMLElement>();

  rootList.appendChild(buildTreeNode(def, style, orientation, idMap));
  container.appendChild(rootList);

  const hasFloating = (style.floatingNodes?.length ?? 0) > 0;
  const hasConnections = (style.connections?.length ?? 0) > 0;
  if (hasFloating || hasConnections) {
    // Floating nodes have to exist (and be in idMap) before connections are
    // drawn, since a connection might point at one — so both are scheduled
    // together, in order, on the same "container is on the page" wait.
    scheduleTreeExtras(container, idMap, style);
  }

  return container;
}

function buildTreeNode(
  def: TreeNodeDef,
  style: TreeStyle,
  orientation: "vertical" | "horizontal",
  idMap: Map<string, HTMLElement>,
  depth: number = 0
): HTMLElement {
  let value: TreeNodeValue;
  let children: TreeNodeDef[] = [];

  if (Array.isArray(def)) {
    value = def[0];
    children = def[1] ?? [];
  } else {
    value = def;
  }

  // Layer this depth's override (if any) on top of the base style — e.g.
  // levelStyles[0] makes the root bigger without touching every other node.
  const levelOverride = style.levelStyles?.[depth];
  const nodeStyle = levelOverride ? { ...style, ...levelOverride } : style;

  const li = document.createElement("li");
  if (orientation === "horizontal") li.classList.add("bf-tree-horizontal");

  const nodeEl = document.createElement("div");
  nodeEl.classList.add("bf-tree-node");

  if (isCouple(value)) {
    nodeEl.classList.add("bf-tree-couple");
    const [a, b] = value.couple;
    [a, b].forEach((person) => {
      const personEl = document.createElement("div");
      personEl.classList.add("bf-tree-person");
      renderPersonContent(personEl, person, nodeStyle.width);
      applyStyle(personEl, nodeStyle);
      wireNodeInteractions(personEl, person);
      idMap.set(personId(person), personEl);
      nodeEl.appendChild(personEl);
    });
    const bar = document.createElement("div");
    bar.classList.add("bf-tree-marriage-bar");
    nodeEl.insertBefore(bar, nodeEl.children[1] ?? null);
  } else {
    nodeEl.classList.add("bf-tree-person");
    renderPersonContent(nodeEl, value, nodeStyle.width);
    applyStyle(nodeEl, nodeStyle);
    wireNodeInteractions(nodeEl, value);
    idMap.set(personId(value), nodeEl);
  }

  li.appendChild(nodeEl);

  if (children.length > 0) {
    const ul = document.createElement("ul");
    if (orientation === "horizontal") ul.classList.add("bf-tree-horizontal");
    children.forEach((child) => ul.appendChild(buildTreeNode(child, style, orientation, idMap, depth + 1)));
    li.appendChild(ul);
  }

  return li;
}

// Places floating nodes and draws the extra, non-hierarchical connection
// lines (e.g. two branches marrying into each other, or a floating node
// reaching into the tree) as an SVG overlay. Waits until the tree is
// actually attached to the page, since both need real layout positions —
// then keeps everything aligned on window resize.
function scheduleTreeExtras(container: HTMLElement, idMap: Map<string, HTMLElement>, style: TreeStyle): void {
  const run = () => {
    if (style.floatingNodes && style.floatingNodes.length > 0) {
      placeFloatingNodes(container, idMap, style.floatingNodes, style);
    }
    if (style.connections && style.connections.length > 0) {
      drawConnections(container, idMap, style.connections);
    }
  };

  const tryStart = () => {
    if (container.isConnected) {
      run();
      window.addEventListener("resize", run);
    } else {
      requestAnimationFrame(tryStart);
    }
  };
  requestAnimationFrame(tryStart);
}

// Renders each floating node (creating it the first time, just repositioning
// on later calls) at its anchor's vertical position, offset to the right.
function placeFloatingNodes(
  container: HTMLElement,
  idMap: Map<string, HTMLElement>,
  floating: FloatingTreeNode[],
  baseStyle: TreeStyle
): void {
  const containerRect = container.getBoundingClientRect();

  floating.forEach((f) => {
    const anchor = idMap.get(f.anchorId);
    if (!anchor) {
      console.warn(`bf tree floating node: could not find anchor id "${f.anchorId}"`);
      return;
    }
    const anchorRect = anchor.getBoundingClientRect();
    // clamped to a small positive minimum so a large up/left offset can
    // never push the node past the container's own top/left edge, where
    // it'd otherwise get clipped by the container's overflow
    const top = Math.max(
      4,
      anchorRect.top - containerRect.top + container.scrollTop + parseFloat(f.offsetY ?? "0")
    );
    const left = Math.max(
      4,
      anchorRect.right - containerRect.left + container.scrollLeft + parseFloat(f.offsetX ?? "40")
    );

    const id = personId(f.person);
    let el = idMap.get(id);
    if (!el) {
      el = document.createElement("div");
      el.classList.add("bf-tree-person", "bf-tree-floating");
      renderPersonContent(el, f.person);
      applyStyle(el, baseStyle);
      el.style.position = "absolute";
      el.style.zIndex = "2"; // stays above .bf-tree-connections, same layer as real tree nodes
      wireNodeInteractions(el, f.person);
      container.appendChild(el);
      idMap.set(id, el);
    }
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
  });
}

function drawConnections(
  container: HTMLElement,
  idMap: Map<string, HTMLElement>,
  connections: TreeConnection[]
): void {
  let svg = container.querySelector<SVGSVGElement>(":scope > svg.bf-tree-connections");
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("bf-tree-connections");
    container.appendChild(svg);
  }
  svg.innerHTML = "";
  svg.setAttribute("width", String(container.scrollWidth));
  svg.setAttribute("height", String(container.scrollHeight));

  const containerRect = container.getBoundingClientRect();
  const svgNS = "http://www.w3.org/2000/svg";

  connections.forEach((conn) => {
    const fromEl = idMap.get(conn.from);
    const toEl = idMap.get(conn.to);
    if (!fromEl || !toEl) {
      console.warn(`bf tree connection: could not find id "${conn.from}" or "${conn.to}"`);
      return;
    }
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const x1 = fromRect.left - containerRect.left + container.scrollLeft + fromRect.width / 2;
    const y1 = fromRect.top - containerRect.top + container.scrollTop + fromRect.height / 2;
    const x2 = toRect.left - containerRect.left + container.scrollLeft + toRect.width / 2;
    const y2 = toRect.top - containerRect.top + container.scrollTop + toRect.height / 2;

    const stroke = conn.color ?? "#c98a3f";
    const dashed = conn.dashed !== false;

    if (conn.style === "elbow") {
      // horizontal -> vertical -> horizontal, so it reads as a deliberate
      // "reaches over and connects" line rather than a diagonal cutting
      // across whatever's in between.
      const midX = (x1 + x2) / 2;
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", stroke);
      path.setAttribute("stroke-width", "2");
      if (dashed) path.setAttribute("stroke-dasharray", "6 4");
      svg!.appendChild(path);
    } else {
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", String(x1));
      line.setAttribute("y1", String(y1));
      line.setAttribute("x2", String(x2));
      line.setAttribute("y2", String(y2));
      line.setAttribute("stroke", stroke);
      line.setAttribute("stroke-width", "2");
      if (dashed) line.setAttribute("stroke-dasharray", "6 4");
      svg!.appendChild(line);
    }
  });
}


// ----------------------------------------------------------------------------
// SECTION 7: mount() helper
//
// Small convenience for attaching a built block to the real page.
// ----------------------------------------------------------------------------
export function mount(el: HTMLElement, target: HTMLElement = document.body): void {
  target.appendChild(el);
}


// ----------------------------------------------------------------------------
// SECTION 8: PANNABLE VIEWPORT
//
// Wraps a block in a fixed-size window that the user can click-and-drag to
// pan around, like dragging a Google Map. Useful when the content inside
// (e.g. a big tree) is wider or taller than you want to show all at once.
// Panning is drag-only (no zoom) and unbounded — the content can be dragged
// freely in any direction.
// ----------------------------------------------------------------------------
export interface PannableStyle extends BlockStyle {
  cursor?: string; // defaults to a grab/grabbing hand
}

export function createPannableViewport(content: HTMLElement, style: PannableStyle = {}): HTMLElement {
  const viewport = document.createElement("div");
  viewport.classList.add("bf-pannable-viewport");
  viewport.style.overflow = "hidden";
  viewport.style.position = "relative";
  viewport.style.cursor = style.cursor ?? "grab";
  viewport.style.touchAction = "none"; // let us handle drag ourselves, even on touch
  viewport.style.userSelect = "none";
  viewport.style.boxSizing = "border-box";
  applyStyle(viewport, style);

  const stage = document.createElement("div");
  stage.classList.add("bf-pannable-stage");
  stage.style.display = "inline-block";
  stage.style.willChange = "transform";
  stage.appendChild(content);
  viewport.appendChild(stage);

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;

  const setTransform = (x: number, y: number) => {
    stage.style.transform = `translate(${x}px, ${y}px)`;
    stage.dataset.x = String(x);
    stage.dataset.y = String(y);
  };
  setTransform(0, 0);

  viewport.addEventListener("pointerdown", (e: PointerEvent) => {
    isDragging = true;
    viewport.style.cursor = style.cursor ?? "grabbing";
    startX = e.clientX;
    startY = e.clientY;
    originX = Number(stage.dataset.x ?? 0);
    originY = Number(stage.dataset.y ?? 0);
    viewport.setPointerCapture(e.pointerId);
  });

  viewport.addEventListener("pointermove", (e: PointerEvent) => {
    if (!isDragging) return;
    setTransform(originX + (e.clientX - startX), originY + (e.clientY - startY));
  });

  const stopDragging = () => {
    isDragging = false;
    viewport.style.cursor = style.cursor ?? "grab";
  };
  viewport.addEventListener("pointerup", stopDragging);
  viewport.addEventListener("pointerleave", stopDragging);
  viewport.addEventListener("pointercancel", stopDragging);

  return viewport;
}


// ----------------------------------------------------------------------------
// SECTION 9: SECTION (page band)
//
// BIG BLOCK stays deliberately plain — it just reserves space and is always
// exactly as wide as its parent, which makes it usable anywhere (nested
// inside a card, a column, another big block, whatever). Full-bleed,
// edge-to-edge background bands are a different, more specific job: a
// SECTION is what you stack top-to-bottom down a page. Its background runs
// the full width of the viewport, while its content is capped at a max
// width and centered — the classic "colored band, centered column" pattern.
//
// Use createSection() for page-level bands; use createBigBlock() for
// everything you nest inside one (or anywhere else you just need a
// same-width-as-parent container).
// ----------------------------------------------------------------------------
export interface SectionStyle extends BlockStyle {
  maxWidth?: string; // width cap for the inner content column (default "1080px")
  contentPadding?: string; // padding applied to the inner content column (default "56px 24px")
}

export function createSection(
  children: HTMLElement[] = [],
  style: SectionStyle = {},
  direction: "row" | "column" = "column"
): HTMLElement {
  const outer = document.createElement("div");
  outer.classList.add("bf-section");
  outer.style.boxSizing = "border-box";
  outer.style.width = "100%";
  if (style.background) outer.style.background = style.background;
  else if (style.backgroundColor) outer.style.backgroundColor = style.backgroundColor;

  const inner = createBigBlock(children, {
    gap: style.gap,
    alignItems: style.alignItems,
    justifyContent: style.justifyContent,
    padding: style.contentPadding ?? "56px 24px",
  }, direction);
  inner.classList.add("bf-section-inner");
  inner.style.maxWidth = style.maxWidth ?? "1080px";
  inner.style.marginLeft = "auto";
  inner.style.marginRight = "auto";

  outer.appendChild(inner);
  return outer;
}


// ----------------------------------------------------------------------------
// SECTION 10: TREE NODE POPUP
//
// One modal, created lazily and reused for every open. Every tree node (see
// SECTION 6) wires itself up to call openTreeNodePopup() on click, passing
// its own label + optional detail text. Layout is title + placeholder image
// box + body text — swap the placeholder box for a real <img> later without
// touching any tree code.
// ----------------------------------------------------------------------------
let treePopupEls: {
  backdrop: HTMLElement;
  title: HTMLElement;
  body: HTMLElement;
  imagePlaceholder: HTMLElement;
  image: HTMLImageElement;
} | null = null;

function ensureTreeNodePopup(): NonNullable<typeof treePopupEls> {
  if (treePopupEls) return treePopupEls;

  const backdrop = document.createElement("div");
  backdrop.classList.add("bf-popup-backdrop");
  backdrop.style.cssText =
    "position:fixed; inset:0; background:rgba(20,20,20,0.45); display:none; align-items:center; " +
    "justify-content:center; z-index:1000; padding:24px; box-sizing:border-box; " +
    "opacity:0; transition:opacity 0.18s ease;";
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeTreeNodePopup();
  });

  const card = document.createElement("div");
  card.classList.add("bf-popup-card");
  card.style.cssText =
    "background:#ffffff; border-radius:16px; max-width:420px; width:100%; max-height:85vh; overflow:auto; " +
    "padding:28px; box-shadow:0 20px 60px rgba(0,0,0,0.25); position:relative; box-sizing:border-box;";
  card.addEventListener("click", (e) => e.stopPropagation());

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.style.cssText =
    "position:absolute; top:14px; right:14px; border:none; background:transparent; font-size:16px; " +
    "cursor:pointer; line-height:1; padding:6px; color:#666;";
  closeBtn.addEventListener("click", closeTreeNodePopup);

  // Fallback shown when a node has no `image` set — swapped out for the
  // real <img> below whenever one is available.
  const imagePlaceholder = document.createElement("div");
  imagePlaceholder.classList.add("bf-popup-image-placeholder");
  imagePlaceholder.style.cssText =
    "width:100%; height:160px; border:2px dashed #c3c8d2; border-radius:10px; display:flex; " +
    "align-items:center; justify-content:center; color:#8890a0; font-size:13px; margin-bottom:16px; box-sizing:border-box;";
  imagePlaceholder.textContent = "Image placeholder";

  const image = document.createElement("img");
  image.classList.add("bf-popup-image");
  image.style.cssText =
    "width:100%; height:160px; object-fit:cover; border-radius:10px; margin-bottom:16px; " +
    "box-sizing:border-box; display:none;";

  const title = document.createElement("div");
  title.classList.add("bf-popup-title");
  title.style.cssText = "font-size:22px; font-weight:700; margin:0 0 10px; padding-right:24px;";

  const body = document.createElement("div");
  body.classList.add("bf-popup-body");
  body.style.cssText = "font-size:14px; line-height:1.6; color:#444;";

  card.append(closeBtn, imagePlaceholder, image, title, body);
  backdrop.appendChild(card);
  document.body.appendChild(backdrop);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeTreeNodePopup();
  });

  treePopupEls = { backdrop, title, body, imagePlaceholder, image };
  return treePopupEls;
}

function openTreeNodePopup(label: string, detail?: string, imageSrc?: string, imageAlt?: string): void {
  const { backdrop, title, body, imagePlaceholder, image } = ensureTreeNodePopup();
  title.textContent = label;
  body.textContent = detail ?? `Body text goes here — a short description of ${label} would go in this spot.`;

  if (imageSrc) {
    image.src = imageSrc;
    image.alt = imageAlt ?? label;
    image.style.display = "block";
    imagePlaceholder.style.display = "none";
  } else {
    image.style.display = "none";
    image.removeAttribute("src");
    imagePlaceholder.style.display = "flex";
  }

  backdrop.style.display = "flex";
  // force a reflow between setting display and opacity, so the browser
  // registers the "0" state before we transition to "1" — otherwise both
  // changes land in the same frame and there's nothing to animate from.
  void backdrop.offsetWidth;
  backdrop.style.opacity = "1";
}

function closeTreeNodePopup(): void {
  if (!treePopupEls) return;
  const { backdrop } = treePopupEls;
  backdrop.style.opacity = "0";
  window.setTimeout(() => {
    // only hide if nothing re-opened it in the meantime
    if (backdrop.style.opacity === "0") backdrop.style.display = "none";
  }, 180);
}


// ----------------------------------------------------------------------------
// SECTION 11: BUTTON (little block)
//
// A clickable pill button. Pass an onClick handler once you have one to
// wire up; leave it off for a plain placeholder that doesn't do anything
// yet but still looks and feels like a real button.
// ----------------------------------------------------------------------------
export function createButton(
  label: string,
  style: BlockStyle = {},
  onClick?: () => void
): HTMLElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.classList.add("bf-button");
  btn.textContent = label;
  btn.style.boxSizing = "border-box";
  btn.style.cursor = "pointer";
  btn.style.border = "none";
  btn.style.borderRadius = "999px";
  btn.style.padding = "14px 28px";
  btn.style.fontSize = "15px";
  btn.style.fontWeight = "600";
  applyStyle(btn, style);
  if (onClick) btn.addEventListener("click", onClick);
  return btn;
}


// ----------------------------------------------------------------------------
// SECTION 12: TREE NODE HOVER TOOLTIP
//
// One tooltip, created lazily and reused for every hover, same pattern as
// the popup in SECTION 10. wireNodeInteractions() (SECTION 6) calls this on
// every tree node's mouseenter/mouseleave — text is a node's `detail` if it
// has one, else its `body`, trimmed down to a short preview. Purely a hint
// that the node is clickable; the full text always lives in the popup.
// ----------------------------------------------------------------------------
let treeTooltipEl: HTMLElement | null = null;

function ensureTreeNodeTooltip(): HTMLElement {
  if (treeTooltipEl) return treeTooltipEl;

  const tip = document.createElement("div");
  tip.classList.add("bf-tree-tooltip");
  tip.style.cssText =
    "position:fixed; max-width:220px; background:rgba(20,20,20,0.92); color:#fff; font-size:12px; " +
    "line-height:1.45; padding:8px 10px; border-radius:8px; pointer-events:none; z-index:1500; " +
    "display:none; box-shadow:0 6px 18px rgba(0,0,0,0.2);";
  document.body.appendChild(tip);

  treeTooltipEl = tip;
  return tip;
}

function showTreeNodeTooltip(anchorEl: HTMLElement, text?: string): void {
  const tip = ensureTreeNodeTooltip();
  const full = text ?? "Click for more detail.";
  tip.textContent = full.length > 110 ? `${full.slice(0, 107)}…` : full;

  // reset transform before measuring, so a leftover clamp from the last
  // hover doesn't affect this one's width/position measurement
  tip.style.transform = "translate(0, 0)";
  tip.style.left = "0px";
  tip.style.top = "0px";
  tip.style.display = "block";
  const tipRect = tip.getBoundingClientRect();

  const rect = anchorEl.getBoundingClientRect();
  const margin = 8;
  const halfWidth = tipRect.width / 2;

  // clamp horizontally so the tooltip can never render off the left or
  // right edge of the viewport, however close to the tree's own edge the
  // hovered node is
  const maxCenterX = Math.max(margin + halfWidth, window.innerWidth - margin - halfWidth);
  const centerX = Math.min(Math.max(rect.left + rect.width / 2, margin + halfWidth), maxCenterX);

  // prefer above the node; flip below if there's no room above
  let topY = rect.top - 10;
  let translateY = "-100%";
  if (topY - tipRect.height < margin) {
    topY = rect.bottom + 10;
    translateY = "0%";
  }

  tip.style.left = `${centerX}px`;
  tip.style.top = `${topY}px`;
  tip.style.transform = `translate(-50%, ${translateY})`;
}

function hideTreeNodeTooltip(): void {
  if (treeTooltipEl) treeTooltipEl.style.display = "none";
}