// ============================================================================
// cmt-page.ts — a full page LAYOUT built from blocks.ts, with generic
// placeholder text everywhere ("heading text goes here", "body text goes
// here"). Swap the strings for real copy later; the structure won't change.
//
// Page order:
//   1. "What is CMT" heading + "CMT by the Numbers" (6-stat single column)
//   2. Half/half row: left = 4 alternating type+image blurbs
//                      right = straight-line progression timeline (tree)
//   3. "A note from our family" quote banner
//   4. Symptoms grid (2 columns, grows automatically as you add cards)
//   5. Pannable CMT subtype tree (drag to explore, Google-Maps style)
// ============================================================================
import {
  createBigBlock,
  createTextBox,
  createColumns,
  createTree,
  createPannableViewport,
  mount,
  type BlockStyle,
  type TreeNodeDef,
} from "./blocks.js";

// ----------------------------------------------------------------------------
// Design tokens
// ----------------------------------------------------------------------------
const theme = {
  ink: "#22283a",
  body: "#5a6274",
  muted: "#8890a0",
  accent: "#4a6fa5",
  border: "#e2e4ea",
  cardBg: "#ffffff",
  pageBg: "#fafafb",
  sectionAltBg: "#f4f5f8",
  placeholderBorder: "#c3c8d2",
};

// ----------------------------------------------------------------------------
// Small reusable pieces
// ----------------------------------------------------------------------------
function eyebrow(text: string): HTMLElement {
  return createTextBox(text, {
    fontSize: "12px",
    fontWeight: "700",
    textColor: theme.accent,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  });
}

function heading(text: string, size: string = "28px"): HTMLElement {
  return createTextBox(text, { fontSize: size, fontWeight: "700", textColor: theme.ink });
}

function bodyText(text: string): HTMLElement {
  return createTextBox(text, { fontSize: "14px", textColor: theme.body, lineHeight: "1.6" });
}

function card(children: HTMLElement[], style: BlockStyle = {}): HTMLElement {
  return createBigBlock(children, {
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "12px",
    padding: "20px",
    gap: "10px",
    ...style,
  });
}

// "Room for a picture" — a placeholder box sized to what the real image
// should be, with example text inside instead of an actual <img>.
function imagePlaceholder(width: string, height: string): HTMLElement {
  return createBigBlock(
    [
      createTextBox(`Image placeholder — ${width} × ${height}`, {
        textColor: theme.muted,
        fontSize: "13px",
        textAlign: "center",
      }),
      createTextBox("Example text here", { textColor: theme.muted, fontSize: "12px", textAlign: "center" }),
    ],
    {
      width,
      height,
      border: `2px dashed ${theme.placeholderBorder}`,
      borderRadius: "10px",
      backgroundColor: theme.sectionAltBg,
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
    }
  );
}

// ----------------------------------------------------------------------------
// SECTION 1: "What is CMT" heading + "CMT by the Numbers" (6 stats, 1 column)
// ----------------------------------------------------------------------------
function buildHeadingSection(): HTMLElement {
  const intro = createBigBlock(
    [
      eyebrow("Heading label goes here"),
      heading("What is CMT — heading text goes here", "36px"),
      bodyText("Body text goes here. A short introductory paragraph would sit in this spot."),
      bodyText("Body text goes here. A second paragraph, if needed, goes here."),
    ],
    { padding: "0", gap: "10px", flex: "1.3" }
  );

  const statRow = (n: number) =>
    createBigBlock(
      [
        createTextBox(`Stat label ${n} goes here`, { fontSize: "13px", textColor: theme.body }),
        createTextBox(`Value ${n}`, { fontSize: "13px", fontWeight: "700", textColor: theme.ink }),
      ],
      { padding: "10px 0", justifyContent: "space-between" },
      "row"
    );

  const statsCard = card(
    [
      createTextBox("CMT by the Numbers", { fontSize: "16px", fontWeight: "700", textColor: theme.ink, textAlign: "center" }),
      // single column, all 6 stats stacked
      createColumns([1, 2, 3, 4, 5, 6].map(statRow), 6, { gap: "2px" }),
    ],
    { flex: "1", gap: "12px" }
  );

  return createBigBlock([intro, statsCard], {
    backgroundColor: theme.pageBg,
    padding: "56px 48px",
    gap: "48px",
    alignItems: "flex-start",
  }, "row");
}

// ----------------------------------------------------------------------------
// SECTION 2a (left half): 4 alternating type-of-CMT + image blurbs
// ----------------------------------------------------------------------------
function buildTypesWithImages(): HTMLElement {
  const typeSection = (n: number, imageOnLeft: boolean) => {
    const text = createBigBlock(
      [
        eyebrow(`Type label ${n} goes here`),
        heading(`Heading text goes here`, "20px"),
        bodyText("Body text goes here. A short blurb describing this type would go in this spot."),
      ],
      { padding: "0", gap: "8px", flex: "1" }
    );
    const image = imagePlaceholder("200px", "150px");

    return createBigBlock(
      imageOnLeft ? [image, text] : [text, image],
      { padding: "0", gap: "20px", alignItems: "center" },
      "row"
    );
  };

  const sections = [
    typeSection(1, true),
    typeSection(2, false),
    typeSection(3, true),
    typeSection(4, false),
  ];

  return createBigBlock(
    [heading("Different Types of CMT — heading text goes here", "22px"), ...sections],
    { padding: "0", gap: "32px", flex: "1" }
  );
}

// ----------------------------------------------------------------------------
// SECTION 2b (right half): straight-line progression timeline (tree, no branching)
// ----------------------------------------------------------------------------
function buildChain(labels: string[]): TreeNodeDef {
  if (labels.length === 1) return labels[0];
  return [labels[0], [buildChain(labels.slice(1))]];
}

