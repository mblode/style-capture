import type { CaptureResult, ElementSnapshot } from "@/lib/types.ts";

export type TailwindConfidenceLabel = "high" | "medium" | "low";
type TailwindMatchStrategy = "arbitrary" | "heuristic" | "scale" | "semantic";

export interface TailwindElementMapping {
  className: string;
  confidence: number;
  confidenceLabel: TailwindConfidenceLabel;
  elementId: string;
  matchCount: number;
  matches: TailwindMatch[];
  reviewClassName: string;
  reviewMatchCount: number;
  selector: string;
  suggestedClassName: string;
  suggestedMatchCount: number;
  tagName: string;
  unsupported: TailwindUnsupportedProperty[];
}

export interface TailwindMappingResult {
  elements: Record<string, TailwindElementMapping>;
  order: string[];
  reviewQueue: TailwindReviewItem[];
  summary: TailwindMappingSummary;
}

export interface TailwindMappingSummary {
  averageConfidence: number;
  cleanUtilityCount: number;
  elementCount: number;
  lowConfidenceElementCount: number;
  mappedElementCount: number;
  reviewCount: number;
  reviewUtilityCount: number;
  unsupportedPropertyCount: number;
  utilityCount: number;
}

interface TailwindMatch {
  confidence: number;
  label: TailwindConfidenceLabel;
  notes: string[];
  sourceProperties: string[];
  sourceValues: string[];
  strategy: TailwindMatchStrategy;
  utility: string;
}

export interface TailwindReviewItem {
  confidence: number;
  confidenceLabel: TailwindConfidenceLabel;
  elementId: string;
  reasons: string[];
  selector: string;
  unsupportedCount: number;
}

interface TailwindUnsupportedProperty {
  property: string;
  reason: string;
  value: string;
}

interface MatchCandidate {
  confidence: number;
  notes?: string[];
  strategy: TailwindMatchStrategy;
  utility: string;
}

type TailwindMatchInput = Omit<TailwindMatch, "label" | "notes"> & {
  notes?: string[];
};

interface MappingAccumulator {
  classes: string[];
  classSet: Set<string>;
  matches: TailwindMatch[];
  unsupported: TailwindUnsupportedProperty[];
}

interface MappingContext {
  element: ElementSnapshot;
  parent: ElementSnapshot | null;
}

type MappingStep = (
  context: MappingContext,
  accumulator: MappingAccumulator
) => void;

const HIGH_CONFIDENCE = 0.92;
const MEDIUM_CONFIDENCE = 0.72;
const LOW_CONFIDENCE = 0.45;
const PASSIVE_CONFIDENCE = 0.84;

const LENGTH_PATTERN = /^(-?\d*\.?\d+)(px|rem|em|%|vh|vw)?$/;
const RGB_PATTERN = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)$/;
const WHITESPACE_SPLIT_PATTERN = /\s+/;

const SPACING_SCALE = new Map<number, string>([
  [0, "0"],
  [1, "px"],
  [2, "0.5"],
  [4, "1"],
  [6, "1.5"],
  [8, "2"],
  [10, "2.5"],
  [12, "3"],
  [14, "3.5"],
  [16, "4"],
  [20, "5"],
  [24, "6"],
  [28, "7"],
  [32, "8"],
  [36, "9"],
  [40, "10"],
  [44, "11"],
  [48, "12"],
  [56, "14"],
  [64, "16"],
  [80, "20"],
  [96, "24"],
  [112, "28"],
  [128, "32"],
  [144, "36"],
  [160, "40"],
  [176, "44"],
  [192, "48"],
  [224, "56"],
  [256, "64"],
  [288, "72"],
  [320, "80"],
  [384, "96"],
]);

const FONT_SIZE_SCALE = new Map<number, string>([
  [12, "xs"],
  [14, "sm"],
  [16, "base"],
  [18, "lg"],
  [20, "xl"],
  [24, "2xl"],
  [30, "3xl"],
  [36, "4xl"],
  [48, "5xl"],
  [60, "6xl"],
  [72, "7xl"],
  [96, "8xl"],
  [128, "9xl"],
]);

const LINE_HEIGHT_SCALE = new Map<number, string>([
  [12, "3"],
  [16, "4"],
  [20, "5"],
  [24, "6"],
  [28, "7"],
  [32, "8"],
  [36, "9"],
  [40, "10"],
]);

const RADIUS_SCALE = new Map<number, string>([
  [0, "none"],
  [2, "sm"],
  [4, ""],
  [6, "md"],
  [8, "lg"],
  [12, "xl"],
  [16, "2xl"],
  [24, "3xl"],
]);

const BORDER_WIDTH_SCALE = new Map<number, string>([
  [1, ""],
  [2, "2"],
  [4, "4"],
  [8, "8"],
]);

const Z_INDEX_SCALE = new Set([0, 10, 20, 30, 40, 50]);
const OPACITY_SCALE = new Set([
  0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
  100,
]);

const CLEAN_ARBITRARY_SOURCE_PROPERTIES = new Set([
  "background-color",
  "border-color",
  "color",
  "text-decoration-color",
]);

const REVIEW_ONLY_SOURCE_PROPERTIES = new Set([
  "background-image",
  "bottom",
  "font-family",
  "grid-template-columns",
  "grid-template-rows",
  "height",
  "left",
  "pseudo-elements",
  "right",
  "top",
  "transform",
  "transform-origin",
  "width",
]);

const DISPLAY_MAP = {
  contents: "contents",
  flex: "flex",
  "flow-root": "flow-root",
  grid: "grid",
  inline: "inline",
  "inline-block": "inline-block",
  "inline-flex": "inline-flex",
  "inline-grid": "inline-grid",
  none: "hidden",
} satisfies Record<string, string>;

const POSITION_MAP = {
  absolute: "absolute",
  fixed: "fixed",
  relative: "relative",
  sticky: "sticky",
} satisfies Record<string, string>;

const FLEX_DIRECTION_MAP = {
  column: "flex-col",
  "column-reverse": "flex-col-reverse",
  "row-reverse": "flex-row-reverse",
} satisfies Record<string, string>;

const FLEX_WRAP_MAP = {
  wrap: "flex-wrap",
  "wrap-reverse": "flex-wrap-reverse",
} satisfies Record<string, string>;

const ALIGN_ITEMS_MAP = {
  baseline: "items-baseline",
  center: "items-center",
  end: "items-end",
  "flex-end": "items-end",
  "flex-start": "items-start",
  start: "items-start",
} satisfies Record<string, string>;

const JUSTIFY_CONTENT_MAP = {
  center: "justify-center",
  end: "justify-end",
  "flex-end": "justify-end",
  "flex-start": "justify-start",
  left: "justify-start",
  right: "justify-end",
  "space-around": "justify-around",
  "space-between": "justify-between",
  "space-evenly": "justify-evenly",
  start: "justify-start",
} satisfies Record<string, string>;

const GRID_AUTO_FLOW_MAP = {
  column: "grid-flow-col",
  "column dense": "grid-flow-col-dense",
  dense: "grid-flow-dense",
  "row dense": "grid-flow-row-dense",
} satisfies Record<string, string>;

