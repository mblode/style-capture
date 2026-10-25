import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { Page } from "playwright";

import { captureSvg } from "./capture-assets-svg.ts";

interface Resource {
  url: string;
  kind: string;
  subtreeIndex?: number;
  svgIndex?: number;
  imageIndex?: number;
}
type Asset = Resource & {
  file?: string;
  sha256?: string;
  bytes?: number;
  failure?: string;
  finalUrl?: string;
  references?: Resource[];
  originalSha256?: string;
};
interface Face {
  sourceURL: string;
  cssText: string;
  descriptors: Record<string, string>;
}
const hash = (bytes: Uint8Array | string) =>
  createHash("sha256").update(bytes).digest("hex");
const urls = (css: string, base: string): string[] =>
  Array.from(css.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g), (m) => {
    try {
      return new URL(m[1] || "", base).href;
    } catch {
      return "";
    }
  }).filter(Boolean);

const safeUrl = (value: string): string => {
  const url = new URL(value);
  if (url.protocol === "data:") return `data:sha256:${hash(value)}`;
  url.username = "";
  url.password = "";
  for (const key of url.searchParams.keys())
    if (/token|secret|signature|credential|auth|key/i.test(key))
      url.searchParams.set(key, "REDACTED");
  return url.href;
};
async function readResource(page: Page, value: string) {
  const url = new URL(value);
  if (url.protocol === "data:") {
    const comma = value.indexOf(",");
    const descriptor = value.slice(5, comma);
    const payload = value.slice(comma + 1);
    const bytes = descriptor.endsWith(";base64")
      ? Buffer.from(payload, "base64")
      : Buffer.from(decodeURIComponent(payload));
    if (bytes.length > 20 * 1024 * 1024)
      throw new Error("Asset exceeds 20 MiB limit");
    return {
      bytes,
      type: descriptor.split(";")[0] || "text/plain",
      finalUrl: value,
    };
  }
  if (url.protocol === "blob:") {
    const result = await page.evaluate(async (resource) => {
      const response = await fetch(resource);
      const blob = await response.blob();
      if (blob.size > 20 * 1024 * 1024)
        throw new Error("Asset exceeds 20 MiB limit");
      const buffer = new Uint8Array(await blob.arrayBuffer());
      let binary = "";
      for (const byte of buffer) binary += String.fromCodePoint(byte);
      return { body: btoa(binary), type: blob.type };
    }, value);
    return {
      bytes: Buffer.from(result.body, "base64"),
      type: result.type,
      finalUrl: value,
    };
  }
  if (!/^https?:$/.test(url.protocol))
    throw new Error("Unsupported resource protocol");
  const response = await page.request.get(value, {
    timeout: 15_000,
    maxRedirects: 5,
  });
  try {
    if (!response.ok()) throw new Error(`HTTP ${response.status()}`);
    if (Number(response.headers()["content-length"] || 0) > 20 * 1024 * 1024)
      throw new Error("Asset exceeds 20 MiB limit");
    const bytes = await response.body();
    if (bytes.length > 20 * 1024 * 1024)
      throw new Error("Asset exceeds 20 MiB limit");
    return {
      bytes,
      type: (response.headers()["content-type"] || "").split(";")[0] || "",
      finalUrl: response.url(),
    };
  } finally {
    await response.dispose();
  }
}
const passiveMime = (type: string) =>
  /^(?:image|video|audio|font)\//.test(type) ||
  /(?:woff|font|octet-stream)/i.test(type);

