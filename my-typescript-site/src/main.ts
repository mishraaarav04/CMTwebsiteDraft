// ============================================================================
// cmt-page.ts — a full page LAYOUT built from blocks.ts. Most sections now
// carry real, factual placeholder copy (swap in your own voice/sourcing
// whenever you're ready); the family quote banner is left blank on purpose
// since that's your family's story to tell, not mine to invent.
//
// Page order:
//   0. Hero — "All About CMT"
//   1. "What is CMT" heading + "CMT by the Numbers" (4-stat single column)
//   2. Half/half row: left = 4 alternating type+image blurbs
//                      right = symptoms -> diagnosis -> treatment timeline
//   3. "A note from our family" quote banner (still placeholder — your call)
//   4. Symptoms grid (2 columns, grows automatically as you add cards)
//   5. Pannable CMT subtype tree (drag to explore, Google-Maps style)
//   6. "Hope is on the horizon" gene-therapy call-to-action
// ============================================================================
import {
  createBigBlock,
  createTextBox,
  createRichText,
  createColumns,
  createTree,
  createPannableViewport,
  createSection,
  createButton,
  mount,
  type BlockStyle,
  type TreeNodeDef,
  type TreePerson,
} from "./blocks.js";

// ----------------------------------------------------------------------------
// Design tokens
// Matched to the live elixirforcmt.org type spec: Instrument Serif (400,
// regular + italic) for headings, Work Sans for body copy. Accent words
// within headings render italic + gold, same as the live site's treatment
// of "CMT" / the disease name.
// ----------------------------------------------------------------------------
const fontSerif = "'Instrument Serif', Georgia, serif";
const fontSans = "'Work Sans', ui-sans-serif, system-ui, sans-serif";

const theme = {
  ink: "#17284f", // deep navy — headings, rgb(23, 40, 79)
  body: "rgba(23, 40, 79, 0.75)", // body copy
  muted: "#8d94a6",
  accent: "#e2a936", // warm gold — italic accent words, stat values, tree lines
  accentBlue: "#3f5a85", // secondary navy-blue — eyebrows/labels
  border: "#e4e7ee",
  cardBg: "#ffffff",
  // the live site alternates two pale-blue section backgrounds down the page
  bandLight: "#f5f8fd",
  bandSoft: "#e9eff9",
  sectionAltBg: "#eef1f7",
  placeholderBorder: "#d8c19a",
  // soft diagonal blue-to-cream wash, used behind the family quote banner
  quoteGradient: "linear-gradient(135deg, #c8dbf2 0%, #dee4ef 45%, #f5e6c6 100%)",
  // deeper blue fading to a warm gray-cream, used behind the page hero
  heroGradient: "linear-gradient(120deg, #c3d9f3 0%, #e2e9f4 45%, #ebe6dd 100%)",
};

// ----------------------------------------------------------------------------
// Small reusable pieces
// ----------------------------------------------------------------------------
function eyebrow(text: string): HTMLElement {
  return createTextBox(`✦ ${text}`, {
    fontFamily: fontSans,
    fontSize: "12px",
    fontWeight: "700",
    textColor: theme.accentBlue,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  });
}

// Headings render in Instrument Serif, regular weight, navy ink. Wrap any
// word or phrase in *asterisks* to switch just that part to the accented
// style (italic, gold) — same treatment the live site gives the disease
// name in titles, but toggle-able per heading by editing the string, no
// code changes needed. e.g. heading("What is *CMT*?") accents only "CMT";
// heading("What is CMT?") (no asterisks) renders fully plain.
function heading(text: string, size: string = "28px", extraStyle: BlockStyle = {}): HTMLElement {
  // Splitting on a regex with one capturing group hands back the string
  // interleaved with its captures: [plain, captured, plain, captured, ...].
  // So odd indices are always what was *inside* the asterisks (delimiters
  // already stripped by the capture group) and even indices are everything
  // else — that parity is what tells us which style to apply below.
  const parts = text.split(/\*(.+?)\*/);
  const segments = parts
    .map((part, i) =>
      i % 2 === 1 ? { text: part, style: { fontStyle: "italic" as const, textColor: theme.accent } } : part
    )
    .filter((seg) => (typeof seg === "string" ? seg.length > 0 : seg.text.length > 0));
  return createRichText(segments, {
    fontFamily: fontSerif,
    fontWeight: "400",
    fontSize: size,
    lineHeight: size,
    textColor: theme.ink,
    ...extraStyle,
  });
}

