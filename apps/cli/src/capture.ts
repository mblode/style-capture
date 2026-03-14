import type { CaptureResult, CaptureSettings } from "@style-capture/core";
import type { Page } from "playwright";

/**
 * Runs the capture pipeline inside a Playwright page context.
 * This mirrors the extension's `buildCapture` from `run-picker.ts`,
 * adapted to run via `page.evaluate()`.
 */
export async function captureElement(
  page: Page,
  selector: string,
  settings: CaptureSettings
): Promise<CaptureResult> {
  const result = await page.evaluate(
    ({ selector, settings }) => {
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

      const root = document.querySelector(selector);
      if (!root) {
        throw new Error(`No element found for selector: ${selector}`);
      }

      const elements: Record<
        string,
        {
          attributes: Record<string, string>;
          boundingBox: {
            bottom: number;
            height: number;
            left: number;
            right: number;
            top: number;
            width: number;
            x: number;
            y: number;
          };
          children: string[];
          classList: string[];
          id: string;
          parentId: string | null;
          pseudo: Record<
            string,
            { kind: "before" | "after"; styles: Record<string, string> }
          >;
          selector: string;
          styles: Record<string, string>;
          tagName: string;
        }
      > = {};
      const order: string[] = [];
      const idByElement = new WeakMap<Element, string>();
      let pseudoElementCount = 0;
      let nextId = 0;

      // Default style cache using hidden iframe
      const defaultStyleFrame = document.createElement("iframe");
      defaultStyleFrame.setAttribute("aria-hidden", "true");
      defaultStyleFrame.tabIndex = -1;
      defaultStyleFrame.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0;opacity:0;pointer-events:none";
      document.documentElement.append(defaultStyleFrame);
      const defaultDoc = defaultStyleFrame.contentDocument;
      if (defaultDoc) {
        defaultDoc.open();
        defaultDoc.write("<!doctype html><html><body></body></html>");
        defaultDoc.close();
      }
      const defaultStyleCache = new Map<string, Record<string, string>>();

      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: mirrors extension capture logic in self-contained page.evaluate
      function getDefaultStyles(element: Element): Record<string, string> {
        const parts = [element.tagName.toLowerCase()];
        for (const attr of BASELINE_ATTRIBUTE_NAMES) {
          if (element.hasAttribute(attr)) {
            parts.push(`${attr}=${element.getAttribute(attr) ?? ""}`);
          }
        }
        const key = parts.join("|");

        const cached = defaultStyleCache.get(key);
        if (cached) {
          return cached;
        }

        const frameDoc = defaultStyleFrame.contentDocument;
        const frameWin = defaultStyleFrame.contentWindow;
        if (!(frameDoc && frameWin)) {
          return {};
        }

        const baseline = frameDoc.createElement(element.tagName.toLowerCase());
        for (const attr of BASELINE_ATTRIBUTE_NAMES) {
          if (element.hasAttribute(attr)) {
            baseline.setAttribute(attr, element.getAttribute(attr) ?? "");
          }
        }
        frameDoc.body.append(baseline);
        const computed = frameWin.getComputedStyle(baseline);
        const defaults: Record<string, string> = {};
        for (const prop of CURATED_PROPERTIES) {
          const val = computed.getPropertyValue(prop).trim();
          if (val) {
            defaults[prop] = val;
          }
        }
        baseline.remove();
        defaultStyleCache.set(key, defaults);
        return defaults;
      }

      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: mirrors extension capture logic in self-contained page.evaluate
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
        const defaultStyles = includeAll ? null : getDefaultStyles(element);

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
      }

      function snapshotPseudo(
        element: Element,
        kind: "before" | "after",
        includeAll: boolean
      ): { kind: "before" | "after"; styles: Record<string, string> } | null {
        const styles = window.getComputedStyle(element, `::${kind}`);
        const content = styles.getPropertyValue("content").trim();
        const display = styles.getPropertyValue("display").trim();
        const w = styles.getPropertyValue("width").trim();
        const h = styles.getPropertyValue("height").trim();
        const bg = styles.getPropertyValue("background-color").trim();
        const bw = styles.getPropertyValue("border-top-width").trim();

        if (
          content === "none" &&
          display === "inline" &&
          w === "auto" &&
          h === "auto" &&
          bg === "rgba(0, 0, 0, 0)" &&
          bw === "0px"
        ) {
          return null;
        }

        return {
          kind,
          styles: snapshotStyles(element, styles, includeAll, null),
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
          const tag = current.tagName.toLowerCase();
          const classes = Array.from(current.classList)
            .slice(0, 2)
            .map((c) => `.${CSS.escape(c)}`)
            .join("");
          const idx = current.parentElement
            ? Array.from(current.parentElement.children).indexOf(current) + 1
            : 1;
          segments.unshift(`${tag}${classes}:nth-child(${idx})`);
          current = current.parentElement;
        }
        return segments.join(" > ");
      }

      function shouldOmitAttr(name: string): boolean {
        const n = name.toLowerCase();
        return (
          n.startsWith("on") ||
          n === "nonce" ||
          OMITTED_ATTRIBUTE_NAMES.has(n) ||
          OMITTED_URL_ATTRIBUTE_NAMES.has(n)
        );
      }

      function getSafeAttributes(el: Element): Record<string, string> {
        const safe: Record<string, string> = {};
        for (const attr of Array.from(el.attributes)) {
          if (!shouldOmitAttr(attr.name)) {
            safe[attr.name] = attr.value;
          }
        }
        return safe;
      }

      function getBoundingBox(rect: DOMRect) {
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

      function isHidden(el: Element): boolean {
        const s = window.getComputedStyle(el);
        return s.display === "none" || s.visibility === "hidden";
      }

      function sanitizeOuterHtml(root: Element): string {
        const clone = root.cloneNode(true);
        if (!(clone instanceof Element)) {
          return "";
        }

        // Remove omitted elements
        for (const el of Array.from(clone.querySelectorAll("*"))) {
          if (OMITTED_ELEMENT_NAMES.has(el.tagName.toLowerCase())) {
            el.replaceWith(
              el.ownerDocument.createComment(el.tagName.toLowerCase())
            );
          }
        }

        // Sanitize attributes
        function sanitize(el: Element) {
          for (const attr of Array.from(el.attributes)) {
            if (shouldOmitAttr(attr.name)) {
              el.removeAttribute(attr.name);
            }
          }
          if (el instanceof HTMLTextAreaElement) {
            el.textContent = "";
          }
        }
        sanitize(clone);
        for (const el of clone.querySelectorAll("*")) {
          sanitize(el);
        }

        return clone.outerHTML;
      }

      function captureEl(element: Element, parentId: string | null): string {
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
          pseudo: {} as Record<
            string,
            { kind: "before" | "after"; styles: Record<string, string> }
          >,
          selector: buildSelector(element),
          styles: snapshotStyles(
            element,
            window.getComputedStyle(element),
            settings.captureMode === "full",
            parentId ? (elements[parentId]?.styles ?? null) : null
          ),
          tagName: element.tagName.toLowerCase(),
        };

        if (settings.includePseudoElements) {
          const before = snapshotPseudo(
            element,
            "before",
            settings.captureMode === "full"
          );
          const after = snapshotPseudo(
            element,
            "after",
            settings.captureMode === "full"
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
      }

      const rootElementId = captureEl(root, null);

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
        acceptNode(node) {
          if (
            node instanceof Element &&
            node !== root &&
            !settings.includeHiddenElements &&
            isHidden(node)
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
        captureEl(current, parentId);
      }

      // Cleanup
      defaultStyleFrame.remove();

      return {
        elements,
        metadata: { url: window.location.href, title: document.title },
        order,
        rootElementId,
        rootOuterHtml: sanitizeOuterHtml(root),
        settings,
        summary: {
          elementCount: order.length,
          pseudoElementCount,
        },
        version: 1 as const,
      };
    },
    { selector, settings }
  );

  return result as CaptureResult;
}
