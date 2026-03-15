import type {
  BoundingBox,
  CaptureResult,
  CaptureSettings,
  ElementSnapshot,
  PseudoElementSnapshot,
} from "@style-capture/core";

const OMITTED_ELEMENT_NAMES = new Set([
  "base",
  "iframe",
  "link",
  "meta",
  "noscript",
  "object",
  "script",
  "style",
  "template",
]);

const OMITTED_ATTRIBUTE_NAMES = new Set(["checked", "selected", "value"]);
const OMITTED_URL_ATTRIBUTE_NAMES = new Set([
  "action",
  "formaction",
  "href",
  "poster",
  "src",
  "srcdoc",
  "srcset",
  "xlink:href",
]);

const BASELINE_ATTRIBUTE_NAMES = [
  "checked",
  "cols",
  "disabled",
  "multiple",
  "open",
  "rows",
  "selected",
  "size",
  "type",
  "wrap",
] as const;

const INHERITED_PROPERTIES = new Set([
  "color",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "letter-spacing",
  "line-height",
  "list-style-type",
  "text-align",
  "text-decoration-color",
  "text-decoration-line",
  "text-transform",
  "visibility",
  "white-space",
]);

const CURATED_PROPERTIES = [
  "align-items",
  "background-color",
  "background-image",
  "border-bottom-color",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
  "border-bottom-style",
  "border-bottom-width",
  "border-left-color",
  "border-left-style",
  "border-left-width",
  "border-right-color",
  "border-right-style",
  "border-right-width",
  "border-top-color",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-top-style",
  "border-top-width",
  "bottom",
  "box-shadow",
  "color",
  "column-gap",
  "display",
  "flex-basis",
  "flex-direction",
  "flex-grow",
  "flex-shrink",
  "flex-wrap",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "gap",
  "grid-auto-flow",
  "grid-column-end",
  "grid-column-start",
  "grid-row-end",
  "grid-row-start",
  "grid-template-columns",
  "grid-template-rows",
  "height",
  "justify-content",
  "left",
  "letter-spacing",
  "line-height",
  "list-style-type",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "max-height",
  "max-width",
  "min-height",
  "min-width",
  "object-fit",
  "object-position",
  "opacity",
  "overflow-x",
  "overflow-y",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "position",
  "right",
  "row-gap",
  "text-align",
  "text-decoration-color",
  "text-decoration-line",
  "text-transform",
  "top",
  "transform",
  "transform-origin",
  "visibility",
  "white-space",
  "width",
  "z-index",
];

const getBoundingBox = (rect: DOMRect): BoundingBox => ({
  bottom: rect.bottom,
  height: rect.height,
  left: rect.left,
  right: rect.right,
  top: rect.top,
  width: rect.width,
  x: rect.x,
  y: rect.y,
});

const buildSelector = (element: Element): string => {
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  const segments: string[] = [];
  let current: Element | null = element;

  while (
    current &&
    current.nodeType === Node.ELEMENT_NODE &&
    segments.length < 4
  ) {
    const tagName = current.tagName.toLowerCase();
    const classes = [...current.classList].slice(0, 2);
    const classSelector = classes
      .map((className) => `.${CSS.escape(className)}`)
      .join("");
    const index = current.parentElement
      ? [...current.parentElement.children].indexOf(current) + 1
      : 1;

    segments.unshift(`${tagName}${classSelector}:nth-child(${index})`);
    current = current.parentElement;
  }

  return segments.join(" > ");
};

const isElementHidden = (element: Element): boolean => {
  const styles = window.getComputedStyle(element);
  return styles.display === "none" || styles.visibility === "hidden";
};

const shouldOmitElement = (element: Element): boolean =>
  OMITTED_ELEMENT_NAMES.has(element.tagName.toLowerCase());

const shouldOmitAttribute = (attributeName: string): boolean => {
  const normalized = attributeName.toLowerCase();
  return (
    normalized.startsWith("on") ||
    normalized === "nonce" ||
    OMITTED_ATTRIBUTE_NAMES.has(normalized) ||
    OMITTED_URL_ATTRIBUTE_NAMES.has(normalized)
  );
};

const getSafeAttributes = (element: Element): Record<string, string> => {
  const safe: Record<string, string> = {};
  for (const attribute of element.attributes) {
    if (!shouldOmitAttribute(attribute.name)) {
      safe[attribute.name] = attribute.value;
    }
  }
  return safe;
};

