import type { TailwindMappingResult } from "./tailwind-mapper.ts";
import type {
  CaptureResult,
  ElementSnapshot,
  PseudoElementSnapshot,
} from "./types.ts";

interface HtmlAnnotationResult {
  html: string;
  refs: Record<string, string>;
  selectors: Record<string, string>;
}

interface ClaudePromptEntry {
  key: string;
  value: string;
}

interface ClaudePromptMetadata {
  elementCount: number;
  mode: CaptureResult["settings"]["captureMode"];
  pseudoCount: number;
  rootRef: string;
  rootSelector: string;
  url: string;
}

export interface ClaudeCapturePrompt {
  cssCapture: string;
  htmlCapture: string;
  instruction: string;
  metadata: ClaudePromptMetadata;
  openQuestions: ClaudePromptEntry[];
  tailwindHints: ClaudePromptEntry[];
}

const CAPTURE_NODE_ATTRIBUTE = "data-lc";
const MAX_TAILWIND_SUGGESTIONS = 6;
const MAX_OPEN_QUESTION_ITEMS = 8;
const CLAUDE_CAPTURE_INSTRUCTION =
  "Recreate or refactor this UI faithfully. html_capture + css_capture are ground truth. Preserve structure unless simplifying is clearly better. Tailwind hints are hints. Use the smallest codebase-ready change and state ambiguities instead of inventing details.";

const compactInlineText = (value: string): string =>
  value.replaceAll(/\s+/g, " ").trim();

const escapeXmlAttribute = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const compactSelector = (selector: string): string =>
  selector
    .replaceAll(/\s*([>+~])\s*/g, "$1")
    .replaceAll(/,\s+/g, ",")
    .replaceAll(/\s+/g, " ")
    .trim();

const buildCompactRefs = (order: string[]): Record<string, string> => {
  const refs: Record<string, string> = {};

  for (const [index, elementId] of order.entries()) {
    refs[elementId] = index.toString(36);
  }

  return refs;
};

const buildCompactSelector = (ref: string): string =>
  `[${CAPTURE_NODE_ATTRIBUTE}="${ref}"]`;

const buildFallbackSelectors = (
  capture: CaptureResult
): Record<string, string> => {
  const selectors: Record<string, string> = {};

  for (const elementId of capture.order) {
    const snapshot = capture.elements[elementId];

    if (!snapshot) {
      continue;
    }

    selectors[elementId] = compactSelector(snapshot.selector);
  }

  return selectors;
};

const stripCommentNodes = (root: Element): void => {
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
};

const minifyHtmlString = (html: string): string =>
  html
    .replaceAll(/<!--[\s\S]*?-->/g, "")
    .replaceAll(/>\s+</g, "><")
    .trim();

const elementMatchesSnapshot = (
  element: Element,
  snapshot: ElementSnapshot
): boolean => {
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
};

const findMatchingElementIndex = (
  candidates: Element[],
  snapshot: ElementSnapshot,
  startIndex: number
): number => {
  for (let index = startIndex; index < candidates.length; index += 1) {
    if (elementMatchesSnapshot(candidates[index], snapshot)) {
      return index;
    }
  }

  return -1;
};

const annotateCaptureHtml = (capture: CaptureResult): HtmlAnnotationResult => {
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

  const candidates = [root, ...root.querySelectorAll("*")];
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
};