const TEXT_ALIGN_MAP = {
  center: "text-center",
  end: "text-end",
  justify: "text-justify",
  right: "text-right",
} satisfies Record<string, string>;

const TEXT_TRANSFORM_MAP = {
  capitalize: "capitalize",
  lowercase: "lowercase",
  uppercase: "uppercase",
} satisfies Record<string, string>;

const WHITE_SPACE_MAP = {
  "break-spaces": "whitespace-break-spaces",
  nowrap: "whitespace-nowrap",
  pre: "whitespace-pre",
  "pre-line": "whitespace-pre-line",
  "pre-wrap": "whitespace-pre-wrap",
} satisfies Record<string, string>;

const LIST_STYLE_MAP = {
  decimal: "list-decimal",
  none: "list-none",
} satisfies Record<string, string>;

const OBJECT_FIT_MAP = {
  contain: "object-contain",
  cover: "object-cover",
  none: "object-none",
  "scale-down": "object-scale-down",
} satisfies Record<string, string>;

const OVERFLOW_MAP = {
  auto: "auto",
  clip: "clip",
  hidden: "hidden",
  scroll: "scroll",
  visible: "visible",
} satisfies Record<string, string>;

const BORDER_STYLE_MAP = {
  dashed: "border-dashed",
  dotted: "border-dotted",
  double: "border-double",
} satisfies Record<string, string>;

const FONT_WEIGHT_MAP = {
  "100": "thin",
  "200": "extralight",
  "300": "light",
  "500": "medium",
  "600": "semibold",
  "700": "bold",
  "800": "extrabold",
  "900": "black",
} satisfies Record<string, string>;

const MAPPING_STEPS: MappingStep[] = [
  mapDisplay,
  mapPositioning,
  mapFlexLayout,
  mapGridLayout,
  mapSpacing,
  mapSizing,
  mapTypographyBasics,
  mapTypographyPresentation,
  mapBackground,
  mapBorder,
  mapEffects,
  mapOverflow,
  mapObjectLayout,
  mapPseudoElements,
];

export function mapCaptureToTailwind(
  capture: CaptureResult
): TailwindMappingResult {
  const elements: Record<string, TailwindElementMapping> = {};
  const reviewQueue: TailwindReviewItem[] = [];
  let cleanUtilityCount = 0;
  let confidenceSum = 0;
  let lowConfidenceElementCount = 0;
  let mappedElementCount = 0;
  let reviewUtilityCount = 0;
  let unsupportedPropertyCount = 0;
  let utilityCount = 0;

  for (const elementId of capture.order) {
    const element = capture.elements[elementId];
    if (!element) {
      continue;
    }

    const parent =
      element.parentId === null
        ? null
        : (capture.elements[element.parentId] ?? null);
    const mapping = mapElementSnapshot({
      element,
      parent,
    });
    elements[elementId] = mapping;

    confidenceSum += mapping.confidence;
    if (mapping.confidenceLabel === "low") {
      lowConfidenceElementCount += 1;
    }
    if (mapping.matchCount > 0) {
      mappedElementCount += 1;
    }

    unsupportedPropertyCount += mapping.unsupported.length;
    cleanUtilityCount += mapping.suggestedMatchCount;
    reviewUtilityCount += mapping.reviewMatchCount;
    utilityCount += mapping.matches.length;

    const reviewItem = buildReviewItem(mapping);
    if (reviewItem) {
      reviewQueue.push(reviewItem);
    }
  }

  reviewQueue.sort((left, right) => {
    if (left.confidence !== right.confidence) {
      return left.confidence - right.confidence;
    }

    return right.unsupportedCount - left.unsupportedCount;
  });

  const elementCount = capture.order.length;

  return {
    elements,
    order: capture.order,
    reviewQueue,
    summary: {
      averageConfidence: elementCount
        ? roundToTwo(confidenceSum / elementCount)
        : 0,
      cleanUtilityCount,
      elementCount,
      lowConfidenceElementCount,
      mappedElementCount,
      reviewCount: reviewQueue.length,
      reviewUtilityCount,
      unsupportedPropertyCount,
      utilityCount,
    },
  };
}

function mapElementSnapshot(context: MappingContext): TailwindElementMapping {
  const accumulator = createAccumulator();

  for (const step of MAPPING_STEPS) {
    step(context, accumulator);
  }

  const confidence = calculateElementConfidence(accumulator);
  const { reviewMatches, suggestedMatches } = splitMatchesForSuggestion(
    accumulator.matches
  );

  return {
    className: accumulator.classes.join(" "),
    confidence,
    confidenceLabel: labelFromConfidence(confidence),
    elementId: context.element.id,
    matchCount: accumulator.matches.length,
    matches: accumulator.matches,
    reviewClassName: reviewMatches.map((match) => match.utility).join(" "),
    reviewMatchCount: reviewMatches.length,
    selector: context.element.selector,
    suggestedClassName: suggestedMatches
      .map((match) => match.utility)
      .join(" "),
    suggestedMatchCount: suggestedMatches.length,
    tagName: context.element.tagName,
    unsupported: accumulator.unsupported,
  };
}

function createAccumulator(): MappingAccumulator {
  return {
    classes: [],
    classSet: new Set<string>(),
    matches: [],
    unsupported: [],
  };
}

function mapDisplay(
  context: MappingContext,
  accumulator: MappingAccumulator
): void {
  const display = context.element.styles.display;
  if (!display || display === "block") {
    return;
  }

  const utility = lookupMappedUtility(DISPLAY_MAP, display);
  if (utility) {
    addMatch(accumulator, {
      confidence: HIGH_CONFIDENCE,
      sourceProperties: ["display"],
      sourceValues: [display],
      strategy: "semantic",
      utility,
    });
    return;
  }

  addUnsupported(
    accumulator,
    "display",
    display,
    "Display needs manual review."
  );
}

function mapPositioning(
  context: MappingContext,
  accumulator: MappingAccumulator
): void {
  const { styles } = context.element;
  const position = styles.position;
  if (position && position !== "static") {
    const utility = lookupMappedUtility(POSITION_MAP, position);
    if (utility) {
      addMatch(accumulator, {
        confidence: HIGH_CONFIDENCE,
        sourceProperties: ["position"],
        sourceValues: [position],
        strategy: "semantic",
        utility,
      });
    }
  }

  if (!position || position === "static") {
    return;
  }

  for (const property of ["top", "right", "bottom", "left"] as const) {
    const value = styles[property];
    if (!value || value === "auto") {
      continue;
    }

    const candidate = buildDimensionCandidate(property, value, {
      confidence: LOW_CONFIDENCE,
      note: "Computed insets are layout-derived and need review.",
    });
    addCandidateMatch(accumulator, property, value, candidate);
  }

  const zIndex = styles["z-index"];
  if (!zIndex || zIndex === "auto") {
    return;
  }

  addCandidateMatch(
    accumulator,
    "z-index",
    zIndex,
    buildZIndexCandidate(zIndex)
  );
}