async function downloadAssets(
  page: Page,
  resources: Resource[],
  outDir: string,
  gaps: string[]
): Promise<Asset[]> {
  const assets: Asset[] = [];
  const unique = [...new Map(resources.map((r) => [r.url, r])).values()];
  if (unique.length > 200)
    gaps.push("Asset downloads limited to 200 unique URLs");
  for (const resource of unique.slice(0, 200)) {
    try {
      const { bytes, type, finalUrl } = await readResource(page, resource.url);
      if (!passiveMime(type))
        throw new Error(`Unsupported passive asset MIME: ${type}`);
      if (
        type.includes("svg") ||
        /<svg[\s>]/i.test(bytes.subarray(0, 512).toString())
      ) {
        const result = await captureSvg(
          page,
          finalUrl,
          outDir,
          bytes.toString("utf8")
        );
        gaps.push(...result.gaps);
        assets.push({
          ...resource,
          url: resource.url,
          finalUrl,
          file: result.file,
          sha256: result.sha256,
          bytes: result.bytes,
          originalSha256: hash(bytes),
        });
        continue;
      }
      const magic = bytes.subarray(0, 4).toString("ascii");
      const extensions: Record<string, string> = {
        wOF2: "woff2",
        wOFF: "woff",
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
        "image/gif": "gif",
        "video/mp4": "mp4",
        "video/webm": "webm",
        "audio/mpeg": "mp3",
      };
      const ext = extensions[magic] || extensions[type] || "bin";
      if (/^\s*</.test(bytes.subarray(0, 256).toString()))
        throw new Error("Markup payload rejected");
      const digest = hash(bytes);
      const file = `assets/${digest}.${ext}`;
      await writeFile(join(outDir, file), bytes);
      assets.push({
        ...resource,
        url: resource.url,
        finalUrl,
        file,
        sha256: digest,
        bytes: bytes.length,
      });
    } catch (error) {
      assets.push({
        ...resource,
        url: resource.url,
        failure: (error instanceof Error
          ? error.message
          : String(error)
        ).replaceAll(resource.url, safeUrl(resource.url)),
      });
    }
  }
  for (const asset of assets)
    asset.references = resources.filter((r) => r.url === asset.url);
  return assets;
}

