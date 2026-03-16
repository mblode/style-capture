import type {
  BoundingBox,
  CaptureResult,
  CaptureSettings,
  ElementSnapshot,
  PseudoElementSnapshot,
} from "@/lib/types.ts";

export type PickerRunResult = "activated" | "deactivated";

// eslint-disable-next-line unicorn/consistent-function-scoping -- all inner functions must remain inside runPicker because this is a self-contained script injected via chrome.scripting.executeScript
export const runPicker = (settings: CaptureSettings): PickerRunResult => {
  const PICKER_KEY = "__STYLE_CAPTURE_PICKER__";
  const CURSOR_STYLE_ID = "style-capture-picker-cursor-style";
  const INSPECT_CURSOR = "crosshair";
  const GRAB_RGB = "67, 137, 245";
  const FRAME_BORDER_COLOR = `rgba(${GRAB_RGB}, 1)`;
  const FRAME_FILL_COLOR = `rgba(${GRAB_RGB}, 0.08)`;
  const LABEL_VIEWPORT_MARGIN = 8;
  const LABEL_MAX_WIDTH = 280;
  const TOOLTIP_CURSOR_OFFSET_X = 4;
  const TOOLTIP_CURSOR_OFFSET_Y = 4;
  const TOOLTIP_TEXT_MAX_LENGTH = 30;
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

  const view = window as Window & {
    [PICKER_KEY]?: {
      cleanup: () => void;
      currentTarget: Element | null;
      pointerX: number | null;
      pointerY: number | null;
    };
  };

  if (view[PICKER_KEY]) {
    view[PICKER_KEY].cleanup();
    return "deactivated";
  }

  // --- Pure helper functions (no closure dependencies) ---

  // eslint-disable-next-line unicorn/consistent-function-scoping -- must stay inside runPicker: self-contained injected script
  const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max);

  // eslint-disable-next-line unicorn/consistent-function-scoping -- must stay inside runPicker: self-contained injected script
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

  // eslint-disable-next-line unicorn/consistent-function-scoping -- must stay inside runPicker: self-contained injected script
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

  // eslint-disable-next-line unicorn/consistent-function-scoping -- must stay inside runPicker: self-contained injected script
  const createOmittedElementComment = (element: Element): string =>
    `<!--${element.tagName.toLowerCase()}-->`;

  // eslint-disable-next-line unicorn/consistent-function-scoping -- must stay inside runPicker: self-contained injected script
  const isElementHidden = (element: Element): boolean => {
    const styles = window.getComputedStyle(element);
    return styles.display === "none" || styles.visibility === "hidden";
  };

  const shouldOmitElement = (element: Element): boolean =>
    OMITTED_ELEMENT_NAMES.has(element.tagName.toLowerCase());

  const shouldOmitAttribute = (attributeName: string): boolean => {
    const normalizedAttributeName = attributeName.toLowerCase();

    return (
      normalizedAttributeName.startsWith("on") ||
      normalizedAttributeName === "nonce" ||
      OMITTED_ATTRIBUTE_NAMES.has(normalizedAttributeName) ||
      OMITTED_URL_ATTRIBUTE_NAMES.has(normalizedAttributeName)
    );
  };

  // --- Functions that use closure variables ---

  const getSafeAttributes = (element: Element): Record<string, string> => {
    const safeAttributes: Record<string, string> = {};

    for (const attribute of element.attributes) {
      if (shouldOmitAttribute(attribute.name)) {
        continue;
      }

      safeAttributes[attribute.name] = attribute.value;
    }

    return safeAttributes;
  };

  const sanitizeElement = (element: Element): void => {
    if (shouldOmitElement(element)) {
      element.replaceWith(
        element.ownerDocument.createComment(element.tagName.toLowerCase())
      );
      return;
    }

    // eslint-disable-next-line unicorn/no-useless-spread -- snapshot needed: removeAttribute mutates the NamedNodeMap during iteration
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
    includeHiddenElements: boolean
  ): void => {
    const sourceElements = [...sourceRoot.querySelectorAll("*")];
    const cloneElements = [...cloneRoot.querySelectorAll("*")];

    for (let index = cloneElements.length - 1; index >= 0; index -= 1) {
      const sourceElement = sourceElements[index];
      const cloneElement = cloneElements[index];

      if (!(sourceElement && cloneElement)) {
        continue;
      }

      if (
        shouldOmitElement(sourceElement) ||
        (!includeHiddenElements && isElementHidden(sourceElement))
      ) {
        cloneElement.replaceWith(
          cloneElement.ownerDocument.createComment(
            cloneElement.tagName.toLowerCase()
          )
        );
      }
    }
  };

  const sanitizeOuterHtml = (
    root: Element,
    includeHiddenElements: boolean
  ): string => {
    const clone = root.cloneNode(true);
    if (!(clone instanceof Element)) {
      return "";
    }

    if (
      shouldOmitElement(root) ||
      (!includeHiddenElements && isElementHidden(root))
    ) {
      return createOmittedElementComment(clone);
    }

    pruneExcludedDescendants(root, clone, includeHiddenElements);
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
      if (!value) {
        continue;
      }

      output[property] = value;
    }

    return output;
  };

  const buildDefaultStyleCacheKey = (element: Element): string => {
    const parts = [element.tagName.toLowerCase()];

    for (const attributeName of BASELINE_ATTRIBUTE_NAMES) {
      if (!element.hasAttribute(attributeName)) {
        continue;
      }

      parts.push(
        `${attributeName}=${element.getAttribute(attributeName) ?? ""}`
      );
    }

    return parts.join("|");
  };

  const createDefaultStyleCache = (): {
    cleanup: () => void;
    getElementDefaults: (element: Element) => Record<string, string>;
  } => {
    let iframeEl: HTMLIFrameElement | null = null;
    const cache = new Map<string, Record<string, string>>();

    const cleanupCache = (): void => {
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
          throw new Error(
            "Could not create the default-style iframe document."
          );
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
      const cachedDefaults = cache.get(key);
      if (cachedDefaults) {
        return cachedDefaults;
      }

      const frameDocument = getFrameDocument();
      const currentFrame = iframeEl;
      const frameWindow = currentFrame?.contentWindow;
      if (!frameWindow) {
        throw new Error("Could not access the default-style iframe window.");
      }

      const baselineElement = frameDocument.createElement(
        element.tagName.toLowerCase()
      );

      for (const attributeName of BASELINE_ATTRIBUTE_NAMES) {
        if (!element.hasAttribute(attributeName)) {
          continue;
        }

        const attributeValue = element.getAttribute(attributeName);
        baselineElement.setAttribute(attributeName, attributeValue ?? "");
      }

      frameDocument.body.append(baselineElement);
      const defaults = snapshotDefaultStyles(
        frameWindow.getComputedStyle(baselineElement)
      );
      baselineElement.remove();
      cache.set(key, defaults);
      return defaults;
    };

    return {
      cleanup: cleanupCache,
      getElementDefaults,
    };
  };

  const defaultStyleCache = createDefaultStyleCache();

  const snapshotStyles = (
    element: Element,
    styles: CSSStyleDeclaration,
    includeAll: boolean,
    parentStyles: Record<string, string> | null
  ): Record<string, string> => {
    const output: Record<string, string> = {};
    const properties = includeAll ? [...styles] : [...CURATED_PROPERTIES];
    const defaultStyles = includeAll
      ? null
      : defaultStyleCache.getElementDefaults(element);

    for (const property of properties) {
      const value = styles.getPropertyValue(property);
      if (!value) {
        continue;
      }

      const trimmedValue = value.trim();
      if (!trimmedValue) {
        continue;
      }

      if (defaultStyles?.[property] === trimmedValue) {
        continue;
      }

      if (
        parentStyles &&
        INHERITED_PROPERTIES.has(property) &&
        parentStyles[property] === trimmedValue
      ) {
        continue;
      }

      output[property] = trimmedValue;
    }

    return output;
  };

  const snapshotPseudoElement = (
    element: Element,
    kind: "before" | "after",
    includeAll: boolean
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
      styles: snapshotStyles(element, styles, includeAll, null),
    };
  };

  const buildCapture = (
    root: Element,
    currentSettings: CaptureSettings
  ): CaptureResult => {
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

      const snapshot = {
        attributes: getSafeAttributes(element),
        boundingBox: getBoundingBox(element.getBoundingClientRect()),
        children: [] as string[],
        classList: [...element.classList],
        id,
        parentId,
        pseudo: {} as Partial<
          Record<
            "after" | "before",
            { kind: "after" | "before"; styles: Record<string, string> }
          >
        >,
        selector: buildSelector(element),
        styles: snapshotStyles(
          element,
          window.getComputedStyle(element),
          currentSettings.captureMode === "full",
          parentId ? (elements[parentId]?.styles ?? null) : null
        ),
        tagName: element.tagName.toLowerCase(),
      };

      if (currentSettings.includePseudoElements) {
        const before = snapshotPseudoElement(
          element,
          "before",
          currentSettings.captureMode === "full"
        );
        const after = snapshotPseudoElement(
          element,
          "after",
          currentSettings.captureMode === "full"
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
        (elements[parentId] as { children: string[] }).children.push(id);
      }

      return id;
    };

    const rootElementId = captureElement(root, null);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        if (
          node instanceof Element &&
          node !== root &&
          !currentSettings.includeHiddenElements &&
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
      metadata: {
        url: window.location.href,
      },
      order,
      rootElementId,
      rootOuterHtml: sanitizeOuterHtml(
        root,
        currentSettings.includeHiddenElements
      ),
      settings: currentSettings,
      summary: {
        elementCount: order.length,
        pseudoElementCount,
      },
      version: 1 as const,
    };
  };

  // --- DOM setup ---

  const mountRoot = document.body ?? document.documentElement;
  const host = document.createElement("div");
  host.id = "style-capture-picker-host";
  host.style.position = "fixed";
  host.style.inset = "0";
  host.style.pointerEvents = "none";
  host.style.zIndex = "2147483647";

  const shadowRoot = host.attachShadow({ mode: "open" });
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    :host {
      all: initial;
      direction: ltr;
      pointer-events: none;
    }
    .frame {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 2147483646;
      box-sizing: border-box;
      border: 1px solid ${FRAME_BORDER_COLOR};
      background: ${FRAME_FILL_COLOR};
      border-radius: 0;
      pointer-events: none;
    }
    .tooltip {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 2147483647;
      pointer-events: none;
      width: max-content;
      max-width: min(${LABEL_MAX_WIDTH}px, calc(100vw - 16px));
      filter: drop-shadow(0px 1px 4px rgba(0, 0, 0, 0.3));
      font-family:
        "Glide",
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      font-size: 13px;
      line-height: 16px;
      transition: opacity 100ms ease-out;
      user-select: none;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .tooltip__panel {
      display: inline-flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 8px;
      background: #232425;
      color: #fff;
      white-space: nowrap;
      font-weight: 500;
      font-synthesis: none;
    }
  `;

  const highlightFrame = document.createElement("div");
  highlightFrame.className = "frame";
  highlightFrame.hidden = true;

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.hidden = true;
  const tooltipPanel = document.createElement("div");
  tooltipPanel.className = "tooltip__panel";

  tooltip.append(tooltipPanel);

  shadowRoot.append(styleEl, highlightFrame, tooltip);
  mountRoot.append(host);

  const cursorStyle = document.createElement("style");
  cursorStyle.id = CURSOR_STYLE_ID;
  cursorStyle.textContent = `html, body, body * { cursor: ${INSPECT_CURSOR} !important; }`;
  (document.head ?? mountRoot).append(cursorStyle);
  const cursorTargets = [document.documentElement, document.body].filter(
    (target): target is HTMLElement => target instanceof HTMLElement
  );
  const previousCursorState = cursorTargets.map((target) => ({
    priority: target.style.getPropertyPriority("cursor"),
    target,
    value: target.style.getPropertyValue("cursor"),
  }));

  for (const target of cursorTargets) {
    target.style.setProperty("cursor", INSPECT_CURSOR, "important");
  }

  // --- Overlay + tooltip update functions ---

  const buildHoverLabel = (element: Element): string => {
    const tagName = element.tagName.toLowerCase();

    let textContent = "";
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          textContent = text;
          break;
        }
      }
    }

    if (textContent) {
      if (textContent.length > TOOLTIP_TEXT_MAX_LENGTH) {
        textContent = `${textContent.slice(0, TOOLTIP_TEXT_MAX_LENGTH)}...`;
      }
      return `${tagName} \u201C${textContent}\u201D`;
    }

    return tagName;
  };

  const updateFrame = (target: Element): void => {
    const box = target.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(target);

    highlightFrame.hidden = false;
    highlightFrame.style.transform = `translate(${box.left}px, ${box.top}px)`;
    highlightFrame.style.width = `${Math.max(box.width, 1)}px`;
    highlightFrame.style.height = `${Math.max(box.height, 1)}px`;
    highlightFrame.style.borderRadius = computedStyle.borderRadius || "0px";
  };

  const updateTooltip = (
    target: Element,
    pointerX: number | null,
    pointerY: number | null
  ): void => {
    tooltipPanel.textContent = buildHoverLabel(target);
    tooltip.hidden = false;
    // Force layout so getBoundingClientRect returns real dimensions
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    tooltip.offsetHeight;

    const box = target.getBoundingClientRect();
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const panelRect = tooltipPanel.getBoundingClientRect();
    const labelWidth =
      panelRect.width || tooltipPanel.scrollWidth || tooltipPanel.offsetWidth;
    const tooltipRect = tooltip.getBoundingClientRect();
    const labelHeight =
      tooltipRect.height ||
      tooltip.scrollHeight ||
      tooltip.offsetHeight ||
      panelRect.height;

    const anchorX = pointerX ?? box.left + box.width / 2;
    const anchorY = pointerY ?? box.top;

    let left = anchorX + TOOLTIP_CURSOR_OFFSET_X;
    let top = anchorY - labelHeight - TOOLTIP_CURSOR_OFFSET_Y;

    if (left + labelWidth > viewportWidth - LABEL_VIEWPORT_MARGIN) {
      left = anchorX - labelWidth - TOOLTIP_CURSOR_OFFSET_X;
    }
    left = Math.max(left, LABEL_VIEWPORT_MARGIN);

    if (top < LABEL_VIEWPORT_MARGIN) {
      top = anchorY + TOOLTIP_CURSOR_OFFSET_Y + 20;
    }
    top = clamp(
      top,
      LABEL_VIEWPORT_MARGIN,
      viewportHeight - labelHeight - LABEL_VIEWPORT_MARGIN
    );

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  const updateOverlay = (
    target: Element,
    pointerX: number | null,
    pointerY: number | null
  ): void => {
    updateFrame(target);
    updateTooltip(target, pointerX, pointerY);
  };

  // --- State (must be defined before event handlers that reference it) ---

  const state = {
    currentTarget: null as Element | null,
    pointerX: null as number | null,
    pointerY: null as number | null,
  };

  // --- Event handler functions ---

  const resolveTargetFromEvent = (
    event: MouseEvent | PointerEvent
  ): Element | null => {
    const [pathTarget] = event.composedPath();
    if (
      pathTarget instanceof Element &&
      pathTarget.getRootNode() !== shadowRoot &&
      !host.contains(pathTarget)
    ) {
      return pathTarget;
    }

    const fallbackTarget = document.elementFromPoint(
      event.clientX,
      event.clientY
    );
    if (
      !fallbackTarget ||
      fallbackTarget.getRootNode() === shadowRoot ||
      host.contains(fallbackTarget)
    ) {
      return null;
    }

    return fallbackTarget;
  };

  const updateTargetFromEvent = (event: MouseEvent | PointerEvent): void => {
    const nextTarget = resolveTargetFromEvent(event);
    if (!nextTarget) {
      return;
    }

    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    state.currentTarget = nextTarget;
    updateOverlay(nextTarget, event.clientX, event.clientY);
  };

  const handlePointerMove = (event: PointerEvent): void => {
    updateTargetFromEvent(event);
  };

  const handleMouseMove = (event: MouseEvent): void => {
    updateTargetFromEvent(event);
  };

  // eslint-disable-next-line no-use-before-define -- circular reference: cleanup removes handlers that call cleanup; all invoked later at event time
  const cleanup = (): void => {
    document.removeEventListener("pointermove", handlePointerMove, true);
    document.removeEventListener("mousemove", handleMouseMove, true);
    document.removeEventListener("mouseover", handleMouseMove, true);
    // eslint-disable-next-line no-use-before-define -- circular: cleanup removes handlers that reference cleanup; all invoked at event time
    document.removeEventListener("pointerdown", handlePointerDown, true);
    // eslint-disable-next-line no-use-before-define -- circular: cleanup removes handlers that reference cleanup; all invoked at event time
    document.removeEventListener("click", handleClick, true);
    // eslint-disable-next-line no-use-before-define -- circular: cleanup removes handlers that reference cleanup; all invoked at event time
    document.removeEventListener("keydown", handleKeyDown, true);
    defaultStyleCache.cleanup();
    cursorStyle.remove();
    for (const { priority, target, value } of previousCursorState) {
      if (value) {
        target.style.setProperty("cursor", value, priority);
      } else {
        target.style.removeProperty("cursor");
      }
    }
    host.remove();
    view[PICKER_KEY] = undefined;
  };

  const handlePointerDown = (event: PointerEvent): void => {
    const target = resolveTargetFromEvent(event) ?? state.currentTarget;
    if (!target) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    try {
      const capture = buildCapture(target, settings);
      tooltipPanel.textContent = "Copied to clipboard";
      (async () => {
        try {
          await chrome.runtime.sendMessage({
            capture,
            type: "capture/completed",
          });
        } catch {
          // noop
        }
      })();
    } catch (error) {
      tooltipPanel.textContent = "Capture failed";
      (async () => {
        try {
          await chrome.runtime.sendMessage({
            error: error instanceof Error ? error.message : "Capture failed.",
            type: "capture/failed",
          });
        } catch {
          // noop
        }
      })();
    }
  };

  // eslint-disable-next-line unicorn/consistent-function-scoping -- must stay inside runPicker: self-contained injected script
  const handleClick = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      cleanup();
      (async () => {
        try {
          await chrome.runtime.sendMessage({
            reason: "Capture cancelled.",
            type: "capture/cancelled",
          });
        } catch {
          // noop
        }
      })();
    }
  };

  // --- Event binding ---

  view[PICKER_KEY] = { cleanup, ...state };

  document.addEventListener("pointermove", handlePointerMove, true);
  document.addEventListener("mousemove", handleMouseMove, true);
  document.addEventListener("mouseover", handleMouseMove, true);
  document.addEventListener("pointerdown", handlePointerDown, true);
  document.addEventListener("click", handleClick, true);
  document.addEventListener("keydown", handleKeyDown, true);
  return "activated";
};