function mapFlexLayout(
  context: MappingContext,
  accumulator: MappingAccumulator
): void {
  const { styles } = context.element;
  const display = styles.display;
  if (display !== "flex" && display !== "inline-flex") {
    return;
  }

  addMappedUtility(
    accumulator,
    "flex-direction",
    styles["flex-direction"],
    FLEX_DIRECTION_MAP
  );
  addMappedUtility(
    accumulator,
    "flex-wrap",
    styles["flex-wrap"],
    FLEX_WRAP_MAP
  );
  addMappedUtility(
    accumulator,
    "justify-content",
    styles["justify-content"],
    JUSTIFY_CONTENT_MAP
  );
  addMappedUtility(
    accumulator,
    "align-items",
    styles["align-items"],
    ALIGN_ITEMS_MAP
  );
  addGapMatches(
    accumulator,
    styles.gap,
    styles["row-gap"],
    styles["column-gap"]
  );
  addFlexNumberMatch(accumulator, "flex-grow", styles["flex-grow"], "grow");
  addFlexNumberMatch(
    accumulator,
    "flex-shrink",
    styles["flex-shrink"],
    "shrink"
  );

  const basis = styles["flex-basis"];
  if (!basis || basis === "auto") {
    return;
  }

  addCandidateMatch(
    accumulator,
    "flex-basis",
    basis,
    buildDimensionCandidate("basis", basis, {
      confidence: MEDIUM_CONFIDENCE,
    })
  );
}

function mapGridLayout(
  context: MappingContext,
  accumulator: MappingAccumulator
): void {
  const { styles } = context.element;
  const display = styles.display;
  if (display !== "grid" && display !== "inline-grid") {
    return;
  }

  addGapMatches(
    accumulator,
    styles.gap,
    styles["row-gap"],
    styles["column-gap"]
  );
  addMappedUtility(
    accumulator,
    "grid-auto-flow",
    styles["grid-auto-flow"],
    GRID_AUTO_FLOW_MAP
  );

  for (const [property, prefix] of [
    ["grid-column-start", "col-start"],
    ["grid-column-end", "col-end"],
    ["grid-row-start", "row-start"],
    ["grid-row-end", "row-end"],
  ] as const) {
    const value = styles[property];
    if (!value || value === "auto") {
      continue;
    }

    addMatch(accumulator, {
      confidence: MEDIUM_CONFIDENCE,
      sourceProperties: [property],
      sourceValues: [value],
      strategy: "arbitrary",
      utility: createArbitraryUtility(prefix, value),
    });
  }

  addArbitraryPropertyMatch(
    accumulator,
    "grid-template-columns",
    styles["grid-template-columns"],
    "Computed grid tracks lose authored repeat syntax."
  );
  addArbitraryPropertyMatch(
    accumulator,
    "grid-template-rows",
    styles["grid-template-rows"],
    "Computed grid tracks lose authored repeat syntax."
  );
}

function mapSpacing(
  context: MappingContext,
  accumulator: MappingAccumulator
): void {
  addBoxSpacingMatches(accumulator, "p", [
    ["padding-top", context.element.styles["padding-top"]],
    ["padding-right", context.element.styles["padding-right"]],
    ["padding-bottom", context.element.styles["padding-bottom"]],
    ["padding-left", context.element.styles["padding-left"]],
  ]);
  addBoxSpacingMatches(accumulator, "m", [
    ["margin-top", context.element.styles["margin-top"]],
    ["margin-right", context.element.styles["margin-right"]],
    ["margin-bottom", context.element.styles["margin-bottom"]],
    ["margin-left", context.element.styles["margin-left"]],
  ]);
}

function mapSizing(
  context: MappingContext,
  accumulator: MappingAccumulator
): void {
  const { styles } = context.element;

  for (const [property, prefix, confidence] of [
    ["min-width", "min-w", MEDIUM_CONFIDENCE],
    ["min-height", "min-h", MEDIUM_CONFIDENCE],
    ["max-width", "max-w", MEDIUM_CONFIDENCE],
    ["max-height", "max-h", MEDIUM_CONFIDENCE],
    ["width", "w", LOW_CONFIDENCE],
    ["height", "h", LOW_CONFIDENCE],
  ] as const) {
    const value = styles[property];
    if (!shouldMapDimension(property, value)) {
      continue;
    }

    addCandidateMatch(
      accumulator,
      property,
      value,
      buildDimensionCandidate(prefix, value, {
        confidence,
        note:
          property === "width" || property === "height"
            ? "Computed size values are often layout-dependent."
            : undefined,
      })
    );
  }
}

function mapTypographyBasics(
  context: MappingContext,
  accumulator: MappingAccumulator
): void {
  const { element, parent } = context;

  addColorMatch(
    accumulator,
    "text",
    "color",
    element.styles.color,
    shouldEmitInheritedValue(
      "color",
      element.styles.color,
      parent?.styles.color
    )
  );
  addFontFamilyMatch(
    accumulator,
    element.styles["font-family"],
    shouldEmitInheritedValue(
      "font-family",
      element.styles["font-family"],
      parent?.styles["font-family"]
    )
  );
  addScaleMatch(
    accumulator,
    "font-size",
    element.styles["font-size"],
    shouldEmitInheritedValue(
      "font-size",
      element.styles["font-size"],
      parent?.styles["font-size"]
    ),
    FONT_SIZE_SCALE,
    "text",
    "Font size required an arbitrary value."
  );
  addFontWeightMatch(
    accumulator,
    element.styles["font-weight"],
    shouldEmitInheritedValue(
      "font-weight",
      element.styles["font-weight"],
      parent?.styles["font-weight"]
    )
  );
  addFontStyleMatch(
    accumulator,
    element.styles["font-style"],
    shouldEmitInheritedValue(
      "font-style",
      element.styles["font-style"],
      parent?.styles["font-style"]
    )
  );
  addScaleMatch(
    accumulator,
    "line-height",
    element.styles["line-height"],
    shouldEmitInheritedValue(
      "line-height",
      element.styles["line-height"],
      parent?.styles["line-height"]
    ) && element.styles["line-height"] !== "normal",
    LINE_HEIGHT_SCALE,
    "leading",
    "Line height required an arbitrary value."
  );
  addTrackingMatch(
    accumulator,
    element.styles["letter-spacing"],
    shouldEmitInheritedValue(
      "letter-spacing",
      element.styles["letter-spacing"],
      parent?.styles["letter-spacing"]
    )
  );
}

