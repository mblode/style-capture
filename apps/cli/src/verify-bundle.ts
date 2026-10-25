import { createHash } from "node:crypto";
import { readFile, realpath, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

import type { CaptureResult, PixelClip } from "@style-capture/core";
import { chromium } from "playwright";
import type { Page } from "playwright";

import { pixelScreenshot } from "./pixel-screenshot.ts";

interface FontRow {
  fonts: {
    postScriptName: string;
    familyName: string;
    isCustomFont: boolean;
    glyphCount: number;
  }[];
}
interface AssetEvidence {
  fonts?: { platform?: FontRow[] };
  gaps?: string[];
  assets?: { failure?: string }[];
}
interface Visual {
  pixelClip?: PixelClip;
  screenshot?: string;
  replay?: string;
  gaps?: string[];
}

const hasPixelEvidence = (
  visual: Visual
): visual is Visual &
  Required<Pick<Visual, "replay" | "screenshot" | "pixelClip">> =>
  Boolean(visual.replay && visual.screenshot && visual.pixelClip);

const forceReplayState = async (
  page: Page,
  state: string,
  recipe: Manifest["recipe"]
) => {
  if (!["hover", "focus", "focus-visible", "active"].includes(state)) return;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
    nodeId: root.nodeId,
    selector:
      recipe?.stateScope === "subtree"
        ? "[data-style-capture]"
        : '[data-style-capture="node-0"]',
  });
  for (const nodeId of nodeIds)
    await cdp.send("CSS.forcePseudoState", {
      nodeId,
      forcedPseudoClasses: [state],
    });
  // Keep the state session attached until page.close(), so forced state survives capture.
};

const within = (directory: string, relative: string): string => {
  const file = path.resolve(directory, relative);
  if (!file.startsWith(`${directory}${path.sep}`))
    throw new Error("Bundle path escapes its directory.");
  return file;
};
const existingWithin = async (directory: string, relative: string) => {
  const root = await realpath(directory);
  const file = await realpath(within(root, relative));
  if (!file.startsWith(`${root}${path.sep}`))
    throw new Error("Bundle symlink escapes its directory.");
  return file;
};
const digest = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
const fontNames = (rows: FontRow[]) =>
  [
    ...new Set(
      rows.flatMap((row) =>
        row.fonts
          .filter((font) => font.glyphCount > 0)
          .map(
            (font) =>
              `${font.postScriptName}:${font.isCustomFont ? "custom" : "platform"}`
          )
      )
    ),
  ].toSorted();

const renderedFonts = async (page: Page): Promise<FontRow[]> => {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
      nodeId: root.nodeId,
      selector: "[data-style-capture]",
    });
    const rows: FontRow[] = [];
    for (const nodeId of nodeIds.slice(0, 200))
      rows.push(await cdp.send("CSS.getPlatformFontsForNode", { nodeId }));
    return rows;
  } finally {
    await cdp.detach();
  }
};

const comparePixels = (page: Page, source: Buffer, replay: Buffer) =>
  page.evaluate(
    async ({ left, right }) => {
      const images = await Promise.all(
        [left, right].map(async (data) => {
          const image = new Image();
          image.src = data;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas is unavailable.");
          context.drawImage(image, 0, 0);
          return {
            width: image.width,
            height: image.height,
            pixels: context.getImageData(0, 0, image.width, image.height).data,
          };
        })
      );
      const [a, b] = images;
      const width = Math.max(a.width, b.width);
      const height = Math.max(a.height, b.height);
      let mismatchedPixels = 0;
      let maxChannelDifference = 0;
      for (let y = 0; y < height; y += 1)
        for (let x = 0; x < width; x += 1) {
          if (x >= a.width || y >= a.height || x >= b.width || y >= b.height) {
            mismatchedPixels += 1;
            maxChannelDifference = 255;
            continue;
          }
          let different = false;
          for (let channel = 0; channel < 4; channel += 1) {
            const difference = Math.abs(
              a.pixels[(y * a.width + x) * 4 + channel] -
                b.pixels[(y * b.width + x) * 4 + channel]
            );
            maxChannelDifference = Math.max(maxChannelDifference, difference);
            if (difference !== 0) different = true;
          }
          if (different) mismatchedPixels += 1;
        }
      return {
        sourceSize: [a.width, a.height],
        replaySize: [b.width, b.height],
        pixelsCompared: width * height,
        mismatchedPixels,
        mismatchRatio: mismatchedPixels / (width * height),
        maxChannelDifference,
        tolerance: 0,
      };
    },
    {
      left: `data:image/png;base64,${source.toString("base64")}`,
      right: `data:image/png;base64,${replay.toString("base64")}`,
    }
  );