const sanitizeElement = (element: Element): void => {
  if (shouldOmitElement(element)) {
    element.replaceWith(
      element.ownerDocument.createComment(element.tagName.toLowerCase())
    );
    return;
  }
  // eslint-disable-next-line unicorn/no-useless-spread -- snapshot needed: removeAttribute mutates NamedNodeMap during iteration
  for (const attribute of [...element.attributes]) {
    if (shouldOmitAttribute(attribute.name)) {
      element.removeAttribute(attribute.name);
    }
  }
  if (element instanceof HTMLTextAreaElement) {
    element.textContent = "";
  }
};

const pruneExcludedDescendants = (
  sourceRoot: Element,
  cloneRoot: Element,
  includeHidden: boolean
): void => {
  const sourceElements = [...sourceRoot.querySelectorAll("*")];
  const cloneElements = [...cloneRoot.querySelectorAll("*")];

  for (let index = cloneElements.length - 1; index >= 0; index -= 1) {
    const sourceEl = sourceElements[index];
    const cloneEl = cloneElements[index];
    if (!(sourceEl && cloneEl)) {
      continue;
    }
    if (
      shouldOmitElement(sourceEl) ||
      (!includeHidden && isElementHidden(sourceEl))
    ) {
      cloneEl.replaceWith(
        cloneEl.ownerDocument.createComment(cloneEl.tagName.toLowerCase())
      );
    }
  }
};

const sanitizeOuterHtml = (root: Element, includeHidden: boolean): string => {
  const clone = root.cloneNode(true);
  if (!(clone instanceof Element)) {
    return "";
  }

  if (shouldOmitElement(root) || (!includeHidden && isElementHidden(root))) {
    return `<!--${clone.tagName.toLowerCase()}-->`;
  }

  pruneExcludedDescendants(root, clone, includeHidden);
  sanitizeElement(clone);
  for (const element of clone.querySelectorAll("*")) {
    sanitizeElement(element);
  }
  return clone.outerHTML;
};

const snapshotDefaultStyles = (
  styles: CSSStyleDeclaration
): Record<string, string> => {
  const output: Record<string, string> = {};
  for (const property of CURATED_PROPERTIES) {
    const value = styles.getPropertyValue(property).trim();
    if (value) {
      output[property] = value;
    }
  }
  return output;
};

const buildDefaultStyleCacheKey = (element: Element): string => {
  const parts = [element.tagName.toLowerCase()];
  for (const attr of BASELINE_ATTRIBUTE_NAMES) {
    if (element.hasAttribute(attr)) {
      parts.push(`${attr}=${element.getAttribute(attr) ?? ""}`);
    }
  }
  return parts.join("|");
};

interface DefaultStyleCache {
  cleanup: () => void;
  getElementDefaults: (element: Element) => Record<string, string>;
}

const createDefaultStyleCache = (): DefaultStyleCache => {
  let iframeEl: HTMLIFrameElement | null = null;
  const cache = new Map<string, Record<string, string>>();

  const cleanup = (): void => {
    cache.clear();
    iframeEl?.remove();
    iframeEl = null;
  };

  const getFrameDocument = (): Document => {
    if (!iframeEl) {
      iframeEl = document.createElement("iframe");
      iframeEl.setAttribute("aria-hidden", "true");
      iframeEl.tabIndex = -1;
      iframeEl.style.position = "fixed";
      iframeEl.style.top = "-9999px";
      iframeEl.style.left = "-9999px";
      iframeEl.style.width = "0";
      iframeEl.style.height = "0";
      iframeEl.style.border = "0";
      iframeEl.style.opacity = "0";
      iframeEl.style.pointerEvents = "none";
      document.documentElement.append(iframeEl);

      const nextDocument = iframeEl.contentDocument;
      if (!nextDocument) {
        throw new Error("Could not create the default-style iframe document.");
      }
      nextDocument.open();
      nextDocument.write("<!doctype html><html><body></body></html>");
      nextDocument.close();
    }

    if (!iframeEl.contentDocument) {
      throw new Error("Could not access the default-style iframe document.");
    }
    return iframeEl.contentDocument;
  };

  const getElementDefaults = (element: Element): Record<string, string> => {
    const key = buildDefaultStyleCacheKey(element);
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }

    const frameDoc = getFrameDocument();
    const frameWindow = iframeEl?.contentWindow;
    if (!frameWindow) {
      throw new Error("Could not access the default-style iframe window.");
    }

    const baseline = frameDoc.createElement(element.tagName.toLowerCase());
    for (const attr of BASELINE_ATTRIBUTE_NAMES) {
      if (element.hasAttribute(attr)) {
        baseline.setAttribute(attr, element.getAttribute(attr) ?? "");
      }
    }

    frameDoc.body.append(baseline);
    const defaults = snapshotDefaultStyles(
      frameWindow.getComputedStyle(baseline)
    );
    baseline.remove();
    cache.set(key, defaults);
    return defaults;
  };

  return { cleanup, getElementDefaults };
};