function bodyText(text: string, extraStyle: BlockStyle = {}): HTMLElement {
  return createTextBox(text, {
    fontFamily: fontSans,
    fontWeight: "400",
    fontSize: "18px",
    lineHeight: "29px",
    textColor: theme.body,
    ...extraStyle,
  });
}

// A small decorative mark (star, moon, etc.) absolutely positioned within
// whatever element you append it to — that element needs position:relative
// set first. Purely cosmetic page dressing, so it's built directly with the
// DOM rather than through a blocks.ts primitive.
function decorativeMark(
  symbol: string,
  pos: { top?: string; left?: string; right?: string; bottom?: string; size?: string }
): HTMLElement {
  const mark = document.createElement("span");
  mark.textContent = symbol;
  mark.style.position = "absolute";
  if (pos.top) mark.style.top = pos.top;
  if (pos.left) mark.style.left = pos.left;
  if (pos.right) mark.style.right = pos.right;
  if (pos.bottom) mark.style.bottom = pos.bottom;
  mark.style.fontSize = pos.size ?? "16px";
  mark.style.color = theme.accent;
  mark.style.pointerEvents = "none";
  mark.style.userSelect = "none";
  mark.style.lineHeight = "1";
  return mark;
}

function card(children: HTMLElement[], style: BlockStyle = {}): HTMLElement {
  return createBigBlock(children, {
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(28, 43, 74, 0.06)",
    padding: "24px",
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
        fontFamily: fontSans,
        textColor: theme.muted,
        fontSize: "13px",
        textAlign: "center",
      }),
      createTextBox("Example text here", { fontFamily: fontSans, textColor: theme.muted, fontSize: "12px", textAlign: "center" }),
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
// SECTION 0: Page hero — "All About CMT"
// ----------------------------------------------------------------------------
function buildHeroSection(): HTMLElement {
  const badge = createBigBlock(
    [createTextBox("✨ Education & Awareness", { fontFamily: fontSans, fontWeight: "600", fontSize: "14px", textColor: theme.ink })],
    {
      backgroundColor: "#ffffff",
      border: `1px solid ${theme.border}`,
      borderRadius: "999px",
      padding: "10px 22px",
      width: "fit-content",
    }
  );

  const section = createSection(
    [
      badge,
      heading("All About *CMT*", "56px", { textAlign: "center" }),
      bodyText("The most common inherited neurological disorder you have probably never heard of.", {
        textAlign: "center",
      }),
    ],
    { background: theme.heroGradient, alignItems: "center", gap: "20px", contentPadding: "72px 24px" }
  );

  section.style.position = "relative";
  section.style.overflow = "hidden";
  section.append(
    decorativeMark("★", { top: "24px", left: "12%", size: "14px" }),
    decorativeMark("★", { top: "60px", right: "20%", size: "16px" }),
    decorativeMark("★", { bottom: "36px", left: "22%", size: "12px" }),
    decorativeMark("★", { bottom: "56px", right: "10%", size: "12px" }),
    decorativeMark("☾", { top: "12px", right: "3%", size: "64px" })
  );

  return section;
}

// ----------------------------------------------------------------------------
// SECTION 1: "What is CMT" heading + "CMT by the Numbers" (4 stats, 1 column)
// ----------------------------------------------------------------------------
function buildHeadingSection(): HTMLElement {
  const intro = createBigBlock(
    [
      eyebrow("The Basics"),
      heading("What is *CMT*?", "36px"),
      bodyText(
        "Charcot-Marie-Tooth disease (CMT) is a group of inherited disorders that damage the peripheral nerves — the ones carrying signals between the brain, spinal cord, muscles, and senses. It's the most commonly inherited neurological condition, yet most people have never heard of it."
      ),
      bodyText(
        "CMT isn't fatal, but it is progressive: over time it can weaken the feet, hands, and legs, and change balance and gait. There's no cure yet, which is exactly why funding research toward one matters."
      ),
    ],
    { padding: "0", gap: "10px", flex: "1.3" }
  );

  const stats = [
    { label: "People affected worldwide", value: "2.6M+" },
    { label: "Known genes involved", value: "80+" },
    { label: "CMT subtypes identified", value: "60+" },
    { label: "FDA-approved cures today", value: "0" },
    { label: "Estimated prevalence", value: "1 in 2,500" },
    { label: "First clinically described", value: "1886" },
  ];

  const statRow = (stat: { label: string; value: string }) =>
    createBigBlock(
      [
        createTextBox(stat.label, { fontFamily: fontSans, fontSize: "13px", textColor: theme.body }),
        createTextBox(stat.value, { fontFamily: fontSerif, fontSize: "20px", fontWeight: "400", textColor: theme.accent }),
      ],
      { padding: "12px 16px", backgroundColor: theme.sectionAltBg, borderRadius: "10px", justifyContent: "space-between" },
      "row"
    );

  const statsCard = card(
    [
      heading("*CMT* by the Numbers", "20px", { textAlign: "center" }),
      createColumns(stats.map(statRow), stats.length, { gap: "8px" }),
    ],
    { flex: "1", gap: "14px" }
  );

  return createSection([intro, statsCard], {
    backgroundColor: theme.bandLight,
    gap: "48px",
    alignItems: "flex-start",
  }, "row");
}

// ----------------------------------------------------------------------------
// SECTION 2a (left half): 4 alternating type-of-CMT + image blurbs
// ----------------------------------------------------------------------------
function buildTypesWithImages(): HTMLElement {
  const typeData = [
    {
      eyebrowText: "Demyelinating",
      title: "*CMT1*",
      body: "The most common form of CMT. It damages the myelin sheath that insulates nerve fibers, slowing nerve signals down. Usually autosomal dominant — one copy of the mutated gene is enough to cause it.",
    },
    {
      eyebrowText: "Axonal",
      title: "*CMT2*",
      body: "Damages the nerve fiber (axon) itself rather than its insulation, weakening the signal instead of slowing it. Symptoms often look similar to CMT1 but tend to appear a bit later in life.",
    },
    {
      eyebrowText: "X-linked",
      title: "*CMTX*",
      body: "Caused by mutations on the X chromosome. Because of this, males and females can experience noticeably different symptom severity, even within the same family.",
    },
    {
      eyebrowText: "Intermediate",
      title: "*DI-CMT*",
      body: "Shows overlapping features of both demyelinating and axonal forms, which is why it's classified as its own category rather than folded into CMT1 or CMT2.",
    },
  ];

  const typeSection = (data: (typeof typeData)[number], imageOnLeft: boolean) => {
    const text = createBigBlock(
      [eyebrow(data.eyebrowText), heading(data.title, "20px"), bodyText(data.body)],
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
    typeSection(typeData[0], true),
    typeSection(typeData[1], false),
    typeSection(typeData[2], true),
    typeSection(typeData[3], false),
  ];

  return createBigBlock(
    [heading("Different Types of *CMT*", "22px"), ...sections],
    { padding: "0", gap: "32px", flex: "1" }
  );
}

// ----------------------------------------------------------------------------
// SECTION 2b (right half): straight-line progression timeline (tree, no branching)
// ----------------------------------------------------------------------------
function buildChain(labels: TreePerson[]): TreeNodeDef {
  if (labels.length === 1) return labels[0];
  return [labels[0], [buildChain(labels.slice(1))]];
}

function buildProgressionTimeline(): HTMLElement {
  const stageLabels: TreePerson[] = [
    {
      id: "stage-symptoms",
      label: "Symptoms Appear",
      detail: "Body text goes here — a short description of the earliest signs would go in this spot.",
    },
    {
      id: "stage-diagnosis",
      label: "Diagnosis",
      detail: "Body text goes here — a short description of how a diagnosis typically comes together would go in this spot.",
    },
    {
      id: "stage-management",
      label: "Management & Care",
      detail: "Body text goes here — a short description of day-to-day management and care would go in this spot.",
    },
    {
      id: "stage-treatment",
      label: "Treatment",
      detail: "Body text goes here — a short description of current and emerging treatment options would go in this spot.",
    },
  ];

  const timelineTree = createTree(buildChain(stageLabels), {
    orientation: "vertical",
    lineColor: theme.accent,
    levelGap: "36px",
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "8px",
    fontFamily: fontSans,
    textColor: theme.ink,
  });

  return createBigBlock(
    [
      heading("*CMT* Progression Timeline", "22px"),
      bodyText("Every case moves at its own pace, but most people's experience follows a similar arc."),
      timelineTree,
    ],
    { padding: "0", gap: "16px", flex: "1", alignItems: "center" }
  );
}

// ----------------------------------------------------------------------------
// SECTION 2: the half/half row combining the two above
// ----------------------------------------------------------------------------
function buildHalfHalfSection(): HTMLElement {
  return createSection([buildTypesWithImages(), buildProgressionTimeline()], {
    backgroundColor: theme.bandSoft,
    gap: "48px",
    alignItems: "flex-start",
  }, "row");
}

// ----------------------------------------------------------------------------
// SECTION 3: "A note from our family" quote banner
// ----------------------------------------------------------------------------
function buildFamilyQuoteSection(): HTMLElement {
  return createSection(
    [
      eyebrow("Section label goes here"),
      heading("A Note From Our Family — heading text goes here", "26px"),
      createTextBox("“Quote text goes here.”", {
        fontFamily: fontSerif,
        fontStyle: "italic",
        fontSize: "20px",
        textColor: theme.ink,
        textAlign: "center",
      }),
      bodyText("Body text goes here. A paragraph or two of warmer, personal framing text would sit in this spot."),
      createTextBox("— sign-off text goes here", { fontFamily: fontSans, fontSize: "12px", textColor: theme.accent, letterSpacing: "0.05em" }),
    ],
    { background: theme.quoteGradient, alignItems: "center", gap: "14px" }
  );
}

// ----------------------------------------------------------------------------
// SECTION 4: Symptoms grid — 2 columns, grows automatically as cards are added
// ----------------------------------------------------------------------------
function buildSymptomsGrid(): HTMLElement {
  const symptomData = [
    { title: "High Arches & Hammertoes", body: "Foot structure changes (pes cavus, hammertoes) are often the earliest visible signs, especially in kids." },
    { title: "Foot Drop", body: "Weakness in the lower leg muscles can make it hard to lift the front of the foot, leading to tripping and a distinctive high-step gait." },
    { title: "Muscle Weakness", body: "Starts in the feet and lower legs and can progress to the hands and forearms over time." },
    { title: "Loss of Sensation", body: "Reduced feeling in the feet and hands makes it easier to miss cuts, blisters, or injuries." },
    { title: "Balance Problems", body: "Weakness and reduced sensation together make balance harder, leading to frequent trips and falls." },
    { title: "Hand Weakness", body: "Fine motor tasks like buttoning a shirt or turning a key can become difficult as hand muscles weaken." },
  ];

  const symptomCard = (data: (typeof symptomData)[number], withImage: boolean) =>
    card(
      [heading(data.title, "16px"), bodyText(data.body), ...(withImage ? [imagePlaceholder("100%", "120px")] : [])],
      { gap: "8px" }
    );

  // alternate which cards get a picture — swap this list any time
  const cards = symptomData.map((data, i) => symptomCard(data, (i + 1) % 2 === 0));

  // maxItems is computed from the item count, so adding more symptom
  // cards later keeps this a clean 2-column grid automatically.
  const grid = createColumns(cards, Math.ceil(cards.length / 2), { gap: "20px" });

  return createSection(
    [
      eyebrow("Signs to Know"),
      heading("Symptoms", "26px"),
      bodyText("A few of the most common signs to watch for — everyone's experience is a little different."),
      grid,
    ],
    { backgroundColor: theme.bandSoft, gap: "20px", alignItems: "center" }
  );
}

// ----------------------------------------------------------------------------
// SECTION 5: Pannable CMT subtype tree
//
// Root biggest, then it fans out by pathophysiology, then inheritance
// pattern, then concrete type/subtype:
//   1. root    — "CMT"
//   2. stems   — pathophysiology: Demyelinating / Axonal / Intermediate /
//                X-linked
//   3. —       — Autosomal Recessive only ever relates to one type (CMT4),
//                so it gets to be a real tree node: nested under
//                Demyelinating, sitting next to CMT1, with CMT4 as its own
//                child one level down. Autosomal Dominant relates to THREE
//                types (CMT1, CMT2, DI-CMT) — forcing it to pick one real
//                parent would misrepresent the other two, so instead it
//                floats outside the hierarchy entirely (see
//                `floatingNodes` below), row-aligned next to Autosomal
//                Recessive, and reaches each of its three types with a
//                dashed elbow connector instead of a real tree line.
//   4. types   — CMT1 / CMT2 / CMTX / DI-CMT directly; CMT4 one level
//                deeper, under Autosomal Recessive
//   5. subtypes — a few concrete subtypes per type, e.g. CMTX1
//
// Every node opens a popup on click (see blocks.ts SECTION 10) — give a
// node a `detail` string to customize its popup body; leave it off and it
// falls back to generic placeholder copy built from the node's label.
// ----------------------------------------------------------------------------
const cmtTreeData: TreeNodeDef = [
  {
    id: "cmt-root",
    label: "CMT",
    detail:
      "Charcot-Marie-Tooth disease (CMT) is a group of inherited disorders affecting the peripheral nerves. It's classified by two main factors: which part of the nerve is damaged, and how it's inherited.",
  },
  [
    [
      {
        id: "demyelinating",
        label: "Demyelinating",
        detail: "Damages the myelin sheath — the insulating layer around nerve fibers — which slows down how fast nerve signals travel.",
      },
      [
        [
          {
            id: "cmt1",
            label: "CMT1",
            detail: "The most common category of CMT overall. Demyelinating and usually autosomal dominant.",
          },
          [
            { id: "cmt1a", label: "CMT1A", detail: "Caused by a duplication of the PMP22 gene. The single most common CMT subtype, accounting for close to half of all cases." },
            { id: "cmt1b", label: "CMT1B", detail: "Caused by mutations in the MPZ gene, which makes a key structural protein in myelin." },
            { id: "cmt1c", label: "CMT1C", detail: "Caused by mutations in the LITAF gene." },
            "CMT1D",
          ],
        ],
        [
          {
            id: "autosomal-recessive",
            label: "Autosomal Recessive",
            detail: "Both copies of the gene — one from each parent — need to carry the mutation for the condition to appear. Often more severe and earlier-onset than dominant forms.",
          },
          [
            [
              {
                id: "cmt4",
                label: "CMT4",
                detail: "Demyelinating and autosomal recessive. Generally more severe, with earlier onset than CMT1.",
              },
              [
                { id: "cmt4a", label: "CMT4A", detail: "Caused by mutations in the GDAP1 gene. One of the more common autosomal recessive CMT subtypes." },
                "CMT4B1",
              ],
            ],
          ],
        ],
      ],
    ],
    [
      {
        id: "axonal",
        label: "Axonal",
        detail: "Damages the nerve fiber (axon) itself rather than its insulation, weakening the signal instead of slowing it down.",
      },
      [
        [
          {
            id: "cmt2",
            label: "CMT2",
            detail: "The second most common category. Axonal and usually autosomal dominant, with symptoms that can look similar to CMT1 but often appear a bit later.",
          },
          [
            { id: "cmt2a", label: "CMT2A", detail: "Caused by mutations in the MFN2 gene. The most common axonal (CMT2) subtype." },
            { id: "cmt2b", label: "CMT2B", detail: "Caused by mutations in the RAB7A gene — notable for causing prominent loss of sensation and skin ulcers." },
            "CMT2E",
          ],
        ],
      ],
    ],
    [
      {
        id: "intermediate",
        label: "Intermediate",
        detail: "Shows overlapping features of both demyelinating and axonal CMT, which is why it's classified as its own category.",
      },
      [
        [
          {
            id: "dicmt",
            label: "DI-CMT",
            detail: "Dominant Intermediate CMT — shows a mix of demyelinating and axonal nerve damage rather than fitting cleanly into either category.",
          },
          ["DI-CMTA", "DI-CMTB"],
        ],
      ],
    ],
    [
      {
        id: "xlinked",
        label: "X-linked",
        detail: "Caused by mutations on the X chromosome. Severity often differs between males and females, even within the same family.",
      },
      [
        [
          {
            id: "cmtx",
            label: "CMTX",
            detail: "X-linked inheritance. CMTX1 is by far the most common form.",
          },
          [
            { id: "cmtx1", label: "CMTX1", detail: "Caused by mutations in the GJB1 gene (connexin-32). The most common X-linked CMT subtype — males are often affected more severely than females." },
            "(TBD)",
          ],
        ],
      ],
    ],
  ],
];

// Not part of the hierarchy above on purpose — see buildSubtypeTree's
// `floatingNodes` option, and the big comment block below, for why.
const autosomalDominantDetail =
  "Just one copy of the mutated gene, inherited from either parent, is enough to cause the condition — the most common inheritance pattern across CMT overall.";

function buildSubtypeTree(): HTMLElement {
  const tree = createTree(cmtTreeData, {
    orientation: "vertical",
    lineColor: theme.accent,
    levelGap: "48px",
    fontFamily: fontSans,
    textColor: theme.ink,
    floatingNodes: [
      {
        person: { id: "autosomal-dominant", label: "Autosomal Dominant", detail: autosomalDominantDetail },
        anchorId: "autosomal-recessive",
        // nudged from a dead-even row-align with Autosomal Recessive — the
        // original nudge was 20px left / 24px up; this is 3x that up-left,
        // plus one more of the same nudge back down-and-left
        offsetX: "-40px",
        offsetY: "-48px",
      },
    ],
    connections: [
      { from: "autosomal-dominant", to: "cmt1", style: "elbow", color: theme.accentBlue },
      { from: "autosomal-dominant", to: "cmt2", style: "elbow", color: theme.accentBlue },
      { from: "autosomal-dominant", to: "dicmt", style: "elbow", color: theme.accentBlue },
    ],
    // root (depth 0) rendered bigger than every level under it
    levelStyles: [{ fontFamily: fontSerif, fontSize: "22px", fontWeight: "700", padding: "14px 26px" }],
  });

  const viewport = createPannableViewport(tree, {
    width: "100%",
    height: "480px",
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "12px",
    padding: "32px",
  });

  return createSection(
    [
      eyebrow("Explore the Family Tree"),
      heading("*CMT* Subtypes", "26px"),
      bodyText("Click any node for more detail, or click and drag inside the box below to explore the full tree."),
      viewport,
    ],
    { backgroundColor: theme.bandLight, gap: "16px", alignItems: "center" }
  );
}

// ----------------------------------------------------------------------------
// SECTION 6: "Hope is on the horizon" gene-therapy call-to-action
// Both buttons are placeholders — createButton()'s onClick is left unset,
// so they render and feel clickable but don't do anything yet.
// ----------------------------------------------------------------------------
function buildHopeCtaSection(): HTMLElement {
  const icon = createTextBox("🧬", { fontSize: "28px", textAlign: "center" });

  const buttons = createBigBlock(
    [
      createButton("Explore Gene Therapy →", {
        backgroundColor: theme.accent,
        textColor: theme.ink,
        fontFamily: fontSans,
      }),
      createButton("Support the Research", {
        backgroundColor: theme.cardBg,
        textColor: theme.ink,
        border: `1px solid ${theme.border}`,
        fontFamily: fontSans,
      }),
    ],
    { gap: "16px", justifyContent: "center", padding: "0" },
    "row"
  );

  const section = createSection(
    [
      icon,
      heading("Hope is on the horizon", "40px", { textAlign: "center" }),
      bodyText(
        "Gene therapy is opening a new chapter for CMT. Researchers are now targeting the disease at its genetic source, and several approaches are moving toward clinical trials.",
        { textAlign: "center" }
      ),
      buttons,
    ],
    { backgroundColor: theme.bandSoft, alignItems: "center", gap: "20px", contentPadding: "72px 24px" }
  );

  section.style.position = "relative";
  section.style.overflow = "hidden";
  section.append(
    decorativeMark("★", { top: "30px", left: "10%", size: "14px" }),
    decorativeMark("★", { top: "50px", right: "14%", size: "16px" }),
    decorativeMark("★", { bottom: "30px", left: "20%", size: "12px" }),
    decorativeMark("★", { bottom: "50px", right: "8%", size: "12px" })
  );

  return section;
}

// ----------------------------------------------------------------------------
// Assemble the page
// ----------------------------------------------------------------------------
const page = document.getElementById("app")!;
mount(buildHeroSection(), page);
mount(buildHeadingSection(), page);
mount(buildHalfHalfSection(), page);
mount(buildFamilyQuoteSection(), page);
mount(buildSymptomsGrid(), page);
mount(buildSubtypeTree(), page);
mount(buildHopeCtaSection(), page);