interface SnapshotCase {
  name: string;
  visual: Visual;
  assets: AssetEvidence | undefined;
}
interface Manifest {
  recipe?: { stateScope?: "element" | "subtree" };
  visual?: Visual;
  assetsEvidence?: AssetEvidence;
  gaps?: string[];
}
const readCases = async (
  directory: string,
  capture: CaptureResult,
  manifest: Manifest
): Promise<SnapshotCase[]> => {
  const cases: SnapshotCase[] = [
    {
      name: "rest",
      visual: manifest.visual ?? {},
      assets: manifest.assetsEvidence,
    },
  ];
  for (const [name, state] of Object.entries(capture.states ?? {})) {
    if (!state.applicable || !state.evidence) continue;
    const assets = JSON.parse(
      await readFile(
        await existingWithin(directory, `${name}/assets.json`),
        "utf8"
      )
    ) as AssetEvidence;
    cases.push({ name, visual: state.evidence, assets });
  }
  return cases;
};

const measureDiagnostics = async (
  page: Page,
  capture: CaptureResult,
  state: string,
  pixelClip: PixelClip
) => {
  const stateCapture =
    capture.states?.[state as keyof NonNullable<CaptureResult["states"]>];
  const elements = stateCapture?.applicable
    ? stateCapture.snapshot?.elements
    : capture.elements;
  return await page.evaluate(
    ({ expected, clip, replayOrigin }) => {
      const properties = [
        "font-family",
        "font-size",
        "line-height",
        "vertical-align",
        "fill",
        "stroke",
        "outline-style",
      ];
      return [
        ...document.querySelectorAll<HTMLElement | SVGElement>(
          "[data-style-capture]"
        ),
      ]
        .slice(0, 16)
        .map((node) => {
          const id = node.dataset.styleCapture ?? "";
          const original = expected?.[id];
          const bounds = node.getBoundingClientRect();
          const computed = getComputedStyle(node);
          return {
            id,
            tag: node.tagName.toLowerCase(),
            sourceBox: original
              ? [
                  original.boundingBox.x - clip.x,
                  original.boundingBox.y - clip.y,
                  original.boundingBox.width,
                  original.boundingBox.height,
                ]
              : null,
            replayBox: [
              bounds.x - (replayOrigin?.x ?? 0),
              bounds.y - (replayOrigin?.y ?? 0),
              bounds.width,
              bounds.height,
            ],
            styleDifferences: Object.fromEntries(
              properties
                .filter(
                  (property) =>
                    original?.styles[property] !==
                    computed.getPropertyValue(property)
                )
                .map((property) => [
                  property,
                  {
                    source: original?.styles[property],
                    replay: computed.getPropertyValue(property),
                  },
                ])
            ),
          };
        });
    },
    {
      expected: elements,
      clip: pixelClip.source,
      replayOrigin: pixelClip.replayOrigin,
    }
  );
};

