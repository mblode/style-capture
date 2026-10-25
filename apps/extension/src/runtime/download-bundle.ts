import type { CaptureResult } from "@/lib/types.ts";

/** Injected into the source tab: no runtime imports or extension permissions. */
export const downloadBundle = async (
  capture: CaptureResult,
  viewportScreenshot: string | null,
  screenshotGap: string | null
): Promise<void> => {
  const gaps = [
    "Actual glyph fonts require CDP and are unverified in this extension capture.",
    "Only the currently visible state and viewport are captured; no interaction replay or pixel comparison has been run.",
    "Cross-origin assets and stylesheets require CORS. Blocked resources are listed, not substituted.",
    "Inline SVG snapshots retain sanitized geometry; external sprite references and ancestor definitions may be missing.",
    "Replay is static computed CSS; ancestor layout, shadow DOM and responsive behavior may differ.",
  ];
  if (screenshotGap) gaps.push(screenshotGap);
  const assets: {
    url: string;
    kind: string;
    dataUrl?: string;
    sha256?: string;
    bytes?: number;
    failure?: string;
  }[] = [];
  const resources = new Map<string, string>();
  const faces: string[] = [];
  const rootSnapshot = capture.elements[capture.rootElementId];
  const rootPath = capture.metadata.rootDomPath;
  if (!rootPath)
    throw new Error(
      "Capture has no stable root identity; recapture before downloading."
    );
  let rootNode: Node | undefined = document;
  for (const step of rootPath) rootNode = rootNode?.childNodes[step];
  if (
    !(rootNode instanceof Element) ||
    rootNode.tagName.toLowerCase() !== rootSnapshot.tagName.toLowerCase()
  )
    throw new Error(
      "Selected element is no longer present; recapture before downloading."
    );
  const root = rootNode;
  const originals = [root, ...root.querySelectorAll("*")];
  const addUrls = (css: string, base: string, kind: string) => {
    for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/giu)) {
      try {
        resources.set(new URL(match[1].trim(), base).href, kind);
      } catch {
        gaps.push(`Invalid ${kind} URL in captured CSS.`);
      }
    }
  };
  for (const node of originals) {
    if (node instanceof HTMLImageElement && node.currentSrc)
      resources.set(node.currentSrc, "image");
    const style = getComputedStyle(node);
    for (const property of [
      "background-image",
      "mask-image",
      "list-style-image",
    ])
      addUrls(style.getPropertyValue(property), document.baseURI, "image");
  }
  const families = originals
    .map((node) => getComputedStyle(node).fontFamily.toLowerCase())
    .join(",");
  const inspectRules = (rules: CSSRuleList, base: string) => {
    for (const rule of rules) {
      if (rule instanceof CSSFontFaceRule) {
        const family = rule.style
          .getPropertyValue("font-family")
          .replaceAll(/["']/gu, "")
          .trim()
          .toLowerCase();
        if (family && families.includes(family)) {
          faces.push(
            rule.cssText.replaceAll(
              /url\(\s*["']?([^"')]+)["']?\s*\)/giu,
              (_, url: string) => `url("${new URL(url.trim(), base).href}")`
            )
          );
          addUrls(rule.cssText, base, "font");
        }
      } else if ("cssRules" in rule)
        inspectRules((rule as CSSGroupingRule).cssRules, base);
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      inspectRules(sheet.cssRules, sheet.href ?? document.baseURI);
    } catch {
      gaps.push(`Stylesheet rules unavailable: ${sheet.href ?? "inline"}`);
    }
  }
  if (resources.size > 50)
    gaps.push(
      "Asset budget reached: only the first 50 resources were attempted."
    );
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- injected function must be self-contained
  const validateSvg = (svgText: string): void => {
    const svg = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const active = new Set([
      "script",
      "foreignObject",
      "iframe",
      "object",
      "embed",
      "animate",
      "animateMotion",
      "animateTransform",
      "set",
    ]);
    if (
      /<!DOCTYPE|<\?xml-stylesheet/iu.test(svgText) ||
      svg.querySelector("parsererror")
    )
      throw new Error("Unsupported SVG document.");
    for (const element of svg.querySelectorAll("*")) {
      if (active.has(element.localName))
        throw new Error("SVG has active content.");
      for (const attribute of element.attributes) {
        if (attribute.localName.toLowerCase().startsWith("on"))
          throw new Error("SVG has event handlers.");
        if (
          ["href", "src"].includes(attribute.localName) &&
          !attribute.value.startsWith("#")
        )
          throw new Error("SVG has external dependencies.");
        for (const match of attribute.value.matchAll(
          /url\(\s*["']?([^"')]+)["']?\s*\)/giu
        ))
          if (!match[1].startsWith("#"))
            throw new Error("SVG has external paint dependencies.");
      }
      if (
        element.localName === "style" &&
        /@import|url\(/iu.test(element.textContent ?? "")
      )
        throw new Error(
          "SVG stylesheet dependencies need separate extraction."
        );
    }
  };
  const downloadAssets = async () => {
    for (const [url, kind] of [...resources].slice(0, 50)) {
      try {
        if (!/^https?:/iu.test(url))
          throw new Error(
            "Only HTTP(S) passive asset downloads are supported."
          );
        const response = await fetch(url, {
          credentials: "omit",
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        if (blob.size > 5_000_000)
          throw new Error("Asset exceeds 5 MB export limit.");
        if (
          !(
            blob.type.startsWith("image/") ||
            blob.type.includes("font") ||
            /\.(?:woff2?|ttf|otf)(?:\?|$)/iu.test(url)
          )
        )
          throw new Error("Unsupported passive asset type.");
        if (blob.type.includes("svg")) validateSvg(await blob.text());
        const bytes = await blob.arrayBuffer();
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        const sha256 = [...new Uint8Array(digest)]
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("");
        // oxlint-disable-next-line promise/avoid-new -- FileReader exposes event callbacks only
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.addEventListener(
            "load",
            () => resolve(String(reader.result)),
            { once: true }
          );
          reader.addEventListener(
            "error",
            () => reject(new Error("Could not encode asset.")),
            { once: true }
          );
          reader.readAsDataURL(blob);
        });
        assets.push({ url, kind, dataUrl, sha256, bytes: blob.size });
      } catch (error) {
        assets.push({
          url,
          kind,
          failure: error instanceof Error ? error.message : String(error),
        });
      }
    }
  };
  await downloadAssets();
  const urls = new Map(
    assets
      .filter((asset) => asset.dataUrl)
      .map((asset) => [asset.url, asset.dataUrl ?? ""])
  );
  const rewrite = (value: string) =>
    value.replaceAll(
      /url\(\s*["']?([^"')]+)["']?\s*\)/giu,
      (_, url: string) => {
        if (url.startsWith("#")) return `url("${url}")`;
        return urls.has(url) ? `url("${urls.get(url)}")` : "none";
      }
    );
  const replay =
    document.implementation.createHTMLDocument("Captured component");
  const template = replay.createElement("template");
  template.innerHTML = capture.rootOuterHtml;
  const clonedRoot = template.content.firstElementChild;
  if (!clonedRoot) throw new Error("Captured HTML is empty.");
  replay.body.append(clonedRoot);
  const css: string[] = faces.map(rewrite);
  const applyStyles = () => {
    for (const id of capture.order) {
      const snapshot = capture.elements[id];
      if (!snapshot.domPath) continue;
      let clone: Node | undefined = clonedRoot;
      for (const step of snapshot.domPath) clone = clone?.childNodes[step];
      if (!(clone instanceof Element)) continue;
      // oxlint-disable-next-line unicorn/prefer-dom-node-dataset -- generic SVG/HTML Element
      clone.setAttribute("data-style-capture", id);
      clone.removeAttribute("style");
      const styles = replay.createElement("span").style;
      for (const [property, value] of Object.entries(snapshot.styles))
        styles.setProperty(property, rewrite(value));
      css.push(`[data-style-capture="${id}"]{${styles.cssText}}`);
      for (const pseudo of Object.values(snapshot.pseudo)) {
        if (!pseudo) continue;
        const pseudoStyle = replay.createElement("span").style;
        for (const [property, value] of Object.entries(pseudo.styles))
          pseudoStyle.setProperty(property, rewrite(value));
        css.push(
          `[data-style-capture="${id}"]::${pseudo.kind}{${pseudoStyle.cssText}}`
        );
      }
      const live =
        snapshot.subtreeIndex === undefined
          ? undefined
          : originals[snapshot.subtreeIndex];
      if (live instanceof HTMLImageElement && urls.has(live.currentSrc))
        clone.setAttribute("src", urls.get(live.currentSrc) ?? "");
    }
  };
  applyStyles();
  css.push(
    `[data-style-capture="${capture.rootElementId}"]{box-sizing:border-box;width:${rootSnapshot.boundingBox.width}px;height:${rootSnapshot.boundingBox.height}px;}`
  );
  const style = replay.createElement("style");
  style.textContent = css.join("\n");
  replay.head.append(style);
  const policy = replay.createElement("meta");
  policy.httpEquiv = "Content-Security-Policy";
  policy.content =
    "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:;";
  replay.head.prepend(policy);
  const cropScreenshot = async (): Promise<string | undefined> => {
    if (
      originals.some(
        (node) =>
          (node instanceof HTMLInputElement &&
            ![
              "button",
              "submit",
              "reset",
              "checkbox",
              "radio",
              "hidden",
            ].includes(node.type) &&
            node.value !== "") ||
          (node instanceof HTMLTextAreaElement && node.value !== "") ||
          (node instanceof HTMLSelectElement &&
            [...node.selectedOptions].some((option) => option.value !== "")) ||
          (node instanceof HTMLElement &&
            node.isContentEditable &&
            !!node.textContent?.trim())
      )
    ) {
      gaps.push(
        "Screenshot omitted: selected subtree contains populated form or editable controls; their visible values are not exported as pixels."
      );
      return undefined;
    }
    let screenshot: string | undefined;
    if (viewportScreenshot) {
      try {
        const image = new Image();
        image.src = viewportScreenshot;
        await image.decode();
        const bounds = rootSnapshot.boundingBox;
        if (
          bounds.left < 0 ||
          bounds.top < 0 ||
          bounds.right > innerWidth ||
          bounds.bottom > innerHeight
        )
          throw new Error(
            "Element extends outside the visible viewport; no clipped crop exported."
          );
        const scaleX = image.width / innerWidth;
        const scaleY = image.height / innerHeight;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bounds.width * scaleX);
        canvas.height = Math.round(bounds.height * scaleY);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable.");
        context.drawImage(
          image,
          bounds.left * scaleX,
          bounds.top * scaleY,
          canvas.width,
          canvas.height,
          0,
          0,
          canvas.width,
          canvas.height
        );
        screenshot = canvas.toDataURL("image/png");
      } catch (error) {
        gaps.push(
          `Screenshot unavailable: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    return screenshot;
  };
  const screenshot = await cropScreenshot();
  const bundle = {
    version: 1,
    status: "captured-not-verified",
    capture,
    metadata: {
      capturedAt: new Date().toISOString(),
      viewport: { width: innerWidth, height: innerHeight },
      dpr: devicePixelRatio,
      userAgent: navigator.userAgent,
      surface: "unspecified",
    },
    html: `<!doctype html>\n${replay.documentElement.outerHTML}`,
    css: css.join("\n"),
    assets,
    fonts: { faces, actualGlyphEvidence: "unavailable" },
    inlineSvgs: [...replay.querySelectorAll("svg")].map((svg) => ({
      kind: "sanitized-inline-svg",
      svg: svg.outerHTML,
    })),
    screenshot,
    gaps,
  };
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          bundle,
          (_key, value: unknown) =>
            typeof value === "string"
              ? value
                  .replaceAll(/(https?:\/\/)[^\s/?#"'<>]+@/giu, "$1")
                  .replaceAll(
                    /([?#&](?:amp;)?)([^?#&\s="'<>]+)=([^&#\s"')<>]*)/gu,
                    (match, separator: string, key: string) => {
                      let decoded = key;
                      try {
                        decoded = decodeURIComponent(key);
                      } catch {
                        // Invalid encoding does not hide literal secret keys.
                      }
                      return /token|secret|signature|credential|auth|key|^(?:sig|jwt|password)$/iu.test(
                        decoded
                      )
                        ? `${separator}${key}=REDACTED`
                        : match;
                    }
                  )
              : value,
          2
        ),
      ],
      { type: "application/json" }
    )
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `style-capture-${Date.now()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};
