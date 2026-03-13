import type { TailwindMappingResult } from "@/lib/tailwind-mapper.ts";
import type {
  CaptureResult,
  ElementSnapshot,
  PseudoElementSnapshot,
} from "@/lib/types.ts";

interface HtmlAnnotationResult {
  html: string;
  selectors: Record<string, string>;
}

const MAX_TAILWIND_SUGGESTIONS = 6;
const MAX_OPEN_QUESTION_ITEMS = 8;

export function formatCaptureForClaudeMarkdown(
  capture: CaptureResult,
  mapping: TailwindMappingResult | null
): string {
  const annotation = annotateCaptureHtml(capture);
  const hasTailwindHints = Boolean(mapping);
  const tailwindSection = formatTailwindSection(capture, mapping);
  const openQuestionsSection = formatOpenQuestions(mapping);

  const sections = [
    "<live_css_capture>",
    "<task_summary>",
    ...formatTaskSummary(hasTailwindHints),
    "</task_summary>",
    "",
    "<source>",
    formatCaptureSource(capture),
    "</source>",
    "",
    "<html>",
    "```html",
    annotation.html,
    "```",
    "</html>",
    "",
    "<css>",
    "```css",
    formatCaptureCss(capture, annotation.selectors),
    "```",
    "</css>",
  ];

  if (tailwindSection) {
    sections.push("", tailwindSection);
  }

  if (openQuestionsSection) {
    sections.push("", openQuestionsSection);
  }

  sections.push(
    "",
    "<final_request>",
    ...formatFinalRequest(Boolean(openQuestionsSection)),
    "</final_request>",
    "</live_css_capture>"
  );

  return sections.join("\n").trim();
}

function formatTaskSummary(hasTailwindHints: boolean): string[] {
  const lines = [
    "Recreate or refactor this UI from the captured subtree below.",
    "Treat <html> and <css> as the source of truth.",
    "Preserve the captured structure unless there is a clear reason to simplify it.",
  ];

  if (hasTailwindHints) {
    lines.push(
      "Treat <tailwind_hints> as implementation hints, not ground truth."
    );
  }

  lines.push("Call out ambiguity instead of inventing missing details.");
  return lines;
}

function formatFinalRequest(hasOpenQuestions: boolean): string[] {
  const lines = [
    "Implement this in a codebase-ready form.",
    "Prefer the smallest change set that faithfully matches the capture.",
    "Keep custom CSS where Tailwind would be misleading or overly arbitrary.",
  ];

  if (hasOpenQuestions) {
    lines.push(
      "Address the items in <open_questions> explicitly before guessing."
    );
  }

  lines.push("Return assumptions clearly if anything remains unresolved.");
  return lines;
}

function formatCaptureSource(capture: CaptureResult): string {
  const rootElement = capture.elements[capture.rootElementId];
  const lines = [
    `title: ${capture.metadata.title}`,
    `url: ${capture.metadata.url}`,
    `capture_mode: ${capture.settings.captureMode}`,
    `root_element_id: ${capture.rootElementId}`,
    `root_selector: ${rootElement?.selector ?? "Unavailable"}`,
    `element_count: ${capture.summary.elementCount}`,
    `pseudo_element_count: ${capture.summary.pseudoElementCount}`,
  ];

  return lines.join("\n");
}