function mapTypographyPresentation(
  context: MappingContext,
  accumulator: MappingAccumulator
): void {
  const { element, parent } = context;

  addMappedUtility(
    accumulator,
    "text-align",
    element.styles["text-align"],
    TEXT_ALIGN_MAP,
    shouldEmitInheritedValue(
      "text-align",
      element.styles["text-align"],
      parent?.styles["text-align"]
    ) && !["left", "start"].includes(element.styles["text-align"] ?? "")
  );
  addMappedUtility(
    accumulator,
    "text-transform",
    element.styles["text-transform"],
    TEXT_TRANSFORM_MAP,
    shouldEmitInheritedValue(
      "text-transform",
      element.styles["text-transform"],
      parent?.styles["text-transform"]
    ) && element.styles["text-transform"] !== "none"
  );
  addMappedUtility(
    accumulator,
    "white-space",
    element.styles["white-space"],
    WHITE_SPACE_MAP,
    shouldEmitInheritedValue(
      "white-space",
      element.styles["white-space"],
      parent?.styles["white-space"]
    ) && element.styles["white-space"] !== "normal"
  );
  addMappedUtility(
    accumulator,
    "list-style-type",
    element.styles["list-style-type"],
    LIST_STYLE_MAP,
    shouldEmitInheritedValue(
      "list-style-type",
      element.styles["list-style-type"],
      parent?.styles["list-style-type"]
    ) && element.styles["list-style-type"] !== "disc"
  );
  addDecorationLineMatches(accumulator, element.styles["text-decoration-line"]);
  addColorMatch(
    accumulator,
    "decoration",
    "text-decoration-color",
    element.styles["text-decoration-color"],
    element.styles["text-decoration-line"] !== "none" &&
      Boolean(element.styles["text-decoration-color"])
  );
}

function mapBackground(
  context: MappingContext,
  accumulator: MappingAccumulator
): void {
  addColorMatch(
    accumulator,
    "bg",
    "background-color",
    context.element.styles["background-color"],
    !isTransparentColor(context.element.styles["background-color"] ?? "")
  );
  addArbitraryPropertyMatch(
    accumulator,
    "background-image",
    context.element.styles["background-image"],
    "Background images are emitted as arbitrary properties."
  );
}

function mapBorder(
  context: MappingContext,
  accumulator: MappingAccumulator
): void {
  addUniformBorderMatch(context.element, accumulator);
  addRadiusMatches(context.element, accumulator);
}

function mapEffects(
  context: MappingContext,
  accumulator: MappingAccumulator
): void {
  const { styles } = context.element;
  addShadowMatch(accumulator, styles["box-shadow"]);
  addOpacityMatch(accumulator, styles.opacity);
  addArbitraryPropertyMatch(
    accumulator,
    "transform",
    styles.transform,
    "Computed transforms are emitted as raw properties."
  );
  addTransformOriginMatch(accumulator, styles["transform-origin"]);

  if (styles.visibility === "hidden") {
    addMatch(accumulator, {
      confidence: HIGH_CONFIDENCE,
      sourceProperties: ["visibility"],
      sourceValues: ["hidden"],
      strategy: "semantic",
      utility: "invisible",
    });
  }
}

function mapOverflow(
  context: MappingContext,
  accumulator: MappingAccumulator
): void {
  const overflowX = context.element.styles["overflow-x"];
  const overflowY = context.element.styles["overflow-y"];
  if (!(overflowX && overflowY)) {
    return;
  }

  if (overflowX === overflowY && overflowX !== "visible") {
    const suffix = lookupMappedUtility(OVERFLOW_MAP, overflowX);
    if (suffix) {
      addMatch(accumulator, {
        confidence: HIGH_CONFIDENCE,
        sourceProperties: ["overflow-x", "overflow-y"],
        sourceValues: [overflowX, overflowY],
        strategy: "semantic",
        utility: `overflow-${suffix}`,
      });
    }
    return;
  }

  addOverflowAxisMatch(accumulator, "overflow-x", overflowX);
  addOverflowAxisMatch(accumulator, "overflow-y", overflowY);
}

function mapObjectLayout(
  context: MappingContext,
  accumulator: MappingAccumulator
): void {
  const objectFit = context.element.styles["object-fit"];
  if (objectFit && objectFit !== "fill") {
    const utility = lookupMappedUtility(OBJECT_FIT_MAP, objectFit);
    if (utility) {
      addMatch(accumulator, {
        confidence: HIGH_CONFIDENCE,
        sourceProperties: ["object-fit"],
        sourceValues: [objectFit],
        strategy: "semantic",
        utility,
      });
    }
  }

  addObjectPositionMatch(
    accumulator,
    context.element.styles["object-position"]
  );
}

function mapPseudoElements(
  context: MappingContext,
  accumulator: MappingAccumulator
): void {
  const pseudoKinds = Object.keys(context.element.pseudo);
  if (pseudoKinds.length === 0) {
    return;
  }

  addUnsupported(
    accumulator,
    "pseudo-elements",
    pseudoKinds.join(", "),
    "Pseudo-elements were captured, but Tailwind output still needs manual content utilities."
  );
}

function addMappedUtility(
  accumulator: MappingAccumulator,
  property: string,
  value: string | undefined,
  map: Record<string, string>,
  shouldAdd = true
): void {
  if (!(shouldAdd && value)) {
    return;
  }

  const utility = lookupMappedUtility(map, value);
  if (!utility) {
    addUnsupported(
      accumulator,
      property,
      value,
      `${property} needs manual review.`
    );
    return;
  }

  addMatch(accumulator, {
    confidence: HIGH_CONFIDENCE,
    sourceProperties: [property],
    sourceValues: [value],
    strategy: "semantic",
    utility,
  });
}

function addGapMatches(
  accumulator: MappingAccumulator,
  gap: string | undefined,
  rowGap: string | undefined,
  columnGap: string | undefined
): void {
  if (gap && gap !== "normal" && !isZeroLength(gap)) {
    addCandidateMatch(
      accumulator,
      "gap",
      gap,
      buildSpacingCandidate("gap", gap, false)
    );
    return;
  }

  addCandidateMatch(
    accumulator,
    "row-gap",
    rowGap,
    rowGap ? buildSpacingCandidate("gap-y", rowGap, false) : null
  );
  addCandidateMatch(
    accumulator,
    "column-gap",
    columnGap,
    columnGap ? buildSpacingCandidate("gap-x", columnGap, false) : null
  );
}

function addFlexNumberMatch(
  accumulator: MappingAccumulator,
  property: "flex-grow" | "flex-shrink",
  value: string | undefined,
  prefix: "grow" | "shrink"
): void {
  if (!value) {
    return;
  }

  let utility = createArbitraryUtility(prefix, value);
  if (value === "1") {
    utility = prefix;
  } else if (value === "0") {
    utility = `${prefix}-0`;
  }

  const confidence =
    value === "0" || value === "1" ? HIGH_CONFIDENCE : LOW_CONFIDENCE;
  const strategy: TailwindMatchStrategy =
    value === "0" || value === "1" ? "semantic" : "arbitrary";
  const notes =
    strategy === "semantic" ? [] : [`${property} required an arbitrary value.`];

  addMatch(accumulator, {
    confidence,
    notes,
    sourceProperties: [property],
    sourceValues: [value],
    strategy,
    utility,
  });
}

