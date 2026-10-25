import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CaptureResult, PixelClip } from "@style-capture/core";
import type { Page } from "playwright";

import type { captureAssets } from "./capture-assets.ts";
import {
  serializeEvidence,
  redactEvidenceText,
} from "./evidence-serialization.ts";
import { pixelScreenshot } from "./pixel-screenshot.ts";

type AssetsEvidence = Awaited<ReturnType<typeof captureAssets>>;

/** Never overwrite an earlier capture, including an empty directory. */
export const createBundle = async (directory: string): Promise<string> => {
  const absolute = path.resolve(directory);
  await mkdir(path.dirname(absolute), { recursive: true });
  await mkdir(absolute);
  return absolute;
};

export const writeJson = async (
  directory: string,
  file: string,
  value: unknown
) => {
  await writeFile(path.join(directory, file), serializeEvidence(value), {
    flag: "wx",
  });
};

/** Parse only sanitized capture HTML; never serialize the live page here. */
export const writeReplay = async (
  page: Page,
  capture: CaptureResult,
  directory: string,
  file: string,
  backdrop: string,
  assets?: AssetsEvidence,
  pixelClip?: PixelClip
): Promise<void> => {
  if (!capture.elements[capture.rootElementId].domPath)
    throw new Error("Capture-time DOM paths missing; recapture before replay.");
  const paths = Object.fromEntries(
    capture.order.map((id) => [id, capture.elements[id].domPath ?? []])
  );
  const idByIndex = new Map(
    capture.order.map((id) => [capture.elements[id].subtreeIndex, id])
  );
  const assetBindings = (assets?.assets ?? []).flatMap((asset) => {
    if (!asset.file) return [];
    return (asset.references ?? [asset]).flatMap((reference) => {
      const id = idByIndex.get(reference.subtreeIndex);
      return id ? [{ id, file: asset.file ?? "", kind: reference.kind }] : [];
    });
  });
  const renderedFonts: Record<
    string,
    {
      familyName: string;
      postScriptName: string;
      isCustomFont: boolean;
      glyphCount: number;
    }[]
  > = {};
  for (const row of (assets?.fonts.platform ?? []) as {
    subtreeIndex?: number;
    fonts: {
      familyName: string;
      postScriptName: string;
      isCustomFont: boolean;
      glyphCount: number;
    }[];
  }[]) {
    const id = idByIndex.get(row.subtreeIndex);
    if (id && row.subtreeIndex !== undefined) renderedFonts[id] = row.fonts;
  }
  const bindings = { paths, assetBindings, renderedFonts };
  const html = await page.evaluate(
    ({ data, background, resources, nodeBindings, clip }) => {
      const doc = document.implementation.createHTMLDocument("");
      const template = doc.createElement("template");
      template.innerHTML = data.rootOuterHtml;
      const root = template.content.firstElementChild;
      if (root) doc.body.append(root);
      if (!root) return "<!doctype html><html><body></body></html>";
      const localUrls = new Map(
        (resources?.assets ?? []).flatMap((asset) =>
          asset.file ? [[asset.url, asset.file] as const] : []
        )
      );
      const rewrite = (value: string, base = data.metadata.url): string =>
        value.replaceAll(
          /url\(\s*["']?([^"')]+)["']?\s*\)/giu,
          (_match, url: string) => {
            const address = new URL(url.trim(), base);
            const documentUrl = new URL(data.metadata.url);
            const fragment = address.hash;
            address.hash = "";
            documentUrl.hash = "";
            if (
              fragment &&
              (url.trim().startsWith("#") || address.href === documentUrl.href)
            ) {
              let id: string;
              try {
                id = decodeURIComponent(fragment.slice(1));
              } catch {
                return "none";
              }
              if (root.id === id || root.querySelector(`#${CSS.escape(id)}`))
                return `url("#${CSS.escape(id)}")`;
              return "none";
            }
            const local = localUrls.get(new URL(url.trim(), base).href);
            return local ? `url("${local}")` : "none";
          }
        );
      const rules: string[] = [];
      const fontAliases = new Map<string, string>();
      const registerFonts = () => {
        for (const face of resources?.fonts.faces ?? []) {
          const family = (face.descriptors["font-family"] ?? "").replaceAll(
            /["']/gu,
            ""
          );
          const source = rewrite(face.descriptors.src ?? "", face.sourceURL);
          if (!source.includes("url(")) continue;
          const alias =
            fontAliases.get(family) ?? `Capture Font ${fontAliases.size}`;
          fontAliases.set(family, alias);
          const declarations = Object.entries(face.descriptors)
            .filter(([key]) => key !== "src" && key !== "font-family")
            .map(([key, value]) => `${key}:${value};`)
            .join("");
          rules.push(
            `@font-face{font-family:"${alias}";${declarations}src:${source};}`
          );
        }
      };
      registerFonts();
      const resolvedFamily = (id: string, declared: string): string => {
        const fonts = (nodeBindings.renderedFonts[id] ?? []).filter(
          (font) => font.glyphCount > 0
        );
        if (!fonts.length) return declared;
        const platform = fonts
          .filter((font) => !font.isCustomFont)
          .map((font) =>
            /SFNS|SF Pro|System Font/iu.test(
              `${font.familyName} ${font.postScriptName}`
            )
              ? "system-ui"
              : JSON.stringify(font.familyName)
          );
        if (!fonts.some((font) => font.isCustomFont))
          return [...new Set(platform)].join(",");
        const families = declared
          .split(",")
          .map((family) => family.trim().replaceAll(/["']/gu, ""));
        return [
          ...families.map((family) =>
            JSON.stringify(fontAliases.get(family) ?? family)
          ),
          ...platform,
        ].join(",");
      };
      const resolveNode = (id: string): Element | undefined => {
        const item = data.elements[id];
        const steps = nodeBindings.paths[id];
        if (!item || !steps) return;
        let target: Node | undefined = root;
        for (const step of steps) target = target?.childNodes[step];
        if (
          target instanceof Element &&
          target.tagName.toLowerCase() === item.tagName.toLowerCase()
        )
          return target;
      };
      for (const id of data.order) {
        const item = data.elements[id];
        const node = resolveNode(id);
        if (!node) continue;
        // SVG and HTML nodes both support attributes.
        // eslint-disable-next-line unicorn/prefer-dom-node-dataset -- Element also covers SVG nodes
        node.setAttribute("data-style-capture", id);
        node.removeAttribute("style");
        const declaration = doc.createElement("span").style;
        for (const [property, value] of Object.entries(item.styles)) {
          // Replay is offline: external resources need explicit local rewriting.
          declaration.setProperty(property, rewrite(value));
        }
        declaration.setProperty(
          "font-family",
          resolvedFamily(id, item.styles["font-family"] ?? "")
        );
        rules.push(`[data-style-capture="${id}"]{${declaration.cssText}}`);
        for (const pseudo of Object.values(item.pseudo)) {
          if (!pseudo) continue;
          const style = doc.createElement("span").style;
          for (const [property, value] of Object.entries(pseudo.styles)) {
            style.setProperty(property, rewrite(value));
          }
          rules.push(
            `[data-style-capture="${id}"]::${pseudo.kind}{${style.cssText}}`
          );
        }
      }
      const restoreAssets = () => {
        for (const binding of nodeBindings.assetBindings) {
          const node = doc.querySelector(
            `[data-style-capture="${binding.id}"]`
          );
          if (!node) continue;
          if (
            node.tagName.toLowerCase() === "img" &&
            binding.kind === "image-source"
          )
            node.setAttribute("src", binding.file);
          // Inline SVG stays in the captured DOM with its path IDs and computed paint.
          // Downloaded SVG files remain originals for dependency review, never IMG replacements.
        }
      };
      restoreAssets();
      const restorePaintContext = () => {
        const source = clip?.source ?? { x: 0, y: 0 };
        const replayOrigin = clip?.replayOrigin ?? { x: 0, y: 0 };
        const offset = clip?.rootOffset ?? { x: 0, y: 0 };
        let origin = {
          x: source.x - replayOrigin.x,
          y: source.y - replayOrigin.y,
        };
        let container = root.parentElement;
        const contexts = clip?.paintContexts ?? [];
        for (const context of contexts.toReversed()) {
          const wrapper = doc.createElement("div");
          wrapper.dataset.styleCapturePaintContext = "";
          for (const [property, value] of Object.entries(context.styles))
            wrapper.style.setProperty(property, value);
          wrapper.style.cssText += `position:absolute;box-sizing:border-box;left:${context.bounds.x - origin.x}px;top:${context.bounds.y - origin.y}px;width:${context.bounds.width}px;height:${context.bounds.height}px;border-color:transparent;`;
          container?.append(wrapper);
          container = wrapper;
          origin = {
            x: context.bounds.x + context.border.x,
            y: context.bounds.y + context.border.y,
          };
        }
        if (contexts.length) container?.append(root);
        return {
          x: source.x + offset.x - origin.x,
          y: source.y + offset.y - origin.y,
        };
      };
      const normalizeRoot = () => {
        const origin = restorePaintContext();
        const snapshot = data.elements[data.rootElementId];
        if (!snapshot) return;
        const computed = snapshot.styles;
        const number = (key: string) =>
          Number.parseFloat(computed[key] ?? "0") || 0;
        const borderBox = computed["box-sizing"] === "border-box";
        const width = number("width") || snapshot.boundingBox.width;
        const height = number("height") || snapshot.boundingBox.height;
        const outerWidth =
          width +
          (borderBox
            ? 0
            : number("padding-left") +
              number("padding-right") +
              number("border-left-width") +
              number("border-right-width"));
        const outerHeight =
          height +
          (borderBox
            ? 0
            : number("padding-top") +
              number("padding-bottom") +
              number("border-top-width") +
              number("border-bottom-width"));
        const matrix = new DOMMatrix(
          computed.transform === "none" ? undefined : computed.transform
        );
        let transform = "none";
        if (
          matrix.is2D &&
          computed.transform &&
          computed.transform !== "none"
        ) {
          const xs = [
            0,
            matrix.a * outerWidth,
            matrix.c * outerHeight,
            matrix.a * outerWidth + matrix.c * outerHeight,
          ];
          const ys = [
            0,
            matrix.b * outerWidth,
            matrix.d * outerHeight,
            matrix.b * outerWidth + matrix.d * outerHeight,
          ];
          transform = `matrix(${matrix.a},${matrix.b},${matrix.c},${matrix.d},${-Math.min(...xs)},${-Math.min(...ys)})`;
        }
        rules.push(
          `[data-style-capture="${data.rootElementId}"]{box-sizing:border-box;width:${outerWidth}px;height:${outerHeight}px;min-width:0;min-height:0;max-width:none;max-height:none;flex:none;position:absolute;inset:auto;left:${origin?.x ?? 0}px;top:${origin?.y ?? 0}px;margin:0;transform-origin:0 0;transform:${transform};translate:none;rotate:none;scale:none;}`
        );
      };
      normalizeRoot();
      // No scripts or remote loads. This is a static, computed-style replay.
      const policy = doc.createElement("meta");
      policy.httpEquiv = "Content-Security-Policy";
      policy.content =
        "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; font-src 'self';";
      doc.head.append(policy);
      const style = doc.createElement("style");
      style.textContent = `html,body{margin:0;padding:0;background:${background};}\n${rules.join("\n")}`;
      doc.head.append(style);
      return `<!doctype html>\n${doc.documentElement.outerHTML}`;
    },
    {
      data: capture,
      background: backdrop,
      resources: assets,
      nodeBindings: bindings,
      clip: pixelClip,
    }
  );
  await writeFile(path.join(directory, file), redactEvidenceText(html), {
    flag: "wx",
  });
};

export const captureVisualEvidence = async (
  page: Page,
  selector: string,
  capture: CaptureResult,
  directory: string,
  name: string,
  assets?: AssetsEvidence
): Promise<{
  screenshot?: string;
  replay: string;
  gaps: string[];
  pixelClip?: PixelClip;
}> => {
  const replay = `${name}.html`;
  const gaps = [
    "Computed replay is static; unavailable assets and ancestor layout are not reconstructed.",
    "Inline SVG DOM and computed paint are retained. Sprite references removed by HTML sanitization require dependency restoration before claiming parity.",
    "Custom faces use capture-only aliases; per-node platform font evidence preserves local fallbacks. Nodes without glyph evidence and pseudo-element glyphs require separate verification.",
    "Root placement preserves original viewport raster coordinates. Two-dimensional matrix scale/rotation is retained; ancestor transforms, perspective and individual translate/rotate/scale properties require separate comparison.",
  ];
  const backdrop = await page
    .locator(selector)
    .first()
    .evaluate((element) => {
      let current = element.parentElement;
      while (current) {
        const color = getComputedStyle(current).backgroundColor;
        if (color !== "rgba(0, 0, 0, 0)" && color !== "transparent")
          return color;
        current = current.parentElement;
      }
      return "white";
    });
  gaps.push(
    "Replay backdrop uses nearest painted ancestor colour; gradients and layered transparency require comparison. Paint containment and overflow clipping ancestors are retained as empty positioning wrappers. Ancestor transforms, masks and layered backgrounds require comparison."
  );
  let pixelClip: PixelClip | undefined;
  try {
    await page
      .locator(selector)
      .first()
      .scrollIntoViewIfNeeded({ timeout: 10_000 });
    pixelClip = await page
      .locator(selector)
      .first()
      .evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const dpr = devicePixelRatio;
        const left = Math.floor(bounds.left * dpr);
        const top = Math.floor(bounds.top * dpr);
        const right = Math.ceil(bounds.right * dpr);
        const bottom = Math.ceil(bounds.bottom * dpr);
        if (
          left < 0 ||
          top < 0 ||
          right > innerWidth * dpr ||
          bottom > innerHeight * dpr
        )
          throw new Error(
            "Pixel-aligned component crop extends beyond the viewport."
          );
        const paintContexts = [];
        for (
          let parent = element.parentElement;
          parent;
          parent = parent.parentElement
        ) {
          const style = getComputedStyle(parent);
          const contained = /(?:^|\s)(?:paint|content|strict)(?:$|\s)/u.test(
            style.contain
          );
          if (
            !contained &&
            style.overflowX === "visible" &&
            style.overflowY === "visible"
          )
            continue;
          const box = parent.getBoundingClientRect();
          const properties = [
            "contain",
            "overflow-x",
            "overflow-y",
            "overflow-clip-margin",
            "border-top-left-radius",
            "border-top-right-radius",
            "border-bottom-left-radius",
            "border-bottom-right-radius",
            "border-top-width",
            "border-left-width",
            "border-right-width",
            "border-bottom-width",
            "border-top-style",
            "border-left-style",
            "border-right-style",
            "border-bottom-style",
          ];
          paintContexts.push({
            bounds: {
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
            },
            border: {
              x: Number.parseFloat(style.borderLeftWidth),
              y: Number.parseFloat(style.borderTopWidth),
            },
            styles: Object.fromEntries(
              properties.map((property) => [
                property,
                style.getPropertyValue(property),
              ])
            ),
          });
        }
        return {
          paintContexts,
          deviceScaleFactor: dpr,
          replayOrigin: { x: left / dpr, y: top / dpr },
          source: {
            x: left / dpr,
            y: top / dpr,
            width: (right - left) / dpr,
            height: (bottom - top) / dpr,
          },
          rootOffset: {
            x: bounds.left - left / dpr,
            y: bounds.top - top / dpr,
          },
          pixelWidth: right - left,
          pixelHeight: bottom - top,
        };
      });
    const boxes = await page
      .locator(selector)
      .first()
      .evaluate(
        (root, elements) =>
          Object.fromEntries(
            Object.entries(elements).flatMap(([id, item]) => {
              let node: Node | undefined = root;
              for (const step of item.domPath ?? [])
                node = node?.childNodes[step];
              return node instanceof Element
                ? [[id, node.getBoundingClientRect().toJSON()]]
                : [];
            })
          ),
        capture.elements
      );
    for (const [id, bounds] of Object.entries(boxes))
      capture.elements[id].boundingBox = bounds;
    await writeReplay(
      page,
      capture,
      directory,
      replay,
      backdrop,
      assets,
      pixelClip
    );
    const hasPopulatedControl = await page
      .locator(selector)
      .first()
      .evaluate((root) => {
        const nodes = [
          root,
          ...root.querySelectorAll("input,textarea,select,[contenteditable]"),
        ];
        return nodes.some((node) => {
          if (node instanceof HTMLInputElement)
            return (
              ![
                "button",
                "submit",
                "reset",
                "checkbox",
                "radio",
                "hidden",
              ].includes(node.type) && Boolean(node.value)
            );
          if (node instanceof HTMLTextAreaElement) return Boolean(node.value);
          if (node instanceof HTMLSelectElement)
            return [...node.selectedOptions].some((option) =>
              Boolean(option.value)
            );
          return (
            node instanceof HTMLElement &&
            node.isContentEditable &&
            Boolean(node.textContent?.trim())
          );
        });
      });
    if (hasPopulatedControl) {
      gaps.push(
        "Screenshot omitted: the selected subtree contains a populated form control or editable text. No source image was captured or redacted."
      );
      return { replay, gaps, pixelClip };
    }
    const screenshot = `${name}.png`;
    await writeFile(
      path.join(directory, screenshot),
      await pixelScreenshot(page, pixelClip),
      { flag: "wx" }
    );
    return { screenshot, replay, gaps, pixelClip };
  } catch (error) {
    gaps.push(
      `Reference crop unavailable: ${error instanceof Error ? error.message : String(error)}`
    );
    return { replay, gaps, pixelClip };
  }
};
