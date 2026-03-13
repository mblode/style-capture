import type {
  BoundingBox,
  CaptureResult,
  CaptureSettings,
  ElementSnapshot,
  PseudoElementSnapshot,
} from "@/lib/types.ts";

export type PickerRunResult = "activated" | "already-active";

export function runPicker(settings: CaptureSettings): PickerRunResult {
  const PICKER_KEY = "__STYLE_CAPTURE_PICKER__";
  const CURSOR_STYLE_ID = "style-capture-picker-cursor-style";
  const INSPECT_CURSOR =
    'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%23d239c0%27 d=%27M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z%27/%3E%3C/svg%3E") 12 12, crosshair';
  const GRAB_PURPLE_RGB = "210, 57, 192";
  const FRAME_BORDER_COLOR = `rgba(${GRAB_PURPLE_RGB}, 0.5)`;
  const FRAME_FILL_COLOR = `rgba(${GRAB_PURPLE_RGB}, 0.08)`;
  const LABEL_VIEWPORT_MARGIN = 8;
  const LABEL_GAP = 4;
  const LABEL_MAX_WIDTH = 280;
  const LABEL_ARROW_MAX_SIZE = 8;
  const LABEL_ARROW_MIN_SIZE = 4;
  const LABEL_ARROW_WIDTH_RATIO = 0.2;
  const LABEL_ARROW_EDGE_MARGIN = 16;
  const TOOLTIP_MAX_SEGMENTS = 3;
  const TOOLTIP_TOKEN_MAX_LENGTH = 24;
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
    return "already-active";
  }

  const mountRoot = document.body ?? document.documentElement;
  const host = document.createElement("div");
  host.id = "style-capture-picker-host";
  host.style.position = "fixed";
  host.style.inset = "0";
  host.style.pointerEvents = "none";
  host.style.zIndex = "2147483647";

  const shadowRoot = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
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
      transition:
        transform 100ms ease-out,
        width 100ms ease-out,
        height 100ms ease-out,
        border-radius 100ms ease-out;
    }
    .tooltip {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 2147483647;
      pointer-events: none;
      width: max-content;
      max-width: min(${LABEL_MAX_WIDTH}px, calc(100vw - 16px));
      color: #000;
      filter: drop-shadow(0px 1px 2px rgba(81, 81, 81, 0.25));
      font-family:
        "Geist",
        "Glide",
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      font-size: 13px;
      line-height: 16px;
      transform: translateX(calc(-50% + var(--tooltip-edge-offset, 0px)));
      transition:
        top 100ms ease-out,
        left 100ms ease-out,
        transform 100ms ease-out;
      user-select: none;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .tooltip__arrow {
      position: absolute;
      width: 0;
      height: 0;
      left: 50%;
      border-left: var(--tooltip-arrow-size, 8px) solid transparent;
      border-right: var(--tooltip-arrow-size, 8px) solid transparent;
      transform: translateX(-50%);
    }
    .tooltip[data-arrow-position="bottom"] .tooltip__arrow {
      top: 0;
      border-bottom: var(--tooltip-arrow-size, 8px) solid #fff;
      transform: translate(-50%, -100%);
    }
    .tooltip[data-arrow-position="top"] .tooltip__arrow {
      bottom: 0;
      border-top: var(--tooltip-arrow-size, 8px) solid #fff;
      transform: translate(-50%, 100%);
    }
    .tooltip__panel {
      display: flex;
      align-items: center;
      gap: 5px;
      width: fit-content;
      max-width: 100%;
      padding: 6px 8px;
      border-radius: 10px;
      background: #fff;
      font-synthesis: none;
      corner-shape: superellipse(1.25);
    }
    .tooltip__label {
      display: block;
      max-width: 100%;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
    }
    .tooltip__label-prefix {
      color: rgba(0, 0, 0, 0.5);
    }
    .tooltip__label-target {
      color: #000;
    }
  `;

  const frame = document.createElement("div");
  frame.className = "frame";
  frame.hidden = true;

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.hidden = true;
  tooltip.dataset.arrowPosition = "bottom";

  const tooltipArrow = document.createElement("div");
  tooltipArrow.className = "tooltip__arrow";

  const tooltipPanel = document.createElement("div");
  tooltipPanel.className = "tooltip__panel";

  const tooltipLabel = document.createElement("span");
  tooltipLabel.className = "tooltip__label";

  const tooltipLabelPrefix = document.createElement("span");
  tooltipLabelPrefix.className = "tooltip__label-prefix";

  const tooltipLabelTarget = document.createElement("span");
  tooltipLabelTarget.className = "tooltip__label-target";

  tooltipLabel.append(tooltipLabelPrefix, tooltipLabelTarget);
  tooltipPanel.append(tooltipLabel);
  tooltip.append(tooltipArrow, tooltipPanel);

  shadowRoot.append(style, frame, tooltip);
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

  const state = {
    cleanup,
    currentTarget: null as Element | null,
    pointerX: null as number | null,
    pointerY: null as number | null,
  };
  const defaultStyleCache = createDefaultStyleCache();

  view[PICKER_KEY] = state;

  function cleanup(): void {
    document.removeEventListener("pointermove", handlePointerMove, true);
    document.removeEventListener("mousemove", handleMouseMove, true);
    document.removeEventListener("mouseover", handleMouseMove, true);
    document.removeEventListener("pointerdown", handlePointerDown, true);
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
    delete view[PICKER_KEY];
  }

  function handlePointerMove(event: PointerEvent): void {
    updateTargetFromEvent(event);
  }

  function handleMouseMove(event: MouseEvent): void {
    updateTargetFromEvent(event);
  }

  function updateTargetFromEvent(event: MouseEvent | PointerEvent): void {
    const nextTarget = resolveTargetFromEvent(event);
    if (!nextTarget) {
      return;
    }

    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    state.currentTarget = nextTarget;
    updateOverlay(nextTarget, event.clientX);
  }

  function handlePointerDown(event: PointerEvent): void {
    const target = resolveTargetFromEvent(event) ?? state.currentTarget;
    if (!target) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    try {
      const capture = buildCapture(target, settings);
      cleanup();
      chrome.runtime
        .sendMessage({
          capture,
          type: "capture/completed",
        })
        .catch(() => undefined);
    } catch (error) {
      cleanup();
      chrome.runtime
        .sendMessage({
          error: error instanceof Error ? error.message : "Capture failed.",
          type: "capture/failed",
        })
        .catch(() => undefined);
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      cleanup();
      chrome.runtime
        .sendMessage({
          reason: "Capture cancelled.",
          type: "capture/cancelled",
        })
        .catch(() => undefined);
      return;
    }

    if (!state.currentTarget) {
      return;
    }

    if (event.key === "Shift") {
      const parent = state.currentTarget.parentElement;
      if (parent) {
        state.currentTarget = parent;
        updateOverlay(parent, state.pointerX);
      }
      return;
    }

    if (event.key === "Alt") {
      const child = state.currentTarget.firstElementChild;
      if (child) {
        state.currentTarget = child;
        updateOverlay(child, state.pointerX);
      }
    }
  }

  function resolveTargetFromEvent(
    event: MouseEvent | PointerEvent
  ): Element | null {
    const pathTarget = event.composedPath()[0];
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
  }

  function updateFrame(target: Element): void {
    const box = target.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(target);

    frame.hidden = false;
    frame.style.transform = `translate(${box.left}px, ${box.top}px)`;
    frame.style.width = `${Math.max(box.width, 1)}px`;
    frame.style.height = `${Math.max(box.height, 1)}px`;
    frame.style.borderRadius = computedStyle.borderRadius || "0px";
  }

  function updateOverlay(target: Element, pointerX: number | null): void {
    updateFrame(target);
    updateTooltip(target, pointerX);
  }

  function updateTooltip(target: Element, pointerX: number | null): void {
    const label = buildHoverLabelParts(target);
    tooltipLabelPrefix.textContent = label.prefix;
    tooltipLabelPrefix.hidden = label.prefix.length === 0;
    tooltipLabelTarget.textContent = label.target;
    tooltip.hidden = false;

    const box = target.getBoundingClientRect();
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const panelRect = tooltipPanel.getBoundingClientRect();
    const labelWidth =
      panelRect.width || tooltipPanel.scrollWidth || tooltipPanel.offsetWidth;
    const arrowSize = getTooltipArrowSize(labelWidth);
    const tooltipRect = tooltip.getBoundingClientRect();
    const labelHeight =
      tooltipRect.height ||
      tooltip.scrollHeight ||
      tooltip.offsetHeight ||
      panelRect.height + arrowSize;
    const anchorX = pointerX ?? box.left + box.width / 2;
    const labelHalfWidth = labelWidth / 2;

    let edgeOffsetX = 0;
    if (labelWidth > 0) {
      const labelLeft = anchorX - labelHalfWidth;
      const labelRight = anchorX + labelHalfWidth;

      if (labelRight > viewportWidth - LABEL_VIEWPORT_MARGIN) {
        edgeOffsetX = viewportWidth - LABEL_VIEWPORT_MARGIN - labelRight;
      }

      if (labelLeft + edgeOffsetX < LABEL_VIEWPORT_MARGIN) {
        edgeOffsetX = LABEL_VIEWPORT_MARGIN - labelLeft;
      }
    }

    let top = box.bottom + arrowSize + LABEL_GAP;
    let arrowPosition: "bottom" | "top" = "bottom";
    if (top + labelHeight > viewportHeight - LABEL_VIEWPORT_MARGIN) {
      top = box.top - labelHeight - arrowSize - LABEL_GAP;
      arrowPosition = "top";
    }

    top = Math.max(top, LABEL_VIEWPORT_MARGIN);

    tooltip.dataset.arrowPosition = arrowPosition;
    tooltip.style.setProperty("--tooltip-arrow-size", `${arrowSize}px`);
    tooltip.style.setProperty("--tooltip-edge-offset", `${edgeOffsetX}px`);
    tooltip.style.left = `${anchorX}px`;
    tooltip.style.top = `${top}px`;
    updateTooltipArrowPosition(labelWidth, edgeOffsetX);
  }

  function buildHoverLabelParts(element: Element): {
    prefix: string;
    target: string;
  } {
    const segments: string[] = [];
    let current: Element | null = element;

    while (
      current &&
      current.nodeType === Node.ELEMENT_NODE &&
      segments.length < TOOLTIP_MAX_SEGMENTS
    ) {
      segments.unshift(buildHoverSegment(current));
      current = current.parentElement;
    }

    const targetSegment = segments.at(-1) ?? "";
    const prefixSegments = segments.slice(0, -1);

    return {
      prefix:
        prefixSegments.length > 0 ? `${prefixSegments.join(" > ")} > ` : "",
      target: targetSegment,
    };
  }

  function buildHoverSegment(element: Element): string {
    const tagName = element.tagName.toLowerCase();

    if (element.id) {
      return `${tagName}#${truncateToken(element.id)}`;
    }

    const firstClassName = Array.from(element.classList).find(Boolean);
    if (firstClassName) {
      return `${tagName}.${truncateToken(firstClassName)}`;
    }

    return tagName;
  }

  function truncateToken(value: string): string {
    if (value.length <= TOOLTIP_TOKEN_MAX_LENGTH) {
      return value;
    }

    return `${value.slice(0, TOOLTIP_TOKEN_MAX_LENGTH - 3)}...`;
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  function getTooltipArrowSize(labelWidth: number): number {
    if (labelWidth <= 0) {
      return LABEL_ARROW_MAX_SIZE;
    }

    const scaledSize = labelWidth * LABEL_ARROW_WIDTH_RATIO;
    return clamp(scaledSize, LABEL_ARROW_MIN_SIZE, LABEL_ARROW_MAX_SIZE);
  }

  function updateTooltipArrowPosition(
    labelWidth: number,
    edgeOffsetX: number
  ): void {
    if (labelWidth <= 0) {
      tooltipArrow.style.left = "50%";
      return;
    }

    const labelHalfWidth = labelWidth / 2;
    const arrowCenter = clamp(
      labelHalfWidth - edgeOffsetX,
      Math.min(LABEL_ARROW_EDGE_MARGIN, labelHalfWidth),
      Math.max(labelWidth - LABEL_ARROW_EDGE_MARGIN, labelHalfWidth)
    );

    tooltipArrow.style.left = `${arrowCenter}px`;
  }

  function buildCapture(
    root: Element,
    currentSettings: CaptureSettings
  ): CaptureResult {
    const elements: Record<string, ElementSnapshot> = {};
    const order: string[] = [];
    const idByElement = new WeakMap<Element, string>();
    let pseudoElementCount = 0;
    let nextId = 0;

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
        capturedAt: new Date().toISOString(),
        title: document.title,
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
      order,
      rootElementId,
      rootOuterHtml: sanitizeOuterHtml(root),
      settings: currentSettings,
      summary: {
        elementCount: order.length,
        pseudoElementCount,
      },
      version: 1 as const,
    };

    function captureElement(element: Element, parentId: string | null): string {
      const id = `node-${nextId}`;
      nextId += 1;
      idByElement.set(element, id);
      order.push(id);

      const snapshot = {
        attributes: getSafeAttributes(element),
        boundingBox: getBoundingBox(element.getBoundingClientRect()),
        children: [] as string[],
        classList: Array.from(element.classList),
        id,
        parentId,
        pseudo: {} as Partial<
          Record<
            "before" | "after",
            { kind: "before" | "after"; styles: Record<string, string> }
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
    }
  }

  function snapshotStyles(
    element: Element,
    styles: CSSStyleDeclaration,
    includeAll: boolean,
    parentStyles: Record<string, string> | null
  ): Record<string, string> {
    const output: Record<string, string> = {};
    const properties = includeAll
      ? Array.from(styles)
      : [...CURATED_PROPERTIES];
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
  }

  function snapshotPseudoElement(
    element: Element,
    kind: "before" | "after",
    includeAll: boolean
  ): PseudoElementSnapshot | null {
    const styles = window.getComputedStyle(element, `::${kind}`);
    const content = styles.getPropertyValue("content").trim();
    const display = styles.getPropertyValue("display").trim();
    const width = styles.getPropertyValue("width").trim();
    const height = styles.getPropertyValue("height").trim();
    const backgroundColor = styles.getPropertyValue("background-color").trim();
    const borderWidth = styles.getPropertyValue("border-top-width").trim();

    if (
      content === "none" &&
      display === "inline" &&
      width === "auto" &&
      height === "auto" &&
      backgroundColor === "rgba(0, 0, 0, 0)" &&
      borderWidth === "0px"
    ) {
      return null;
    }

    return {
      kind,
      styles: snapshotStyles(element, styles, includeAll, null),
    };
  }

  function createDefaultStyleCache(): {
    cleanup: () => void;
    getElementDefaults: (element: Element) => Record<string, string>;
  } {
    let frame: HTMLIFrameElement | null = null;
    const cache = new Map<string, Record<string, string>>();

    function cleanupCache(): void {
      cache.clear();
      frame?.remove();
      frame = null;
    }

    function getElementDefaults(element: Element): Record<string, string> {
      const key = buildDefaultStyleCacheKey(element);
      const cachedDefaults = cache.get(key);
      if (cachedDefaults) {
        return cachedDefaults;
      }

      const frameDocument = getFrameDocument();
      const currentFrame = frame;
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
    }

    function getFrameDocument(): Document {
      if (!frame) {
        frame = document.createElement("iframe");
        frame.setAttribute("aria-hidden", "true");
        frame.tabIndex = -1;
        frame.style.position = "fixed";
        frame.style.top = "-9999px";
        frame.style.left = "-9999px";
        frame.style.width = "0";
        frame.style.height = "0";
        frame.style.border = "0";
        frame.style.opacity = "0";
        frame.style.pointerEvents = "none";
        document.documentElement.append(frame);

        const nextDocument = frame.contentDocument;
        if (!nextDocument) {
          throw new Error(
            "Could not create the default-style iframe document."
          );
        }

        nextDocument.open();
        nextDocument.write("<!doctype html><html><body></body></html>");
        nextDocument.close();
      }

      if (!frame.contentDocument) {
        throw new Error("Could not access the default-style iframe document.");
      }

      return frame.contentDocument;
    }

    return {
      cleanup: cleanupCache,
      getElementDefaults,
    };
  }

  function snapshotDefaultStyles(
    styles: CSSStyleDeclaration
  ): Record<string, string> {
    const output: Record<string, string> = {};

    for (const property of CURATED_PROPERTIES) {
      const value = styles.getPropertyValue(property).trim();
      if (!value) {
        continue;
      }

      output[property] = value;
    }

    return output;
  }

  function buildDefaultStyleCacheKey(element: Element): string {
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
  }

  function getBoundingBox(rect: DOMRect): BoundingBox {
    return {
      bottom: rect.bottom,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      width: rect.width,
      x: rect.x,
      y: rect.y,
    };
  }

  function buildSelector(element: Element): string {
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
      const classes = Array.from(current.classList).slice(0, 2);
      const classSelector = classes
        .map((className) => `.${CSS.escape(className)}`)
        .join("");
      const index = current.parentElement
        ? Array.from(current.parentElement.children).indexOf(current) + 1
        : 1;

      segments.unshift(`${tagName}${classSelector}:nth-child(${index})`);
      current = current.parentElement;
    }

    return segments.join(" > ");
  }

  function getSafeAttributes(element: Element): Record<string, string> {
    const safeAttributes: Record<string, string> = {};

    for (const attribute of Array.from(element.attributes)) {
      if (shouldOmitAttribute(attribute.name)) {
        continue;
      }

      safeAttributes[attribute.name] = attribute.value;
    }

    return safeAttributes;
  }

  function sanitizeOuterHtml(root: Element): string {
    const clone = root.cloneNode(true);
    if (!(clone instanceof Element)) {
      return "";
    }

    if (shouldOmitElement(clone)) {
      return createOmittedElementComment(clone);
    }

    pruneUnsafeDescendants(clone);
    sanitizeElement(clone);

    for (const element of clone.querySelectorAll("*")) {
      sanitizeElement(element);
    }

    return clone.outerHTML;
  }

  function sanitizeElement(element: Element): void {
    if (shouldOmitElement(element)) {
      element.replaceWith(
        element.ownerDocument.createComment(element.tagName.toLowerCase())
      );
      return;
    }

    for (const attribute of Array.from(element.attributes)) {
      if (shouldOmitAttribute(attribute.name)) {
        element.removeAttribute(attribute.name);
      }
    }

    if (element instanceof HTMLTextAreaElement) {
      element.textContent = "";
    }
  }

  function pruneUnsafeDescendants(root: Element): void {
    for (const element of Array.from(root.querySelectorAll("*"))) {
      if (shouldOmitElement(element)) {
        element.replaceWith(
          element.ownerDocument.createComment(element.tagName.toLowerCase())
        );
      }
    }
  }

  function createOmittedElementComment(element: Element): string {
    return `<!--${element.tagName.toLowerCase()}-->`;
  }

  function shouldOmitElement(element: Element): boolean {
    return OMITTED_ELEMENT_NAMES.has(element.tagName.toLowerCase());
  }

  function shouldOmitAttribute(attributeName: string): boolean {
    const normalizedAttributeName = attributeName.toLowerCase();

    return (
      normalizedAttributeName.startsWith("on") ||
      normalizedAttributeName === "nonce" ||
      OMITTED_ATTRIBUTE_NAMES.has(normalizedAttributeName) ||
      OMITTED_URL_ATTRIBUTE_NAMES.has(normalizedAttributeName)
    );
  }

  function isElementHidden(element: Element): boolean {
    const styles = window.getComputedStyle(element);
    return styles.display === "none" || styles.visibility === "hidden";
  }

  document.addEventListener("pointermove", handlePointerMove, true);
  document.addEventListener("mousemove", handleMouseMove, true);
  document.addEventListener("mouseover", handleMouseMove, true);
  document.addEventListener("pointerdown", handlePointerDown, true);
  document.addEventListener("keydown", handleKeyDown, true);
  return "activated";
}
