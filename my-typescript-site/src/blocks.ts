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
// ----------------------------------------------------------------------------
export type TreePerson = string | number | { id: string; label: string | number };

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
}

export interface TreeStyle extends BlockStyle {
  lineColor?: string; // color of the normal parent/child connector lines
  levelGap?: string; // distance a connector line travels between generations, e.g. "60px"
  orientation?: "vertical" | "horizontal"; // vertical: root top-center, grows down. horizontal: root center-left, grows right.
  connections?: TreeConnection[]; // extra, non-hierarchical lines between ids
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

  if (style.connections && style.connections.length > 0) {
    scheduleConnectionDrawing(container, idMap, style.connections);
  }

  return container;
}

function buildTreeNode(
  def: TreeNodeDef,
  style: TreeStyle,
  orientation: "vertical" | "horizontal",
  idMap: Map<string, HTMLElement>
): HTMLElement {
  let value: TreeNodeValue;
  let children: TreeNodeDef[] = [];

  if (Array.isArray(def)) {
    value = def[0];
    children = def[1] ?? [];
  } else {
    value = def;
  }

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
      personEl.textContent = personLabel(person);
      applyStyle(personEl, style);
      idMap.set(personId(person), personEl);
      nodeEl.appendChild(personEl);
    });
    const bar = document.createElement("div");
    bar.classList.add("bf-tree-marriage-bar");
    nodeEl.insertBefore(bar, nodeEl.children[1] ?? null);
  } else {
    nodeEl.classList.add("bf-tree-person");
    nodeEl.textContent = personLabel(value);
    applyStyle(nodeEl, style);
    idMap.set(personId(value), nodeEl);
  }

  li.appendChild(nodeEl);

  if (children.length > 0) {
    const ul = document.createElement("ul");
    if (orientation === "horizontal") ul.classList.add("bf-tree-horizontal");
    children.forEach((child) => ul.appendChild(buildTreeNode(child, style, orientation, idMap)));
    li.appendChild(ul);
  }

  return li;
}

// Draws the extra, non-hierarchical connection lines (e.g. two branches
// marrying into each other) as an SVG overlay. Waits until the tree is
// actually attached to the page, since it needs real layout positions —
// then keeps the lines aligned on window resize.
function scheduleConnectionDrawing(
  container: HTMLElement,
  idMap: Map<string, HTMLElement>,
  connections: TreeConnection[]
): void {
  const draw = () => drawConnections(container, idMap, connections);

  const tryStart = () => {
    if (container.isConnected) {
      draw();
      window.addEventListener("resize", draw);
    } else {
      requestAnimationFrame(tryStart);
    }
  };
  requestAnimationFrame(tryStart);
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

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(x1));
    line.setAttribute("y1", String(y1));
    line.setAttribute("x2", String(x2));
    line.setAttribute("y2", String(y2));
    line.setAttribute("stroke", conn.color ?? "#c98a3f");
    line.setAttribute("stroke-width", "2");
    if (conn.dashed !== false) line.setAttribute("stroke-dasharray", "6 4");
    svg!.appendChild(line);
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