const snapshotStyles = (
  element: Element,
  styles: CSSStyleDeclaration,
  includeAll: boolean,
  parentStyles: Record<string, string> | null,
  styleCache: DefaultStyleCache
): Record<string, string> => {
  const output: Record<string, string> = {};
  const properties = includeAll ? [...styles] : [...CURATED_PROPERTIES];
  const defaultStyles = includeAll
    ? null
    : styleCache.getElementDefaults(element);

  for (const property of properties) {
    const value = styles.getPropertyValue(property);
    if (!value) {
      continue;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    if (defaultStyles?.[property] === trimmed) {
      continue;
    }

    if (
      parentStyles &&
      INHERITED_PROPERTIES.has(property) &&
      parentStyles[property] === trimmed
    ) {
      continue;
    }

    output[property] = trimmed;
  }
  return output;
};

const snapshotPseudoElement = (
  element: Element,
  kind: "before" | "after",
  includeAll: boolean,
  styleCache: DefaultStyleCache
): PseudoElementSnapshot | null => {
  const styles = window.getComputedStyle(element, `::${kind}`);
  const content = styles.getPropertyValue("content").trim();
  const display = styles.getPropertyValue("display").trim();
  const pseudoWidth = styles.getPropertyValue("width").trim();
  const pseudoHeight = styles.getPropertyValue("height").trim();
  const backgroundColor = styles.getPropertyValue("background-color").trim();
  const borderWidth = styles.getPropertyValue("border-top-width").trim();

  if (
    content === "none" &&
    display === "inline" &&
    pseudoWidth === "auto" &&
    pseudoHeight === "auto" &&
    backgroundColor === "rgba(0, 0, 0, 0)" &&
    borderWidth === "0px"
  ) {
    return null;
  }

  return {
    kind,
    styles: snapshotStyles(element, styles, includeAll, null, styleCache),
  };
};

export const buildCapture = (
  root: Element,
  settings: CaptureSettings
): CaptureResult => {
  const styleCache = createDefaultStyleCache();

  try {
    const elements: Record<string, ElementSnapshot> = {};
    const order: string[] = [];
    const idByElement = new WeakMap<Element, string>();
    let pseudoElementCount = 0;
    let nextId = 0;

    const captureElement = (
      element: Element,
      parentId: string | null
    ): string => {
      const id = `node-${nextId}`;
      nextId += 1;
      idByElement.set(element, id);
      order.push(id);

      const includeAll = settings.captureMode === "full";

      const snapshot: ElementSnapshot = {
        attributes: getSafeAttributes(element),
        boundingBox: getBoundingBox(element.getBoundingClientRect()),
        children: [],
        classList: [...element.classList],
        id,
        parentId,
        pseudo: {},
        selector: buildSelector(element),
        styles: snapshotStyles(
          element,
          window.getComputedStyle(element),
          includeAll,
          parentId ? (elements[parentId]?.styles ?? null) : null,
          styleCache
        ),
        tagName: element.tagName.toLowerCase(),
      };

      if (settings.includePseudoElements) {
        const before = snapshotPseudoElement(
          element,
          "before",
          includeAll,
          styleCache
        );
        const after = snapshotPseudoElement(
          element,
          "after",
          includeAll,
          styleCache
        );
        if (before) {
          snapshot.pseudo.before = before;
          pseudoElementCount += 1;
        }
        if (after) {
          snapshot.pseudo.after = after;
          pseudoElementCount += 1;
        }
      }

      elements[id] = snapshot;

      if (parentId && elements[parentId]) {
        elements[parentId].children.push(id);
      }

      return id;
    };

    const rootElementId = captureElement(root, null);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        if (
          node instanceof Element &&
          node !== root &&
          !settings.includeHiddenElements &&
          isElementHidden(node)
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    while (walker.nextNode()) {
      const current = walker.currentNode;
      if (!(current instanceof Element)) {
        continue;
      }

      const parentId = current.parentElement
        ? (idByElement.get(current.parentElement) ?? null)
        : null;
      captureElement(current, parentId);
    }

    return {
      elements,
      metadata: { url: window.location.href },
      order,
      rootElementId,
      rootOuterHtml: sanitizeOuterHtml(root, settings.includeHiddenElements),
      settings,
      summary: { elementCount: order.length, pseudoElementCount },
      version: 1,
    };
  } finally {
    styleCache.cleanup();
  }
};