function buildProgressionTimeline(): HTMLElement {
  const stageLabels = [
    "Stage 1 — heading text goes here",
    "Stage 2 — heading text goes here",
    "Stage 3 — heading text goes here",
    "Stage 4 — heading text goes here",
    "Stage 5 — heading text goes here",
  ];

  const timelineTree = createTree(buildChain(stageLabels), {
    orientation: "vertical",
    lineColor: theme.accent,
    levelGap: "36px",
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "8px",
  });

  return createBigBlock(
    [heading("CMT Progression Timeline — heading text goes here", "22px"), bodyText("Body text goes here."), timelineTree],
    { padding: "0", gap: "16px", flex: "1", alignItems: "center" }
  );
}

// ----------------------------------------------------------------------------
// SECTION 2: the half/half row combining the two above
// ----------------------------------------------------------------------------
function buildHalfHalfSection(): HTMLElement {
  return createBigBlock([buildTypesWithImages(), buildProgressionTimeline()], {
    backgroundColor: theme.pageBg,
    padding: "56px 48px",
    gap: "48px",
    alignItems: "flex-start",
  }, "row");
}

// ----------------------------------------------------------------------------
// SECTION 3: "A note from our family" quote banner
// ----------------------------------------------------------------------------
function buildFamilyQuoteSection(): HTMLElement {
  return createBigBlock(
    [
      eyebrow("Section label goes here"),
      heading("A Note From Our Family — heading text goes here", "26px"),
      createTextBox("“Quote text goes here.”", {
        fontStyle: "italic",
        fontSize: "16px",
        textColor: theme.ink,
        textAlign: "center",
      }),
      bodyText("Body text goes here. A paragraph or two of warmer, personal framing text would sit in this spot."),
      createTextBox("— sign-off text goes here", { fontSize: "12px", textColor: theme.muted, letterSpacing: "0.05em" }),
    ],
    { backgroundColor: theme.sectionAltBg, padding: "56px 24px", alignItems: "center", gap: "14px" }
  );
}

// ----------------------------------------------------------------------------
// SECTION 4: Symptoms grid — 2 columns, grows automatically as cards are added
// ----------------------------------------------------------------------------
function buildSymptomsGrid(): HTMLElement {
  const symptomCard = (n: number, withImage: boolean) =>
    card(
      [
        heading(`Symptom ${n} — heading text goes here`, "16px"),
        bodyText("Body text goes here. A short blurb about this symptom would go in this spot."),
        ...(withImage ? [imagePlaceholder("100%", "120px")] : []),
      ],
      { gap: "8px" }
    );

  // alternate which cards get a picture — swap this list any time
  const cards = [1, 2, 3, 4, 5, 6].map((n) => symptomCard(n, n % 2 === 0));

  // maxItems is computed from the item count, so adding more symptom
  // cards later keeps this a clean 2-column grid automatically.
  const grid = createColumns(cards, Math.ceil(cards.length / 2), { gap: "20px" });

  return createBigBlock(
    [
      eyebrow("Section label goes here"),
      heading("Symptoms — heading text goes here", "26px"),
      bodyText("Body text goes here. A short supporting line for the grid below."),
      grid,
    ],
    { backgroundColor: theme.pageBg, padding: "56px 48px", gap: "20px", alignItems: "center" }
  );
}

// ----------------------------------------------------------------------------
// SECTION 5: Pannable CMT subtype tree
//
// Placeholder classification tree (~19 nodes) using standard CMT genetic
// naming (CMT1/2/3/4, CMTX, intermediate forms). Several leaves are left as
// "(TBD)" for you to fill in later. Swap/add/remove entries in `cmtTreeData`
// whenever you're ready — the tree and pan behavior don't need to change.
// ----------------------------------------------------------------------------
const cmtTreeData: TreeNodeDef = [
  "CMT",
  [
    [
      "CMT1 (demyelinating, autosomal dominant)",
      ["CMT1A", "CMT1B", "CMT1C"],
    ],
    [
      "CMT2 (axonal, autosomal dominant)",
      ["CMT2A", "CMT2B", "(TBD)"],
    ],
    [
      "CMTX (X-linked)",
      ["CMTX1", "(TBD)"],
    ],
    [
      "CMT4 (demyelinating, autosomal recessive)",
      ["CMT4A", "(TBD)"],
    ],
    [
      "Intermediate CMT (DI-CMT)",
      ["DI-CMTA", "(TBD)"],
    ],
    "(TBD)",
  ],
];

function buildSubtypeTree(): HTMLElement {
  const tree = createTree(cmtTreeData, {
    orientation: "vertical",
    lineColor: theme.accent,
    levelGap: "48px",
  });

  const viewport = createPannableViewport(tree, {
    width: "100%",
    height: "480px",
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "12px",
    padding: "32px",
  });

  return createBigBlock(
    [
      eyebrow("Section label goes here"),
      heading("CMT Subtypes — heading text goes here", "26px"),
      bodyText("Body text goes here. Click and drag inside the box below to explore the full tree."),
      viewport,
    ],
    { backgroundColor: theme.sectionAltBg, padding: "56px 48px", gap: "16px", alignItems: "center" }
  );
}

// ----------------------------------------------------------------------------
// Assemble the page
// ----------------------------------------------------------------------------
const page = document.getElementById("app")!;
mount(buildHeadingSection(), page);
mount(buildHalfHalfSection(), page);
mount(buildFamilyQuoteSection(), page);
mount(buildSymptomsGrid(), page);
mount(buildSubtypeTree(), page);