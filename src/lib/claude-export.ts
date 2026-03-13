import type { TailwindMappingResult } from "@/lib/tailwind-mapper.ts";
import type {
  CaptureResult,
  ElementSnapshot,
  PseudoElementSnapshot,
} from "@/lib/types.ts";

interface HtmlAnnotationResult {
  html: string;
  refs: Record<string, string>;
  selectors: Record<string, string>;
}

const CAPTURE_NODE_ATTRIBUTE = "data-lc";
const MAX_TAILWIND_SUGGESTIONS = 6;
const MAX_OPEN_QUESTION_ITEMS = 8;

export function formatCaptureForClaudeMarkdown(
  capture: CaptureResult,
  mapping: TailwindMappingResult | null
): string {
  const annotation = annotateCaptureHtml(capture);
  const rootElement = capture.elements[capture.rootElementId];
  const tailwindSection = formatTailwindSection(
    capture,
    mapping,
    annotation.refs
  );
  const openQuestionsSection = formatOpenQuestions(mapping, annotation.refs);

  const sections = [
    `<live_css_capture url="${escapeXmlAttribute(capture.metadata.url)}" mode="${capture.settings.captureMode}" root_ref="${annotation.refs[capture.rootElementId] ?? capture.rootElementId}" root_selector="${escapeXmlAttribute(rootElement?.selector ?? "Unavailable")}" elements="${capture.summary.elementCount}" pseudos="${capture.summary.pseudoElementCount}">`,
    "Recreate or refactor this UI faithfully. html_capture + css_capture are ground truth. Preserve structure unless simplifying is clearly better. Tailwind hints are hints. Use the smallest codebase-ready change and state ambiguities instead of inventing details.",
    `<html_capture>${annotation.html}</html_capture>`,
    `<css_capture>${formatCaptureCss(capture, annotation.selectors)}</css_capture>`,
  ];

  if (tailwindSection) {
    sections.push(tailwindSection);
  }

  if (openQuestionsSection) {
    sections.push(openQuestionsSection);
  }

  sections.push("</live_css_capture>");
  return sections.join("\n").trim();
}

function annotateCaptureHtml(capture: CaptureResult): HtmlAnnotationResult {
  const refs = buildCompactRefs(capture.order);

  if (!capture.rootOuterHtml.trim()) {
    return {
      html: "",
      refs,
      selectors: buildFallbackSelectors(capture),
    };
  }

  if (typeof DOMParser === "undefined") {
    return {
      html: minifyHtmlString(capture.rootOuterHtml),
      refs,
      selectors: buildFallbackSelectors(capture),
    };
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(capture.rootOuterHtml, "text/html");
  const root = document.body.firstElementChild;

  if (!root) {
    return {
      html: minifyHtmlString(capture.rootOuterHtml),
      refs,
      selectors: buildFallbackSelectors(capture),
    };
  }

  stripCommentNodes(root);

  const candidates = [root, ...Array.from(root.querySelectorAll("*"))];
  const selectors = buildFallbackSelectors(capture);
  let searchStartIndex = 0;

  for (const elementId of capture.order) {
    const snapshot = capture.elements[elementId];
    const ref = refs[elementId];

    if (!(snapshot && ref)) {
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
    element.setAttribute(CAPTURE_NODE_ATTRIBUTE, ref);
    selectors[elementId] = buildCompactSelector(ref);
    searchStartIndex = matchIndex + 1;
  }

  return {
    html: minifyHtmlString(root.outerHTML),
    refs,
    selectors,
  };
}

function buildCompactRefs(order: string[]): Record<string, string> {
  const refs: Record<string, string> = {};

  order.forEach((elementId, index) => {
    refs[elementId] = index.toString(36);
  });

  return refs;
}

function buildCompactSelector(ref: string): string {
  return `[${CAPTURE_NODE_ATTRIBUTE}="${ref}"]`;
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

    selectors[elementId] = compactSelector(snapshot.selector);
  }

  return selectors;
}

function stripCommentNodes(root: Element): void {
  const walker = root.ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_COMMENT
  );
  const comments: Comment[] = [];

  while (walker.nextNode()) {
    if (walker.currentNode instanceof Comment) {
      comments.push(walker.currentNode);
    }
  }

  for (const comment of comments) {
    comment.remove();
  }
}