const formatCssPropertyName = (property: string): string => {
  if (property.includes("-")) {
    return property;
  }

  return property.replaceAll(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
};

const formatDeclarationBlock = (styles: Record<string, string>): string =>
  Object.entries(styles)
    .filter(([, value]) => value.trim().length > 0)
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(
      ([property, value]) =>
        `${formatCssPropertyName(property)}:${compactInlineText(value)}`
    )
    .join(";");

const formatPseudoBlock = (
  selector: string,
  pseudo: PseudoElementSnapshot | undefined
): string => {
  if (!pseudo) {
    return "";
  }

  const declarationBlock = formatDeclarationBlock(pseudo.styles);
  if (!declarationBlock) {
    return "";
  }

  return `${selector}::${pseudo.kind}{${declarationBlock}}`;
};

const formatElementCssBlock = (
  snapshot: ElementSnapshot,
  selector: string
): string => {
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
};

const formatCaptureCss = (
  capture: CaptureResult,
  selectors: Record<string, string>
): string =>
  capture.order
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

const buildTailwindHintEntries = (
  capture: CaptureResult,
  mapping: TailwindMappingResult | null,
  refs: Record<string, string>
): ClaudePromptEntry[] => {
  if (!mapping) {
    return [];
  }

  const entries: ClaudePromptEntry[] = [];
  const rootMapping = mapping.elements[capture.rootElementId];

  if (rootMapping?.suggestedClassName || rootMapping?.className) {
    entries.push({
      key: "root",
      value: rootMapping.suggestedClassName || rootMapping.className,
    });
  }

  const topSuggestions = capture.order
    .filter((elementId) => elementId !== capture.rootElementId)
    .map((elementId) => mapping.elements[elementId])
    .filter((element): element is NonNullable<typeof element> =>
      Boolean(element?.suggestedClassName || element?.className)
    )
    .slice(0, MAX_TAILWIND_SUGGESTIONS);

  for (const suggestion of topSuggestions) {
    entries.push({
      key: refs[suggestion.elementId] ?? suggestion.elementId,
      value: suggestion.suggestedClassName || suggestion.className,
    });
  }

  return entries;
};

const buildOpenQuestionEntries = (
  mapping: TailwindMappingResult | null,
  refs: Record<string, string>
): ClaudePromptEntry[] => {
  if (!mapping || mapping.reviewQueue.length === 0) {
    return [];
  }

  return mapping.reviewQueue.slice(0, MAX_OPEN_QUESTION_ITEMS).map((item) => ({
    key: refs[item.elementId] ?? item.elementId,
    value: item.reasons.join("; "),
  }));
};

export const buildClaudeCapturePrompt = (
  capture: CaptureResult,
  mapping: TailwindMappingResult | null
): ClaudeCapturePrompt => {
  const annotation = annotateCaptureHtml(capture);
  const rootElement = capture.elements[capture.rootElementId];

  return {
    cssCapture: formatCaptureCss(capture, annotation.selectors),
    htmlCapture: annotation.html,
    instruction: CLAUDE_CAPTURE_INSTRUCTION,
    metadata: {
      elementCount: capture.summary.elementCount,
      mode: capture.settings.captureMode,
      pseudoCount: capture.summary.pseudoElementCount,
      rootRef: annotation.refs[capture.rootElementId] ?? capture.rootElementId,
      rootSelector: rootElement?.selector ?? "Unavailable",
      url: capture.metadata.url,
    },
    openQuestions: buildOpenQuestionEntries(mapping, annotation.refs),
    tailwindHints: buildTailwindHintEntries(capture, mapping, annotation.refs),
  };
};

export const formatCaptureForClaudeMarkdown = (
  capture: CaptureResult,
  mapping: TailwindMappingResult | null
): string => {
  const prompt = buildClaudeCapturePrompt(capture, mapping);

  const sections = [
    `<style_capture url="${escapeXmlAttribute(prompt.metadata.url)}" mode="${prompt.metadata.mode}" root_ref="${prompt.metadata.rootRef}" root_selector="${escapeXmlAttribute(prompt.metadata.rootSelector)}" elements="${prompt.metadata.elementCount}" pseudos="${prompt.metadata.pseudoCount}">`,
    prompt.instruction,
    `<html_capture>${prompt.htmlCapture}</html_capture>`,
    `<css_capture>${prompt.cssCapture}</css_capture>`,
  ];

  if (prompt.tailwindHints.length > 0) {
    sections.push(
      "<tailwind_hints>",
      ...prompt.tailwindHints.map(
        (entry) => `${entry.key}=${compactInlineText(entry.value)}`
      ),
      "</tailwind_hints>"
    );
  }

  if (prompt.openQuestions.length > 0) {
    sections.push(
      "<open_questions>",
      ...prompt.openQuestions.map(
        (entry) => `${entry.key}:${compactInlineText(entry.value)}`
      ),
      "</open_questions>"
    );
  }

  sections.push("</style_capture>");
  return sections.join("\n").trim();
};