async function collectFonts(
  page: Page,
  selector: string,
  families: string[],
  faces: Face[],
  platform: unknown[],
  resources: Resource[],
  gaps: string[]
) {
  const cdp = await page
    .context()
    .newCDPSession(page)
    .catch(() => null);
  if (cdp) {
    const sheets = new Map<string, string>();
    cdp.on("CSS.styleSheetAdded", ({ header }) =>
      sheets.set(header.styleSheetId, header.sourceURL || page.url())
    );
    try {
      await cdp.send("DOM.enable");
      await cdp.send("CSS.enable");
      const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
      const { nodeId } = await cdp.send("DOM.querySelector", {
        nodeId: root.nodeId,
        selector,
      });
      if (nodeId) {
        const descendants = await cdp.send("DOM.querySelectorAll", {
          nodeId,
          selector: "*",
        });
        const nodes = [nodeId, ...descendants.nodeIds];
        if (nodes.length > 200)
          gaps.push(
            "Platform-font evidence limited to first 200 selected subtree nodes"
          );
        for (const [subtreeIndex, id] of nodes.slice(0, 200).entries()) {
          try {
            const result = await cdp.send("CSS.getPlatformFontsForNode", {
              nodeId: id,
            });
            if (result.fonts.length)
              platform.push({ nodeId: id, subtreeIndex, fonts: result.fonts });
          } catch {
            gaps.push(`Platform font unavailable for node ${id}`);
          }
        }
      }
      for (const [styleSheetId, sourceURL] of sheets) {
        try {
          const { text } = await cdp.send("CSS.getStyleSheetText", {
            styleSheetId,
          });
          for (const match of text.matchAll(/@font-face\s*\{([^}]+)\}/gi)) {
            const descriptors = await page.evaluate((css) => {
              const sheet = new CSSStyleSheet();
              sheet.replaceSync(css);
              const rule = sheet.cssRules[0];
              if (!(rule instanceof CSSFontFaceRule))
                return {} as Record<string, string>;
              return Object.fromEntries(
                [...rule.style].map((name) => [
                  name,
                  rule.style.getPropertyValue(name).trim(),
                ])
              );
            }, match[0]);
            if (
              !families.includes(
                (descriptors["font-family"] || "").replaceAll(
                  /^['"]|['"]$/g,
                  ""
                )
              )
            )
              continue;

            resources.push(
              ...urls(descriptors.src || "", sourceURL).map((url) => ({
                url,
                kind: "font",
              }))
            );
            faces.push({
              sourceURL,
              cssText: match[0],
              descriptors,
            });
          }
        } catch {
          gaps.push(`Stylesheet unavailable: ${safeUrl(sourceURL)}`);
        }
      }
    } catch (error) {
      gaps.push(
        `CDP font evidence unavailable: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      await cdp.detach();
    }
  } else
    gaps.push(
      "Chromium CDP unavailable; actual platform fonts and cross-origin font rules not verified"
    );
}

/** Writes passive assets only. Authenticated downloads use the existing request context; credentials are never serialized. */
export async function captureAssets(
  page: Page,
  selector: string,
  outDir: string,
  sourceCss?: {
    css: string;
    rules?: { sourceURL?: string; cssText?: string }[];
  }
): Promise<{
  assets: Asset[];
  fonts: { faces: Face[]; platform: unknown[] };
  gaps: string[];
}> {
  const assets: Asset[] = [];
  const faces: Face[] = [];
  const platform: unknown[] = [];
  const gaps: string[] = [];
  const resources: Resource[] = [];
  const assetDir = join(outDir, "assets");
  await mkdir(assetDir, { recursive: true });
  const observed = await page
    .locator(selector)
    .first()
    .evaluate((root) => {
      const foundResources: {
        url: string;
        kind: string;
        subtreeIndex?: number;
        imageIndex?: number;
        svgIndex?: number;
      }[] = [];
      const svgs: { rawSvg: string; subtreeIndex: number }[] = [];
      const families = new Set<string>();
      const svgGaps: string[] = [];
      // Browser evaluation is serialized; this helper must remain in its scope.
      // oxlint-disable-next-line unicorn/consistent-function-scoping
      const hydrate = (original: Element, cloned: Element) => {
        const sourceNodes = [original, ...original.querySelectorAll("*")];
        const targetNodes = [cloned, ...cloned.querySelectorAll("*")];
        for (const [i, node] of sourceNodes.entries()) {
          const target = targetNodes[i];
          if (!target) continue;
          const style = getComputedStyle(node);
          for (const key of [
            "fill",
            "stroke",
            "stroke-width",
            "stroke-linecap",
            "stroke-linejoin",
            "stroke-dasharray",
            "stroke-dashoffset",
            "stroke-miterlimit",
            "clip-path",
            "mask",
            "filter",
            "marker-start",
            "marker-mid",
            "marker-end",
            "fill-rule",
            "clip-rule",
            "opacity",
            "fill-opacity",
            "stroke-opacity",
            "color",
          ]) {
            if (!target.hasAttribute(key))
              target.setAttribute(key, style.getPropertyValue(key));
          }
          for (const key of new Set(
            [...target.outerHTML.matchAll(/var\(\s*(--[\w-]+)/g)].map(
              (match) => match[1] || ""
            )
          )) {
            (target as SVGElement).style?.setProperty(
              key,
              style.getPropertyValue(key)
            );
          }
        }
      };
      const exportSvg = (el: SVGSVGElement) => {
        const copy = el.cloneNode(true) as SVGSVGElement;
        copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        const defs = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "defs"
        );
        const copied = new Set<string>();
        hydrate(el, copy);
        const scan = (node: Element) => {
          for (const child of [node, ...node.querySelectorAll("*")]) {
            for (const attr of child.attributes) {
              const ids = [
                ...attr.value.matchAll(/url\(["']?#([^"')]+)["']?\)/g),
              ].map((m) => m[1] || "");
              if (attr.localName === "href" && attr.value.startsWith("#"))
                ids.push(attr.value.slice(1));
              for (const id of ids) {
                if (
                  copied.has(id) ||
                  [...copy.querySelectorAll("[id]")].some((x) => x.id === id)
                )
                  continue;
                copied.add(id);
                const referenced = document.querySelector(`#${CSS.escape(id)}`);
                if (!referenced || !referenced.closest("svg")) {
                  svgGaps.push(`Unresolved SVG reference #${id}`);
                  continue;
                }
                const cloned = referenced.cloneNode(true) as Element;
                hydrate(referenced, cloned);
                defs.append(cloned);
                scan(cloned);
              }
            }
          }
        };
        scan(copy);
        if (defs.childNodes.length) copy.prepend(defs);
        const rawSvg = new XMLSerializer().serializeToString(copy);
        return { rawSvg };
      };
      for (const [subtreeIndex, el] of [
        root,
        ...root.querySelectorAll("*"),
      ].entries()) {
        if (el instanceof HTMLImageElement && el.currentSrc)
          foundResources.push({
            url: el.currentSrc,
            kind: "image-source",
            subtreeIndex,
            imageIndex: [root, ...root.querySelectorAll("img")]
              .filter((x) => x instanceof HTMLImageElement)
              .indexOf(el),
          });
        if (el instanceof HTMLVideoElement && el.poster)
          foundResources.push({ url: el.poster, kind: "image", subtreeIndex });
        if (el instanceof HTMLMediaElement && el.currentSrc)
          foundResources.push({
            url: el.currentSrc,
            kind: "media",
            subtreeIndex,
          });
        for (const pseudo of [null, "::before", "::after"]) {
          const style = getComputedStyle(el, pseudo);
          for (const family of style.fontFamily.split(","))
            families.add(family.trim().replaceAll(/^['"]|['"]$/g, ""));
          for (const key of [
            "background-image",
            "mask-image",
            "border-image-source",
            "list-style-image",
            "content",
          ]) {
            for (const match of style
              .getPropertyValue(key)
              .matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
              try {
                foundResources.push({
                  url: new URL(match[1] || "", document.baseURI).href,
                  kind: "image",
                  subtreeIndex,
                });
              } catch {
                /* invalid CSS URL */
              }
            }
          }
        }
        if (!(el instanceof SVGSVGElement) || el.parentElement?.closest("svg"))
          continue;
        svgs.push({ ...exportSvg(el), subtreeIndex });
      }
      return {
        resources: foundResources,
        svgs,
        gaps: svgGaps,
        families: [...families],
      };
    });
  resources.push(...observed.resources);
  gaps.push(...observed.gaps);
  for (const [svgIndex, { rawSvg, subtreeIndex }] of observed.svgs.entries()) {
    try {
      const result = await captureSvg(page, page.url(), outDir, rawSvg);
      gaps.push(...result.gaps);
      assets.push({
        url: safeUrl(page.url()),
        kind: "inline-svg",
        subtreeIndex,
        svgIndex,
        file: result.file,
        sha256: result.sha256,
        bytes: result.bytes,
      });
    } catch {
      assets.push({
        url: safeUrl(page.url()),
        kind: "inline-svg",
        subtreeIndex,
        svgIndex,
        failure: "SVG passive closure failed",
      });
    }
  }
  await collectFonts(
    page,
    selector,
    observed.families,
    faces,
    platform,
    resources,
    gaps
  );
  for (const rule of sourceCss?.rules || [])
    resources.push(
      ...urls(rule.cssText || "", rule.sourceURL || page.url()).map((url) => ({
        url,
        kind: "css-resource",
      }))
    );
  if (!sourceCss?.rules)
    resources.push(
      ...urls(sourceCss?.css || "", page.url()).map((url) => ({
        url,
        kind: "css-resource",
      }))
    );
  assets.push(...(await downloadAssets(page, resources, outDir, gaps)));
  gaps.push(
    "Font-face inventory filtered by subtree computed families; platform evidence is subtree-scoped. Downloaded font presence does not prove glyph equivalence. External SVG dependency closures are bounded; unsupported SVG elements are removed with explicit gaps. Local fonts remain platform dependencies."
  );
  return { assets, fonts: { faces, platform }, gaps };
}
