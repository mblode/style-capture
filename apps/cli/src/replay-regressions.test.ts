import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { createDefaultSettings } from "@style-capture/core";
import { chromium } from "playwright";
import { describe, expect, it } from "vitest";

import { captureAssets } from "./capture-assets.ts";
import { captureElement } from "./capture.ts";
import { captureVisualEvidence, writeReplay } from "./export-bundle.ts";
import { pixelScreenshot } from "./pixel-screenshot.ts";

describe("captured replay regressions", () => {
  it("retains local SVG paint and distinct image-source and CSS data assets", async () => {
    const browser = await chromium.launch({ headless: true });
    const directory = await mkdtemp(
      path.join(tmpdir(), "style-capture-assets-")
    );
    try {
      const page = await browser.newPage();
      await page.setContent(
        '<div id="target"><svg><defs><linearGradient id="paint"><stop stop-color="red"/><stop offset="1" stop-color="blue"/></linearGradient></defs><rect width="20" height="20" fill="url(#paint)"/></svg><img width="20" height="20"></div>'
      );
      const [source, background] = await page.evaluate(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 2;
        canvas.height = 2;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        const images = ["red", "blue"].map((color) => {
          context.fillStyle = color;
          context.fillRect(0, 0, 2, 2);
          return canvas.toDataURL();
        });
        const image = document.querySelector("img");
        if (!image) throw new Error("Image unavailable");
        image.src = images[0];
        image.style.backgroundImage = `url("${images[1]}")`;
        return images;
      });
      await page.locator("img").evaluate((image) => {
        if (!(image instanceof HTMLImageElement))
          throw new Error("Image unavailable");
        return image.decode();
      });
      const assets = await captureAssets(page, "#target", directory);
      const sourceFile = assets.assets.find(
        (asset) => asset.url === source
      )?.file;
      const backgroundFile = assets.assets.find(
        (asset) => asset.url === background
      )?.file;
      expect(sourceFile).toBeTruthy();
      expect(backgroundFile).toBeTruthy();
      expect(sourceFile).not.toBe(backgroundFile);
      const capture = await captureElement(page, "#target", {
        ...createDefaultSettings(),
        captureMode: "full",
      });
      await writeReplay(
        page,
        capture,
        directory,
        "assets.html",
        "white",
        assets
      );
      await page.setContent(
        await readFile(path.join(directory, "assets.html"), "utf8")
      );
      expect(await page.locator("img").getAttribute("src")).toBe(sourceFile);
      expect(
        await page
          .locator("img")
          .evaluate((node) => getComputedStyle(node).backgroundImage)
      ).toContain(backgroundFile);
      expect(
        await page
          .locator("rect")
          .evaluate((node) => getComputedStyle(node).fill)
      ).toContain("#paint");
    } finally {
      await browser.close();
      await rm(directory, { recursive: true, force: true });
    }
  }, 30_000);

  it("resolves signed asset URLs independently before removing credentials from evidence", async () => {
    const browser = await chromium.launch({ headless: true });
    const directory = await mkdtemp(
      path.join(tmpdir(), "style-capture-signed-")
    );
    try {
      const page = await browser.newPage();
      await page.route("https://example.com/**", (route) => route.abort());
      await page.setContent(
        '<div id="target"><div style="background-image:url(https://example.com/image.png?token=first)"></div><div style="background-image:url(https://example.com/image.png?token=second)"></div></div>'
      );
      const capture = await captureElement(page, "#target", {
        ...createDefaultSettings(),
        captureMode: "full",
      });
      await writeReplay(page, capture, directory, "signed.html", "white", {
        assets: [
          {
            url: "https://example.com/image.png?token=first",
            kind: "image",
            file: "assets/first.png",
          },
          {
            url: "https://example.com/image.png?token=second",
            kind: "image",
            file: "assets/second.png",
          },
        ],
        fonts: { faces: [], platform: [] },
        gaps: [],
      });
      const html = await readFile(path.join(directory, "signed.html"), "utf8");
      expect(html).not.toContain("token=first");
      expect(html).not.toContain("token=second");
      await page.setContent(html);
      const backgrounds = await page
        .locator("#target > div")
        .evaluateAll((nodes) =>
          nodes.map((node) => getComputedStyle(node).backgroundImage)
        );
      expect(backgrounds[0]).toContain("assets/first.png");
      expect(backgrounds[1]).toContain("assets/second.png");
    } finally {
      await browser.close();
      await rm(directory, { recursive: true, force: true });
    }
  }, 30_000);

  it("keeps inherited full styles and identifies a root whose display selector is ambiguous", async () => {
    const browser = await chromium.launch({ headless: true });
    const directory = await mkdtemp(
      path.join(tmpdir(), "style-capture-replay-")
    );
    try {
      const page = await browser.newPage();
      await page.setContent(
        `<style>section{font:18px Georgia}button,input{font:inherit}#second button{color:rgb(0,0,255)}</style><section id="first"><div><div><div><button><span>First</span><input></button></div></div></div></section><section id="second"><div><div><div><button><span>Second</span><input></button></div></div></div></section>`
      );
      const capture = await captureElement(page, "#second button", {
        ...createDefaultSettings(),
        captureMode: "full",
      });
      const root = capture.elements[capture.rootElementId];
      expect(await page.locator(root.selector).count()).toBe(2);
      const input = Object.values(capture.elements).find(
        (node) => node.tagName === "input"
      );
      expect(input?.styles["font-family"]).toBe("Georgia");
      expect(input?.styles["font-size"]).toBe("18px");
      await writeReplay(page, capture, directory, "replay.html", "white");
      await page.setContent(
        await readFile(path.join(directory, "replay.html"), "utf8")
      );
      expect(
        await page.locator('[data-style-capture="node-0"]').textContent()
      ).toBe("Second");
      expect(
        await page
          .locator("input[data-style-capture]")
          .evaluate((node) => getComputedStyle(node).fontFamily)
      ).toBe("Georgia");
      expect(
        await page
          .locator("button[data-style-capture]")
          .evaluate((node) => getComputedStyle(node).color)
      ).toBe("rgb(0, 0, 255)");
    } finally {
      await browser.close();
      await rm(directory, { recursive: true, force: true });
    }
  }, 30_000);

  it.each(["contain:content", "overflow:clip"])(
    "retains ancestor %s origin and clipping without copying content",
    async (contextStyle) => {
      const browser = await chromium.launch({ headless: true });
      const directory = await mkdtemp(
        path.join(tmpdir(), "style-capture-paint-")
      );
      try {
        const page = await browser.newPage({
          viewport: { width: 320, height: 240 },
          deviceScaleFactor: 2,
        });
        await page.setContent(
          `<div style="position:absolute;left:10px;top:20.546875px;width:200px;height:200px;${contextStyle}"><div id="target" style="position:absolute;left:12px;top:169.5px;width:100px;height:30px;background:red;font:18px/20px Arial;outline:1px auto blue;outline-offset:1px">Text</div></div>`
        );
        const capture = await captureElement(page, "#target", {
          ...createDefaultSettings(),
          captureMode: "full",
        });
        const evidence = await captureVisualEvidence(
          page,
          "#target",
          capture,
          directory,
          "rest"
        );
        expect(evidence.pixelClip?.paintContexts?.[0]?.bounds.y).toBe(
          20.546875
        );
        expect(evidence.pixelClip?.replayOrigin).toEqual({ x: 22, y: 190 });
        await page.setContent(
          await readFile(path.join(directory, "rest.html"), "utf8")
        );
        expect(
          await page.locator("[data-style-capture-paint-context]").count()
        ).toBe(1);
        if (!evidence.pixelClip) throw new Error("Missing pixel clip");
        const replay = await pixelScreenshot(page, evidence.pixelClip, true);
        expect(
          replay.equals(await readFile(path.join(directory, "rest.png")))
        ).toBe(true);
      } finally {
        await browser.close();
        await rm(directory, { recursive: true, force: true });
      }
    },
    30_000
  );

  it("copies fractional-phase crops at native DPR without resetting later captures", async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({
        viewport: { width: 320, height: 240 },
        deviceScaleFactor: 2,
      });
      await page.setContent(
        '<div style="position:absolute;left:10.25px;top:20.25px;width:100px;height:30px;background:red"></div>'
      );
      const clip = {
        deviceScaleFactor: 2,
        source: { x: 10, y: 20, width: 100.5, height: 30.5 },
        rootOffset: { x: 0.25, y: 0.25 },
        pixelWidth: 201,
        pixelHeight: 61,
      };
      for (let index = 0; index < 2; index += 1) {
        const png = await pixelScreenshot(page, clip);
        expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([201, 61]);
        expect(await page.evaluate(() => devicePixelRatio)).toBe(2);
      }
    } finally {
      await browser.close();
    }
  }, 30_000);
});