function addBoxSpacingMatches(
  accumulator: MappingAccumulator,
  prefix: "m" | "p",
  entries: [string, string | undefined][]
): void {
  const values = entries.map((entry) => entry[1]);
  if (values.some((value) => !value)) {
    return;
  }

  const normalizedValues = values as string[];
  if (normalizedValues.every((value) => isZeroLength(value))) {
    return;
  }

  if (allEqual(normalizedValues)) {
    addCandidateMatch(
      accumulator,
      entries[0][0],
      normalizedValues[0],
      buildSpacingCandidate(prefix, normalizedValues[0], prefix === "m")
    );
    return;
  }

  addAxisSpacingMatch(
    accumulator,
    `${prefix}y`,
    entries[0],
    entries[2],
    prefix === "m"
  );
  addAxisSpacingMatch(
    accumulator,
    `${prefix}x`,
    entries[1],
    entries[3],
    prefix === "m"
  );

  addEdgeSpacingMatch(accumulator, `${prefix}t`, entries[0], prefix === "m");
  addEdgeSpacingMatch(accumulator, `${prefix}r`, entries[1], prefix === "m");
  addEdgeSpacingMatch(accumulator, `${prefix}b`, entries[2], prefix === "m");
  addEdgeSpacingMatch(accumulator, `${prefix}l`, entries[3], prefix === "m");
}

function addAxisSpacingMatch(
  accumulator: MappingAccumulator,
  prefix: string,
  first: [string, string | undefined],
  second: [string, string | undefined],
  allowNegative: boolean
): void {
  if (!(first[1] && second[1]) || first[1] !== second[1]) {
    return;
  }

  addCandidateMatch(
    accumulator,
    `${first[0]}|${second[0]}`,
    first[1],
    buildSpacingCandidate(prefix, first[1], allowNegative)
  );
}

function addEdgeSpacingMatch(
  accumulator: MappingAccumulator,
  prefix: string,
  entry: [string, string | undefined],
  allowNegative: boolean
): void {
  if (!entry[1] || isZeroLength(entry[1])) {
    return;
  }

  addCandidateMatch(
    accumulator,
    entry[0],
    entry[1],
    buildSpacingCandidate(prefix, entry[1], allowNegative)
  );
}

function addColorMatch(
  accumulator: MappingAccumulator,
  prefix: "bg" | "decoration" | "text",
  property: string,
  value: string | undefined,
  shouldAdd: boolean
): void {
  if (!(shouldAdd && value)) {
    return;
  }

  addCandidateMatch(
    accumulator,
    property,
    value,
    buildColorCandidate(prefix, value)
  );
}

function addFontFamilyMatch(
  accumulator: MappingAccumulator,
  value: string | undefined,
  shouldAdd: boolean
): void {
  if (!(shouldAdd && value)) {
    return;
  }

  addCandidateMatch(
    accumulator,
    "font-family",
    value,
    buildFontFamilyCandidate(value)
  );
}

function addScaleMatch(
  accumulator: MappingAccumulator,
  property: string,
  value: string | undefined,
  shouldAdd: boolean,
  scale: Map<number, string>,
  prefix: string,
  note: string
): void {
  if (!(shouldAdd && value)) {
    return;
  }

  addCandidateMatch(
    accumulator,
    property,
    value,
    buildScaleCandidate(prefix, value, scale, note)
  );
}

function addFontWeightMatch(
  accumulator: MappingAccumulator,
  value: string | undefined,
  shouldAdd: boolean
): void {
  if (!(shouldAdd && value) || value === "400") {
    return;
  }

  const utility = lookupMappedUtility(FONT_WEIGHT_MAP, value);
  addMatch(accumulator, {
    confidence: utility ? HIGH_CONFIDENCE : LOW_CONFIDENCE,
    notes: utility ? [] : ["Font weight required an arbitrary value."],
    sourceProperties: ["font-weight"],
    sourceValues: [value],
    strategy: utility ? "semantic" : "arbitrary",
    utility: utility
      ? `font-${utility}`
      : createArbitraryUtility("font", value),
  });
}

function addFontStyleMatch(
  accumulator: MappingAccumulator,
  value: string | undefined,
  shouldAdd: boolean
): void {
  if (!(shouldAdd && value) || value === "normal") {
    return;
  }

  const utility = value === "italic" ? "italic" : "not-italic";
  addMatch(accumulator, {
    confidence: HIGH_CONFIDENCE,
    sourceProperties: ["font-style"],
    sourceValues: [value],
    strategy: "semantic",
    utility,
  });
}

function addTrackingMatch(
  accumulator: MappingAccumulator,
  value: string | undefined,
  shouldAdd: boolean
): void {
  if (!(shouldAdd && value) || value === "normal" || isZeroLength(value)) {
    return;
  }

  addMatch(accumulator, {
    confidence: LOW_CONFIDENCE,
    notes: ["Letter spacing required an arbitrary value."],
    sourceProperties: ["letter-spacing"],
    sourceValues: [value],
    strategy: "arbitrary",
    utility: createArbitraryUtility("tracking", value),
  });
}

function addDecorationLineMatches(
  accumulator: MappingAccumulator,
  value: string | undefined
): void {
  if (!value || value === "none") {
    return;
  }

  for (const part of value.split(WHITESPACE_SPLIT_PATTERN)) {
    const utility =
      {
        "line-through": "line-through",
        overline: "overline",
        underline: "underline",
      }[part] ?? null;

    if (!utility) {
      continue;
    }

    addMatch(accumulator, {
      confidence: HIGH_CONFIDENCE,
      sourceProperties: ["text-decoration-line"],
      sourceValues: [value],
      strategy: "semantic",
      utility,
    });
  }
}

function addUniformBorderMatch(
  element: ElementSnapshot,
  accumulator: MappingAccumulator
): void {
  const widths = [
    element.styles["border-top-width"],
    element.styles["border-right-width"],
    element.styles["border-bottom-width"],
    element.styles["border-left-width"],
  ];
  const styles = [
    element.styles["border-top-style"],
    element.styles["border-right-style"],
    element.styles["border-bottom-style"],
    element.styles["border-left-style"],
  ];
  const colors = [
    element.styles["border-top-color"],
    element.styles["border-right-color"],
    element.styles["border-bottom-color"],
    element.styles["border-left-color"],
  ];

  if (
    widths.some((value) => !value || isZeroLength(value)) ||
    styles.some((value) => !value || value === "none")
  ) {
    return;
  }

  if (
    !(
      allEqual(widths as string[]) &&
      allEqual(styles as string[]) &&
      allEqual(colors as string[])
    )
  ) {
    addUnsupported(
      accumulator,
      "border",
      "mixed sides",
      "Per-side border variations need manual review."
    );
    return;
  }

  const width = widths[0] as string;
  const borderStyle = styles[0] as string;
  const color = colors[0] as string;

  addCandidateMatch(
    accumulator,
    "border-width",
    width,
    buildBorderWidthCandidate("border", width)
  );

  if (borderStyle !== "solid") {
    const utility = lookupMappedUtility(BORDER_STYLE_MAP, borderStyle);
    if (utility) {
      addMatch(accumulator, {
        confidence: HIGH_CONFIDENCE,
        sourceProperties: ["border-style"],
        sourceValues: [borderStyle],
        strategy: "semantic",
        utility,
      });
    } else {
      addUnsupported(
        accumulator,
        "border-style",
        borderStyle,
        "Border style needs manual review."
      );
    }
  }

  addCandidateMatch(
    accumulator,
    "border-color",
    color,
    buildBorderColorCandidate(color)
  );
}

