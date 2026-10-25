import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { Page } from "playwright";

const svgError = (error: unknown) =>
  error instanceof Error && /^HTTP \d+$/.test(error.message)
    ? error.message
    : "fetch or parse failed";
const scrubEvidence = (value: string) =>
  value
    .replaceAll(/https?:\/\/[^\s]+/g, (address) => {
      try {
        const url = new URL(address);
        url.username = "";
        url.password = "";
        url.search = "";
        return url.href;
      } catch {
        return "[resource URL]";
      }
    })
    .replaceAll(/data:[^\s]+/g, "[embedded asset]");

/** Resolve observed SVG sprite references only, in inert XML documents. */
export async function captureSvg(
  page: Page,
  url: string,
  outDir: string,
  markup?: string,
  selectFragment = false
): Promise<{ file: string; sha256: string; bytes: number; gaps: string[] }> {
  const documents: Record<string, string> = {};
  const gaps: string[] = [];
  const base = new URL(url);
  base.hash = "";
  if (markup) documents[base.href] = markup;
  const pending = [base.href];
  const visited = new Set<string>();
  while (pending.length && visited.size < 30) {
    const next = pending.shift();
    if (!next || visited.has(next)) continue;
    visited.add(next);
    try {
      const resource = new URL(next);
      if (
        !/^https?:$/.test(resource.protocol) ||
        resource.username ||
        resource.password
      )
        throw new Error("Unsupported SVG URL");
      if (!documents[next]) {
        const response = await page.request.get(next, {
          timeout: 15_000,
          maxRedirects: 5,
        });
        try {
          if (!response.ok()) throw new Error(`HTTP ${response.status()}`);
          if (
            Number(response.headers()["content-length"] || 0) >
            5 * 1024 * 1024
          )
            throw new Error("SVG exceeds 5 MiB limit");
          const body = await response.body();
          if (body.length > 5 * 1024 * 1024)
            throw new Error("SVG exceeds 5 MiB limit");
          documents[next] = body.toString("utf8");
        } finally {
          await response.dispose();
        }
      }
      const dependencies = await page.evaluate(
        ({ text, source }) => {
          const doc = new DOMParser().parseFromString(text, "image/svg+xml");
          if (
            doc.querySelector("parsererror") ||
            doc.documentElement.localName !== "svg"
          )
            throw new Error("Invalid SVG document");
          const refs = new Set<string>();
          for (const el of doc.querySelectorAll("*")) {
            for (const attr of el.attributes) {
              const values = [
                ...attr.value.matchAll(/url\(["']?([^"')]+)["']?\)/g),
              ].map((m) => m[1] || "");
              if (attr.localName === "href" && el.localName === "use")
                values.push(attr.value);
              for (const value of values) {
                if (value.startsWith("#")) continue;
                const target = new URL(value, source);
                if (!target.hash || !/^https?:$/.test(target.protocol))
                  continue;
                target.hash = "";
                refs.add(target.href);
              }
            }
          }
          return [...refs];
        },
        { text: documents[next] || "", source: next }
      );
      pending.push(...dependencies.filter((dep) => !visited.has(dep)));
    } catch (error) {
      gaps.push(`SVG dependency unavailable: ${next}: ${svgError(error)}`);
    }
  }
  if (pending.length)
    gaps.push("SVG dependency closure capped at 30 documents");
  const namespaces = Object.fromEntries(
    Object.keys(documents).map((source) => [
      source,
      createHash("sha256").update(source).digest("hex").slice(0, 12),
    ])
  );
  const serialized = await page.evaluate(
    ({ sources, namespaces: prefixes, sourceURL, fragment }) => {
      const warnings: string[] = [];
      const parsed = new Map(
        Object.entries(sources).map(([key, text]) => [
          key,
          new DOMParser().parseFromString(text, "image/svg+xml"),
        ])
      );
      const source = parsed.get(sourceURL);
      if (
        !source ||
        source.querySelector("parsererror") ||
        source.documentElement.localName !== "svg"
      )
        throw new Error("Missing valid root SVG");
      const output = source.documentElement.cloneNode(true) as SVGElement;
      if (fragment) {
        const selected = source.querySelector(`#${CSS.escape(fragment)}`);
        if (!selected) throw new Error("SVG fragment not found");
        output.replaceChildren(selected.cloneNode(true));
        if (selected.hasAttribute("viewBox"))
          output.setAttribute(
            "viewBox",
            selected.getAttribute("viewBox") || ""
          );
        if (selected.localName === "symbol") {
          const wrapper = output.firstElementChild;
          if (wrapper) {
            const group = source.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
            );
            for (const attr of wrapper.attributes)
              if (attr.name !== "viewBox")
                group.setAttribute(attr.name, attr.value);
            group.append(...wrapper.childNodes);
            wrapper.replaceWith(group);
          }
        }
      }
      output.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const defs = source.createElementNS("http://www.w3.org/2000/svg", "defs");
      const imported = new Set(
        [output, ...output.querySelectorAll("[id]")]
          .filter((n) => n.id)
          .map((n) => `${sourceURL}#${n.id}`)
      );
      const allowed = new Set([
        "svg",
        "g",
        "defs",
        "path",
        "rect",
        "circle",
        "ellipse",
        "line",
        "polyline",
        "polygon",
        "use",
        "symbol",
        "clipPath",
        "mask",
        "linearGradient",
        "radialGradient",
        "stop",
        "pattern",
        "filter",
        "feGaussianBlur",
        "feOffset",
        "feBlend",
        "feColorMatrix",
        "feComposite",
        "feFlood",
        "feMerge",
        "feMergeNode",
      ]);
      const rewrite = (tree: Element, origin: string) => {
        const reference = (value: string): string | null => {
          let target: URL;
          try {
            target = new URL(value, origin);
          } catch {
            return null;
          }
          const id = decodeURIComponent(target.hash.slice(1));
          target.hash = "";
          const key = `${target.href}#${id}`;
          const doc = parsed.get(target.href);
          const original = doc?.querySelector(`#${CSS.escape(id)}`);
          if (!id || !original || !prefixes[target.href]) {
            warnings.push(`Unresolved SVG paint/use dependency: ${key}`);
            return null;
          }
          const mapped = `${prefixes[target.href]}-${id}`;
          if (!imported.has(key)) {
            imported.add(key);
            const clone = original.cloneNode(true) as Element;
            defs.append(clone);
            rewrite(clone, target.href);
          }
          return `#${mapped}`;
        };
        for (const node of [tree, ...tree.querySelectorAll("*")]) {
          if (!allowed.has(node.localName)) {
            node.remove();
            warnings.push(`Unsupported SVG element removed: ${node.localName}`);
            continue;
          }
          for (const name of node.getAttributeNames()) {
            const attr = node.getAttributeNode(name);
            if (!attr) continue;
            if (
              !/^(?:xmlns(?::xlink)?|id|style|viewBox|preserveAspectRatio|d|points|x|y|x1|x2|y1|y2|cx|cy|r|rx|ry|width|height|transform|fill(?:-rule|-opacity)?|stroke(?:-[\w-]+)?|opacity|color|display|visibility|clip-path|clip-rule|mask|filter|marker-(?:start|mid|end)|href|xlink:href|offset|stop-color|stop-opacity|gradientUnits|gradientTransform|spreadMethod|patternUnits|patternContentUnits|patternTransform|clipPathUnits|maskUnits|maskContentUnits|filterUnits|primitiveUnits|in|in2|result|type|values|mode|operator|k1|k2|k3|k4|stdDeviation|dx|dy|flood-color|flood-opacity|vector-effect|shape-rendering)$/.test(
                name
              )
            ) {
              node.removeAttribute(name);
              continue;
            }
            if (/^on/i.test(name) || name === "class") {
              node.removeAttribute(name);
              continue;
            }
            if (name === "id") {
              node.setAttribute(name, `${prefixes[origin]}-${attr.value}`);
              continue;
            }
            if (attr.localName === "href") {
              const mapped =
                node.localName === "use" ? reference(attr.value) : null;
              if (mapped) node.setAttribute(name, mapped);
              else node.removeAttribute(name);
              continue;
            }
            if (name === "style") {
              const styled = node as SVGElement;
              const properties = [...styled.style];
              for (const property of properties) {
                const value = styled.style.getPropertyValue(property);
                if (
                  !/^(?:--[\w-]+|fill(?:-opacity|-rule)?|stroke(?:-[\w-]+)?|opacity|color|transform(?:-origin|-box)?|display|visibility|width|height|clip-path|mask|filter|stop-color|stop-opacity|mix-blend-mode)$/.test(
                    property
                  ) ||
                  /(?:image-set|paint\(|expression|@|\\)/i.test(value)
                ) {
                  styled.style.removeProperty(property);
                  warnings.push("Unsupported SVG style declaration removed");
                }
              }
            }
            const rewritten = attr.value.replaceAll(
              /url\(["']?([^"')]+)["']?\)/g,
              (_match, value: string) => {
                const mapped = reference(value);
                return mapped ? `url(${mapped})` : "none";
              }
            );
            if (
              name !== "xmlns" &&
              /(?:javascript:|https?:|data:|@import|expression\s*\()/i.test(
                rewritten
              )
            ) {
              node.removeAttribute(name);
              continue;
            }
            node.setAttribute(name, rewritten);
          }
        }
      };
      rewrite(output, sourceURL);
      if (defs.childNodes.length) output.prepend(defs);
      return { svg: new XMLSerializer().serializeToString(output), warnings };
    },
    {
      sources: documents,
      namespaces,
      sourceURL: base.href,
      fragment: selectFragment || !markup ? new URL(url).hash.slice(1) : "",
    }
  );
  gaps.push(...serialized.warnings);
  const sha256 = createHash("sha256").update(serialized.svg).digest("hex");
  const file = `assets/${sha256}.svg`;
  await writeFile(join(outDir, file), serialized.svg);
  const safeGaps = gaps.map((gap) => {
    let safe = gap;
    for (const source of Object.keys(documents)) {
      const address = new URL(source);
      address.username = "";
      address.password = "";
      address.search = "";
      safe = safe.replaceAll(source, address.href);
    }
    return safe;
  });
  return {
    file,
    sha256,
    bytes: Buffer.byteLength(serialized.svg),
    gaps: [...new Set(safeGaps.map(scrubEvidence))],
  };
}