function minifyHtmlString(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .trim();
}

function compactSelector(selector: string): string {
  return selector
    .replace(/\s*([>+~])\s*/g, "$1")
    .replace(/,\s+/g, ",")
    .replace(/\s+/g, " ")
    .trim();
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
  return capture.order
    .map((elementId) => {
      const snapshot = capture.elements[elementId];

      if (!snapshot) {
        return "";
      }

      return formatElementCssBlock(
        snapshot,
        selectors[elementId] ?? snapshot.selector
      );
    })
    .filter(Boolean)
    .join("");
}

function formatElementCssBlock(
  snapshot: ElementSnapshot,
  selector: string
): string {
  const parts: string[] = [];
  const declarationBlock = formatDeclarationBlock(snapshot.styles);
  const beforeBlock = formatPseudoBlock(selector, snapshot.pseudo.before);
  const afterBlock = formatPseudoBlock(selector, snapshot.pseudo.after);

  if (declarationBlock) {
    parts.push(`${selector}{${declarationBlock}}`);
  }

  if (beforeBlock) {
    parts.push(beforeBlock);
  }

  if (afterBlock) {
    parts.push(afterBlock);
  }

  return parts.join("");
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

  return `${selector}::${pseudo.kind}{${declarationBlock}}`;
}

function formatDeclarationBlock(styles: Record<string, string>): string {
  return Object.entries(styles)
    .filter(([, value]) => value.trim().length > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([property, value]) =>
        `${formatCssPropertyName(property)}:${compactInlineText(value)}`
    )
    .join(";");
}

function formatCssPropertyName(property: string): string {
  if (property.includes("-")) {
    return property;
  }

  return property.replaceAll(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function formatTailwindSection(
  capture: CaptureResult,
  mapping: TailwindMappingResult | null,
  refs: Record<string, string>
): string {
  if (!mapping) {
    return "";
  }

  const lines = ["<tailwind_hints>"];
  const rootMapping = mapping.elements[capture.rootElementId];

  if (rootMapping?.suggestedClassName || rootMapping?.className) {
    lines.push(
      `root=${compactInlineText(rootMapping.suggestedClassName || rootMapping.className)}`
    );
  }

  const topSuggestions = capture.order
    .filter((elementId) => elementId !== capture.rootElementId)
    .map((elementId) => mapping.elements[elementId])
    .filter((element): element is NonNullable<typeof element> =>
      Boolean(element?.suggestedClassName || element?.className)
    )
    .slice(0, MAX_TAILWIND_SUGGESTIONS);

  for (const suggestion of topSuggestions) {
    lines.push(
      `${refs[suggestion.elementId] ?? suggestion.elementId}=${compactInlineText(
        suggestion.suggestedClassName || suggestion.className
      )}`
    );
  }

  lines.push("</tailwind_hints>");
  return lines.length > 2 ? lines.join("\n") : "";
}

function formatOpenQuestions(
  mapping: TailwindMappingResult | null,
  refs: Record<string, string>
): string {
  if (!mapping || mapping.reviewQueue.length === 0) {
    return "";
  }

  const lines = ["<open_questions>"];

  for (const item of mapping.reviewQueue.slice(0, MAX_OPEN_QUESTION_ITEMS)) {
    lines.push(
      `${refs[item.elementId] ?? item.elementId}:${compactInlineText(
        item.reasons.join("; ")
      )}`
    );
  }

  lines.push("</open_questions>");
  return lines.join("\n");
}

function compactInlineText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function escapeXmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