function addRadiusMatches(
  element: ElementSnapshot,
  accumulator: MappingAccumulator
): void {
  const values = [
    element.styles["border-top-left-radius"],
    element.styles["border-top-right-radius"],
    element.styles["border-bottom-right-radius"],
    element.styles["border-bottom-left-radius"],
  ];

  if (
    values.some((value) => !value) ||
    values.every((value) => isZeroLength(value as string))
  ) {
    return;
  }

  const radiusValues = values as string[];
  if (allEqual(radiusValues)) {
    addCandidateMatch(
      accumulator,
      "border-radius",
      radiusValues[0],
      buildRadiusCandidate("rounded", radiusValues[0])
    );
    return;
  }

  addUnsupported(
    accumulator,
    "border-radius",
    radiusValues.join(", "),
    "Mixed corner radii need manual review."
  );
}

function addShadowMatch(
  accumulator: MappingAccumulator,
  value: string | undefined
): void {
  if (!value || value === "none") {
    return;
  }

  addMatch(accumulator, {
    confidence: MEDIUM_CONFIDENCE,
    sourceProperties: ["box-shadow"],
    sourceValues: [value],
    strategy: "arbitrary",
    utility: createArbitraryUtility("shadow", value),
  });
}

function addOpacityMatch(
  accumulator: MappingAccumulator,
  value: string | undefined
): void {
  if (!value || value === "1") {
    return;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return;
  }

  const percent = Math.round(numericValue * 100);
  const semantic = OPACITY_SCALE.has(percent);
  addMatch(accumulator, {
    confidence: semantic ? MEDIUM_CONFIDENCE : LOW_CONFIDENCE,
    notes: semantic ? [] : ["Opacity required an arbitrary value."],
    sourceProperties: ["opacity"],
    sourceValues: [value],
    strategy: semantic ? "scale" : "arbitrary",
    utility: semantic
      ? `opacity-${percent}`
      : createArbitraryUtility("opacity", value),
  });
}

function addTransformOriginMatch(
  accumulator: MappingAccumulator,
  value: string | undefined
): void {
  if (!value || value === "50% 50%") {
    return;
  }

  const named =
    {
      "0% 0%": "origin-top-left",
      "0% 50%": "origin-left",
      "0% 100%": "origin-bottom-left",
      "100% 0%": "origin-top-right",
      "100% 50%": "origin-right",
      "100% 100%": "origin-bottom-right",
      "50% 0%": "origin-top",
      "50% 100%": "origin-bottom",
    }[normalizeWhitespace(value)] ?? null;

  addMatch(accumulator, {
    confidence: named ? HIGH_CONFIDENCE : MEDIUM_CONFIDENCE,
    notes: named ? [] : ["Transform origin required an arbitrary value."],
    sourceProperties: ["transform-origin"],
    sourceValues: [value],
    strategy: named ? "semantic" : "arbitrary",
    utility: named ?? createArbitraryUtility("origin", value),
  });
}

function addOverflowAxisMatch(
  accumulator: MappingAccumulator,
  property: "overflow-x" | "overflow-y",
  value: string
): void {
  if (value === "visible") {
    return;
  }

  const suffix = lookupMappedUtility(OVERFLOW_MAP, value);
  if (!suffix) {
    addUnsupported(
      accumulator,
      property,
      value,
      "Overflow needs manual review."
    );
    return;
  }

  addMatch(accumulator, {
    confidence: HIGH_CONFIDENCE,
    sourceProperties: [property],
    sourceValues: [value],
    strategy: "semantic",
    utility: `${property}-${suffix}`,
  });
}

function addObjectPositionMatch(
  accumulator: MappingAccumulator,
  value: string | undefined
): void {
  if (!value || value === "50% 50%") {
    return;
  }

  const named =
    {
      "0% 0%": "object-left-top",
      "0% 50%": "object-left",
      "0% 100%": "object-left-bottom",
      "100% 0%": "object-right-top",
      "100% 50%": "object-right",
      "100% 100%": "object-right-bottom",
      "50% 0%": "object-top",
      "50% 100%": "object-bottom",
    }[normalizeWhitespace(value)] ?? null;

  addMatch(accumulator, {
    confidence: named ? HIGH_CONFIDENCE : MEDIUM_CONFIDENCE,
    notes: named ? [] : ["Object position required an arbitrary value."],
    sourceProperties: ["object-position"],
    sourceValues: [value],
    strategy: named ? "semantic" : "arbitrary",
    utility: named ?? createArbitraryUtility("object", value),
  });
}

function addArbitraryPropertyMatch(
  accumulator: MappingAccumulator,
  property: string,
  value: string | undefined,
  note: string
): void {
  if (!value || value === "none") {
    return;
  }

  addMatch(accumulator, {
    confidence: LOW_CONFIDENCE,
    notes: [note],
    sourceProperties: [property],
    sourceValues: [value],
    strategy: "arbitrary",
    utility: createArbitraryPropertyClass(property, value),
  });
}

function addCandidateMatch(
  accumulator: MappingAccumulator,
  property: string,
  value: string | undefined,
  candidate: MatchCandidate | null
): void {
  if (!(value && candidate)) {
    return;
  }

  addMatch(accumulator, {
    confidence: candidate.confidence,
    notes: candidate.notes ?? [],
    sourceProperties: property.includes("|") ? property.split("|") : [property],
    sourceValues: [value],
    strategy: candidate.strategy,
    utility: candidate.utility,
  });
}

function addMatch(
  accumulator: MappingAccumulator,
  match: TailwindMatchInput
): void {
  const utility = match.utility.trim();
  if (!utility) {
    return;
  }

  const nextMatch: TailwindMatch = {
    ...match,
    label: labelFromConfidence(match.confidence),
    notes: dedupe(match.notes),
    sourceProperties: dedupe(match.sourceProperties),
    sourceValues: dedupe(match.sourceValues),
    utility,
  };

  const existing = accumulator.matches.find(
    (entry) => entry.utility === utility
  );
  if (existing) {
    existing.confidence = Math.max(existing.confidence, nextMatch.confidence);
    existing.label = labelFromConfidence(existing.confidence);
    existing.notes = dedupe([...existing.notes, ...nextMatch.notes]);
    existing.sourceProperties = dedupe([
      ...existing.sourceProperties,
      ...nextMatch.sourceProperties,
    ]);
    existing.sourceValues = dedupe([
      ...existing.sourceValues,
      ...nextMatch.sourceValues,
    ]);
  } else {
    accumulator.matches.push(nextMatch);
  }

  if (accumulator.classSet.has(utility)) {
    return;
  }

  accumulator.classSet.add(utility);
  accumulator.classes.push(utility);
}