/** Compare saved snapshots only; never turn one component into a library-wide verdict. */
export const verifyBundle = async (input: string): Promise<string> => {
  const directory = await realpath(path.resolve(input));
  const capture = JSON.parse(
    await readFile(await existingWithin(directory, "capture.json"), "utf8")
  ) as CaptureResult;
  const manifest = JSON.parse(
    await readFile(await existingWithin(directory, "manifest.json"), "utf8")
  ) as Manifest;
  const types: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
  };
  const server = createServer((request, response) => {
    void (async () => {
      try {
        const filename = await existingWithin(
          directory,
          decodeURIComponent(
            new URL(request.url ?? "/", "http://127.0.0.1").pathname
          ).slice(1)
        );
        response.setHeader(
          "Content-Type",
          types[path.extname(filename)] ?? "application/octet-stream"
        );
        response.end(await readFile(filename));
      } catch {
        response.statusCode = 404;
        response.end();
      }
    })();
  });
  // oxlint-disable-next-line promise/avoid-new -- HTTP server listen is callback based
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Local replay server did not start.");
  const browser = await chromium
    .launch({ headless: true })
    .catch((error: unknown) => {
      server.close();
      throw error;
    });
  const results: unknown[] = [];
  const stamp = Date.now();
  try {
    const cases = await readCases(directory, capture, manifest);
    for (const item of cases) {
      if (!hasPixelEvidence(item.visual)) {
        results.push({
          state: item.name,
          status: "unavailable",
          reason:
            "Source crop, replay or pixel-grid metadata missing; recapture older bundles before exact comparison.",
        });
        continue;
      }
      const page = await browser.newPage({
        viewport: capture.metadata.viewport,
        deviceScaleFactor: capture.metadata.deviceScaleFactor,
        colorScheme: capture.metadata.colorScheme,
      });
      const failures: string[] = [];
      page.on("requestfailed", (request) =>
        failures.push(`${request.url()}: ${request.failure()?.errorText}`)
      );
      page.on("response", (response) => {
        if (response.status() >= 400)
          failures.push(`${response.url()}: HTTP ${response.status()}`);
      });
      await page.goto(
        `http://127.0.0.1:${address.port}/${item.visual.replay}`,
        { waitUntil: "load", timeout: 30_000 }
      );
      await forceReplayState(page, item.name, manifest.recipe);
      await page.evaluate(() => document.fonts.ready.then(() => true));
      const replay = await pixelScreenshot(page, item.visual.pixelClip, true);
      const source = await readFile(
        await existingWithin(directory, item.visual.screenshot)
      );
      const pixels = await comparePixels(page, source, replay);
      const fonts = await renderedFonts(page);
      const diagnostics = await measureDiagnostics(
        page,
        capture,
        item.name,
        item.visual.pixelClip
      );
      const expectedFonts = fontNames(item.assets?.fonts?.platform ?? []);
      const actualFonts = fontNames(fonts);
      const fontsMatch = expectedFonts.length
        ? JSON.stringify(expectedFonts) === JSON.stringify(actualFonts)
        : null;
      const replayFile = `verification-${stamp}-${item.name}.png`;
      await writeFile(within(directory, replayFile), replay, { flag: "wx" });
      results.push({
        state: item.name,
        status:
          pixels.mismatchedPixels === 0 &&
          fontsMatch === true &&
          failures.length === 0
            ? "snapshot-match"
            : "difference-or-gap",
        pixels,
        diagnostics,
        fonts: {
          expected: expectedFonts,
          actual: actualFonts,
          inventoryMatches: fontsMatch,
          scope:
            "PostScript names and custom/platform identity, up to 200 nodes; not per-glyph positioning.",
        },
        failedRequests: failures,
        sourceSha256: digest(source),
        replaySha256: digest(replay),
        replayFile,
        captureGaps: [
          ...(manifest.gaps ?? []),
          ...(item.visual.gaps ?? []),
          ...(item.assets?.gaps ?? []),
        ],
        unavailableAssets:
          item.assets?.assets?.filter((asset) => asset.failure).length ?? 0,
      });
      await page.close();
    }
    const reportFile = within(directory, `verification-${stamp}.json`);
    await writeFile(
      reportFile,
      `${JSON.stringify({ version: 1, scope: "Saved component snapshots only; no library-wide fidelity claim.", verifiedAt: new Date().toISOString(), browserVersion: browser.version(), results }, null, 2)}\n`,
      { flag: "wx" }
    );
    return reportFile;
  } finally {
    await browser.close();
    server.close();
  }
};