function annotateCaptureHtml(capture: CaptureResult): HtmlAnnotationResult {
  if (!capture.rootOuterHtml.trim()) {
    return {
      html: "",
      selectors: buildFallbackSelectors(capture),
    };
  }

  if (typeof DOMParser === "undefined") {
    return {
      html: capture.rootOuterHtml,
      selectors: buildFallbackSelectors(capture),
    };
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(capture.rootOuterHtml, "text/html");
  const root = document.body.firstElementChild;

  if (!root) {
    return {
      html: capture.rootOuterHtml,
      selectors: buildFallbackSelectors(capture),
    };
  }

  const candidates = [root, ...Array.from(root.querySelectorAll("*"))];
  const selectors = buildFallbackSelectors(capture);
  let searchStartIndex = 0;

  for (const elementId of capture.order) {
    const snapshot = capture.elements[elementId];

    if (!snapshot) {
      continue;
    }

    const matchIndex = findMatchingElementIndex(
      candidates,
      snapshot,
      searchStartIndex
    );

    if (matchIndex === -1) {
      continue;
    }

    const element = candidates[matchIndex];
    element.setAttribute("data-live-css-node", elementId);
    selectors[elementId] = `[data-live-css-node="${elementId}"]`;
    searchStartIndex = matchIndex + 1;
  }

  return {
    html: root.outerHTML,
    selectors,
  };
}

function buildFallbackSelectors(
  capture: CaptureResult
): Record<string, string> {
  const selectors: Record<string, string> = {};

  for (const elementId of capture.order) {
    const snapshot = capture.elements[elementId];

    if (!snapshot) {
      continue;
    }

    selectors[elementId] = snapshot.selector;
  }

  return selectors;
}

function findMatchingElementIndex(
  candidates: Element[],
  snapshot: ElementSnapshot,
  startIndex: number
): number {
  for (let index = startIndex; index < candidates.length; index += 1) {
    if (elementMatchesSnapshot(candidates[index], snapshot)) {
      return index;
    }
  }

  return -1;
}

function elementMatchesSnapshot(
  element: Element,
  snapshot: ElementSnapshot
): boolean {
  if (element.tagName.toLowerCase() !== snapshot.tagName) {
    return false;
  }

  for (const className of snapshot.classList) {
    if (!element.classList.contains(className)) {
      return false;
    }
  }

  for (const [name, value] of Object.entries(snapshot.attributes)) {
    if (name === "class") {
      continue;
    }

    if (element.getAttribute(name) !== value) {
      return false;
    }
  }

  return true;
}

function formatCaptureCss(
  capture: CaptureResult,
  selectors: Record<string, string>
): string {
  const blocks: string[] = [];

  for (const elementId of capture.order) {
    const snapshot = capture.elements[elementId];

    if (!snapshot) {
      continue;
    }

    const selector = selectors[elementId] ?? snapshot.selector;
    const elementBlock = formatElementCssBlock(elementId, snapshot, selector);

    if (elementBlock) {
      blocks.push(elementBlock);
    }
  }

  return blocks.join("\n\n").trim();
}

function formatElementCssBlock(
  elementId: string,
  snapshot: ElementSnapshot,
  selector: string
): string {
  const declarationBlock = formatDeclarationBlock(snapshot.styles);
  const beforeBlock = formatPseudoBlock(selector, snapshot.pseudo.before);
  const afterBlock = formatPseudoBlock(selector, snapshot.pseudo.after);

  if (!(declarationBlock || beforeBlock || afterBlock)) {
    return "";
  }

  const parts: string[] = [];
  const label = [snapshot.tagName, ...snapshot.classList]
    .filter(Boolean)
    .join(".");

  if (declarationBlock) {
    parts.push(
      `/* ${elementId} | ${label || snapshot.selector} | original: ${snapshot.selector} */`
    );
    parts.push(`${selector} {`);
    parts.push(declarationBlock);
    parts.push("}");
  }

  if (beforeBlock) {
    parts.push(beforeBlock);
  }

  if (afterBlock) {
    parts.push(afterBlock);
  }

  return parts.join("\n");
}

function formatPseudoBlock(
  selector: string,
  pseudo: PseudoElementSnapshot | undefined
): string {
  if (!pseudo) {
    return "";
  }

  const declarationBlock = formatDeclarationBlock(pseudo.styles);
  if (!declarationBlock) {
    return "";
  }

  return [`${selector}::${pseudo.kind} {`, declarationBlock, "}"].join("\n");
}

function formatDeclarationBlock(styles: Record<string, string>): string {
  const declarations = Object.entries(styles)
    .filter(([, value]) => value.trim().length > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([property, value]) => `  ${formatCssPropertyName(property)}: ${value};`
    );

  return declarations.join("\n");
}

function formatCssPropertyName(property: string): string {
  if (property.includes("-")) {
    return property;
  }

  return property.replaceAll(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function formatTailwindSection(
  capture: CaptureResult,
  mapping: TailwindMappingResult | null
): string {
  if (!mapping) {
    return "";
  }

  const lines = ["<tailwind_hints>"];
  const rootMapping = mapping.elements[capture.rootElementId];
  const reviewOnlyItems: string[] = [];

  if (rootMapping) {
    lines.push(
      `root_suggestion: \`${rootMapping.suggestedClassName || "None"}\``
    );

    if (rootMapping.reviewClassName) {
      reviewOnlyItems.push(
        `- \`${capture.rootElementId}\` (${rootMapping.selector}): \`${rootMapping.reviewClassName}\``
      );
    }
  }

  const topSuggestions = capture.order
    .map((elementId) => mapping.elements[elementId])
    .filter((element): element is NonNullable<typeof element> =>
      Boolean(element?.suggestedClassName || element?.className)
    )
    .slice(0, MAX_TAILWIND_SUGGESTIONS);

  if (topSuggestions.length > 0) {
    lines.push("suggested_class_strings:");

    for (const suggestion of topSuggestions) {
      const cleanSuggestion = suggestion.suggestedClassName || "None";
      lines.push(
        `- \`${suggestion.elementId}\` (${suggestion.selector}): \`${cleanSuggestion}\``
      );

      if (suggestion.reviewClassName) {
        reviewOnlyItems.push(
          `- \`${suggestion.elementId}\` (${suggestion.selector}): \`${suggestion.reviewClassName}\``
        );
      }
    }
  }

  if (reviewOnlyItems.length > 0) {
    lines.push("review_only:");
    lines.push(...reviewOnlyItems.slice(0, MAX_OPEN_QUESTION_ITEMS));
  }

  lines.push("</tailwind_hints>");
  return lines.join("\n").trim();
}

function formatOpenQuestions(mapping: TailwindMappingResult | null): string {
  if (!mapping || mapping.reviewQueue.length === 0) {
    return "";
  }

  const lines = ["<open_questions>"];

  for (const item of mapping.reviewQueue.slice(0, MAX_OPEN_QUESTION_ITEMS)) {
    lines.push(
      `- \`${item.elementId}\` (${item.selector}): ${item.reasons.join("; ")}`
    );
  }

  lines.push("</open_questions>");
  return lines.join("\n").trim();
}