function addUnsupported(
  accumulator: MappingAccumulator,
  property: string,
  value: string,
  reason: string
): void {
  const key = `${property}:${value}:${reason}`;
  const exists = accumulator.unsupported.some(
    (entry) => `${entry.property}:${entry.value}:${entry.reason}` === key
  );
  if (exists) {
    return;
  }

  accumulator.unsupported.push({
    property,
    reason,
    value,
  });
}

function buildReviewItem(
  mapping: TailwindElementMapping
): TailwindReviewItem | null {
  const reasons = [
    ...mapping.unsupported.map((entry) => `${entry.property}: ${entry.reason}`),
    ...mapping.matches
      .filter((match) => shouldMoveMatchToReview(match))
      .flatMap((match) => {
        const notes = match.notes.length
          ? match.notes
          : [buildReviewFallbackNote(match)];
        return notes.map((note) => `${match.utility}: ${note}`);
      }),
  ];

  if (reasons.length === 0) {
    return null;
  }

  return {
    confidence: mapping.confidence,
    confidenceLabel: mapping.confidenceLabel,
    elementId: mapping.elementId,
    reasons: dedupe(reasons).slice(0, 6),
    selector: mapping.selector,
    unsupportedCount: mapping.unsupported.length,
  };
}

function buildReviewFallbackNote(match: TailwindMatch): string {
  if (match.label === "low") {
    return "Low-confidence utility needs manual review.";
  }

  if (
    match.sourceProperties.some((property) =>
      REVIEW_ONLY_SOURCE_PROPERTIES.has(property)
    )
  ) {
    return "Computed layout or custom CSS was kept out of the clean suggestion.";
  }

  if (match.strategy === "arbitrary") {
    return "Arbitrary utility was kept out of the clean suggestion.";
  }

  return "Utility was kept out of the clean suggestion for review.";
}

function calculateElementConfidence(accumulator: MappingAccumulator): number {
  if (accumulator.matches.length === 0) {
    return accumulator.unsupported.length > 0
      ? LOW_CONFIDENCE
      : PASSIVE_CONFIDENCE;
  }

  const total = accumulator.matches.reduce(
    (sum, match) => sum + match.confidence,
    0
  );
  const average = total / accumulator.matches.length;

  if (accumulator.unsupported.length === 0) {
    return roundToTwo(average);
  }

  return roundToTwo(Math.max(LOW_CONFIDENCE, average - 0.12));
}

function splitMatchesForSuggestion(matches: TailwindMatch[]): {
  reviewMatches: TailwindMatch[];
  suggestedMatches: TailwindMatch[];
} {
  const reviewMatches: TailwindMatch[] = [];
  const suggestedMatches: TailwindMatch[] = [];

  for (const match of matches) {
    if (shouldMoveMatchToReview(match)) {
      reviewMatches.push(match);
    } else {
      suggestedMatches.push(match);
    }
  }

  return {
    reviewMatches,
    suggestedMatches,
  };
}

function shouldMoveMatchToReview(match: TailwindMatch): boolean {
  if (match.label === "low" || match.utility.startsWith("[")) {
    return true;
  }

  if (
    match.sourceProperties.some((property) =>
      REVIEW_ONLY_SOURCE_PROPERTIES.has(property)
    )
  ) {
    return true;
  }

  if (
    match.strategy === "arbitrary" &&
    !match.sourceProperties.every((property) =>
      CLEAN_ARBITRARY_SOURCE_PROPERTIES.has(property)
    )
  ) {
    return true;
  }

  return match.notes.some((note) => isReviewOnlyNote(note));
}

function isReviewOnlyNote(note: string): boolean {
  const normalizedNote = note.toLowerCase();

  return (
    normalizedNote.includes("manual review") ||
    normalizedNote.includes("layout-dependent") ||
    normalizedNote.includes("layout-derived") ||
    normalizedNote.includes("arbitrary property utility") ||
    normalizedNote.includes("required an arbitrary value") ||
    normalizedNote.includes("computed transforms") ||
    normalizedNote.includes("lose authored repeat syntax")
  );
}

function labelFromConfidence(confidence: number): TailwindConfidenceLabel {
  if (confidence >= 0.85) {
    return "high";
  }

  if (confidence >= 0.62) {
    return "medium";
  }

  return "low";
}

function shouldMapDimension(
  property: string,
  value: string | undefined
): value is string {
  if (!value) {
    return false;
  }

  if (property.startsWith("min-")) {
    return value !== "0px" && value !== "auto";
  }

  if (property.startsWith("max-")) {
    return value !== "none";
  }

  return value !== "auto";
}

function shouldEmitInheritedValue(
  property: string,
  value: string | undefined,
  parentValue: string | undefined
): boolean {
  if (!value) {
    return false;
  }

  if (!parentValue) {
    return true;
  }

  if (property === "color") {
    return normalizeColor(value) !== normalizeColor(parentValue);
  }

  return value !== parentValue;
}

function buildSpacingCandidate(
  prefix: string,
  value: string,
  allowNegative: boolean
): MatchCandidate | null {
  if (isZeroLength(value)) {
    return null;
  }

  if (value === "auto" && prefix.startsWith("m")) {
    return {
      confidence: HIGH_CONFIDENCE,
      strategy: "semantic",
      utility: `${prefix}-auto`,
    };
  }

  const length = parseLength(value);
  if (!length) {
    return {
      confidence: MEDIUM_CONFIDENCE,
      notes: ["Spacing required an arbitrary value."],
      strategy: "arbitrary",
      utility: createArbitraryUtility(prefix, value),
    };
  }

  if (length.value < 0 && !allowNegative) {
    return null;
  }

  const token =
    length.unit === "px" ? SPACING_SCALE.get(Math.abs(length.value)) : null;
  if (!token) {
    return {
      confidence: MEDIUM_CONFIDENCE,
      notes: ["Spacing required an arbitrary value."],
      strategy: "arbitrary",
      utility: createArbitraryUtility(prefix, value),
    };
  }

  const baseUtility = token === "px" ? `${prefix}-px` : `${prefix}-${token}`;
  return {
    confidence: HIGH_CONFIDENCE,
    strategy: "scale",
    utility: length.value < 0 ? `-${baseUtility}` : baseUtility,
  };
}

function buildDimensionCandidate(
  prefix: string,
  value: string,
  options: { confidence: number; note?: string }
): MatchCandidate {
  if (value === "auto") {
    return {
      confidence: HIGH_CONFIDENCE,
      strategy: "semantic",
      utility: `${prefix}-auto`,
    };
  }

  const keywordUtility = {
    "100%": `${prefix}-full`,
    "100vh": `${prefix}-screen`,
    "100vw": `${prefix}-screen`,
    "fit-content": `${prefix}-fit`,
    "max-content": `${prefix}-max`,
    "min-content": `${prefix}-min`,
  }[value];

  if (keywordUtility) {
    return {
      confidence: HIGH_CONFIDENCE,
      strategy: "semantic",
      utility: keywordUtility,
    };
  }

  const length = parseLength(value);
  const token =
    length && length.unit === "px"
      ? SPACING_SCALE.get(Math.abs(length.value))
      : null;
  if (token) {
    return {
      confidence: options.confidence,
      notes: options.note ? [options.note] : [],
      strategy: "scale",
      utility: token === "px" ? `${prefix}-px` : `${prefix}-${token}`,
    };
  }

  return {
    confidence: options.confidence,
    notes: options.note
      ? [options.note]
      : ["Length required an arbitrary value."],
    strategy: "arbitrary",
    utility: createArbitraryUtility(prefix, value),
  };
}

function buildScaleCandidate(
  prefix: string,
  value: string,
  scale: Map<number, string>,
  note: string
): MatchCandidate {
  const length = parseLength(value);
  const token = length && length.unit === "px" ? scale.get(length.value) : null;

  if (token) {
    return {
      confidence: HIGH_CONFIDENCE,
      strategy: "scale",
      utility: `${prefix}-${token}`,
    };
  }

  return {
    confidence: MEDIUM_CONFIDENCE,
    notes: [note],
    strategy: "arbitrary",
    utility: createArbitraryUtility(prefix, value),
  };
}

function buildColorCandidate(
  prefix: "bg" | "border" | "decoration" | "text",
  value: string
): MatchCandidate {
  const normalized = normalizeColor(value);
  let semanticUtility: string | null = null;
  if (normalized === "transparent") {
    semanticUtility = `${prefix}-transparent`;
  } else if (normalized === "#000000") {
    semanticUtility = `${prefix}-black`;
  } else if (normalized === "#ffffff") {
    semanticUtility = `${prefix}-white`;
  }

  if (semanticUtility) {
    return {
      confidence: HIGH_CONFIDENCE,
      strategy: "semantic",
      utility: semanticUtility,
    };
  }

  return {
    confidence: MEDIUM_CONFIDENCE,
    strategy: "arbitrary",
    utility: createArbitraryUtility(prefix, normalized),
  };
}

function buildFontFamilyCandidate(value: string): MatchCandidate {
  const normalized = value.toLowerCase();
  if (normalized.includes("monospace")) {
    return {
      confidence: MEDIUM_CONFIDENCE,
      notes: ["Mapped to the nearest generic Tailwind family."],
      strategy: "heuristic",
      utility: "font-mono",
    };
  }

  if (normalized.includes("sans-serif") || normalized.includes("system-ui")) {
    return {
      confidence: MEDIUM_CONFIDENCE,
      notes: ["Mapped to the nearest generic Tailwind family."],
      strategy: "heuristic",
      utility: "font-sans",
    };
  }

  if (normalized.includes("serif")) {
    return {
      confidence: MEDIUM_CONFIDENCE,
      notes: ["Mapped to the nearest generic Tailwind family."],
      strategy: "heuristic",
      utility: "font-serif",
    };
  }

  return {
    confidence: LOW_CONFIDENCE,
    notes: ["Font family required an arbitrary property utility."],
    strategy: "arbitrary",
    utility: createArbitraryPropertyClass("font-family", value),
  };
}

function buildBorderWidthCandidate(
  prefix: string,
  value: string
): MatchCandidate {
  const length = parseLength(value);
  const token =
    length && length.unit === "px"
      ? BORDER_WIDTH_SCALE.get(length.value)
      : null;

  if (token !== undefined) {
    return {
      confidence: HIGH_CONFIDENCE,
      strategy: "scale",
      utility: token ? `${prefix}-${token}` : prefix,
    };
  }

  return {
    confidence: MEDIUM_CONFIDENCE,
    notes: ["Border width required an arbitrary value."],
    strategy: "arbitrary",
    utility: createArbitraryUtility(prefix, value),
  };
}

function buildBorderColorCandidate(value: string): MatchCandidate {
  return buildColorCandidate("border", value);
}

function buildRadiusCandidate(prefix: string, value: string): MatchCandidate {
  const length = parseLength(value);
  if (length && length.value >= 9999) {
    return {
      confidence: HIGH_CONFIDENCE,
      strategy: "semantic",
      utility: `${prefix}-full`,
    };
  }

  const token =
    length && length.unit === "px" ? RADIUS_SCALE.get(length.value) : null;
  if (token !== undefined) {
    return {
      confidence: HIGH_CONFIDENCE,
      strategy: "scale",
      utility: token ? `${prefix}-${token}` : prefix,
    };
  }

  return {
    confidence: MEDIUM_CONFIDENCE,
    notes: ["Border radius required an arbitrary value."],
    strategy: "arbitrary",
    utility: createArbitraryUtility(prefix, value),
  };
}

function buildZIndexCandidate(value: string): MatchCandidate {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && Z_INDEX_SCALE.has(numericValue)) {
    return {
      confidence: HIGH_CONFIDENCE,
      strategy: "scale",
      utility: `z-${numericValue}`,
    };
  }

  return {
    confidence: MEDIUM_CONFIDENCE,
    notes: ["Resolved z-index required an arbitrary value."],
    strategy: "arbitrary",
    utility: `z-[${sanitizeArbitraryValue(value)}]`,
  };
}

function createArbitraryUtility(prefix: string, value: string): string {
  return `${prefix}-[${sanitizeArbitraryValue(value)}]`;
}

function createArbitraryPropertyClass(property: string, value: string): string {
  return `[${property}:${sanitizeArbitraryValue(value)}]`;
}

function sanitizeArbitraryValue(value: string): string {
  return value
    .trim()
    .replace(/\s*,\s*/g, ",")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, "_");
}

function normalizeColor(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "transparent" || isTransparentColor(trimmed)) {
    return "transparent";
  }

  const rgbMatch = trimmed.match(RGB_PATTERN);
  if (!rgbMatch) {
    return trimmed;
  }

  const red = Number(rgbMatch[1]).toString(16).padStart(2, "0");
  const green = Number(rgbMatch[2]).toString(16).padStart(2, "0");
  const blue = Number(rgbMatch[3]).toString(16).padStart(2, "0");
  const alpha = rgbMatch[4];

  if (!alpha || alpha === "1") {
    return `#${red}${green}${blue}`;
  }

  return trimmed.replace(/\s+/g, "");
}

function isTransparentColor(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, "").toLowerCase();
  return normalized === "rgba(0,0,0,0)" || normalized === "transparent";
}

function parseLength(value: string): { unit: string; value: number } | null {
  const match = value.trim().match(LENGTH_PATTERN);
  if (!match) {
    return null;
  }

  return {
    unit: match[2] ?? "px",
    value: Number(match[1]),
  };
}

function isZeroLength(value: string): boolean {
  const length = parseLength(value);
  return Boolean(length && Math.abs(length.value) <= 0.01);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function allEqual(values: string[]): boolean {
  return values.every((value) => value === values[0]);
}

function dedupe(values?: string[]): string[] {
  return Array.from(new Set((values ?? []).filter(Boolean)));
}

function lookupMappedUtility(
  map: Record<string, string>,
  value: string
): string | null {
  return map[value] ?? null;
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}
