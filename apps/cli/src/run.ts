import { writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  CaptureResult,
  CaptureSettings,
  CaptureState,
} from "@style-capture/core";
import {
  createDefaultSettings,
  formatCaptureForClaudeMarkdown,
  mapCaptureToTailwind,
} from "@style-capture/core";
import { chromium } from "playwright";
import type { Browser, Page } from "playwright";

import { captureAssets } from "./capture-assets.ts";
import { captureStates, STATE_EXTRA_PROPERTIES } from "./capture-states.ts";
import { captureElement } from "./capture.ts";
import { redactEvidenceText } from "./evidence-serialization.ts";
import {
  captureVisualEvidence,
  createBundle,
  writeJson,
} from "./export-bundle.ts";
import { captureSourceCss } from "./source-css.ts";
import type { StateScope } from "./states.ts";

export interface RunOptions {
  mode?: "curated" | "full";
  out?: string;
  viewport?: { width: number; height: number };
  dpr?: number;
  colorScheme?: "light" | "dark" | "no-preference";
  surface?: string;
  beforeCapture?: (page: Page) => Promise<void>;
  selector: string;
  stateScope?: StateScope;
  states?: CaptureState[];
  url: string;
}

const createPage = (browser: Browser, options: RunOptions): Promise<Page> =>
  browser.newPage({
    ...(options.viewport ? { viewport: options.viewport } : {}),
    ...(options.dpr ? { deviceScaleFactor: options.dpr } : {}),
    ...(options.colorScheme ? { colorScheme: options.colorScheme } : {}),
  });

const captureSettings = (
  options: RunOptions,
  bundle: boolean
): CaptureSettings => ({
  ...createDefaultSettings(),
  captureMode: options.mode ?? (bundle ? "full" : "curated"),
});

const captureStateBundle = async (
  page: Page,
  selector: string,
  capture: CaptureResult,
  directory: string,
  state: CaptureState
) => {
  const stateDirectory = await createBundle(path.join(directory, state));
  const sourceCss = await captureSourceCss(page, selector);
  const assets = await captureAssets(page, selector, stateDirectory, sourceCss);
  const visual = await captureVisualEvidence(
    page,
    selector,
    capture,
    stateDirectory,
    state,
    assets
  );
  await writeJson(stateDirectory, "assets.json", assets);
  await writeJson(stateDirectory, "source-css.json", sourceCss);
  await writeFile(
    path.join(stateDirectory, "source.css"),
    redactEvidenceText(sourceCss.css),
    {
      flag: "wx",
    }
  );
  return {
    ...visual,
    screenshot: visual.screenshot ? `${state}/${visual.screenshot}` : undefined,
    replay: `${state}/${visual.replay}`,
    gaps: [...visual.gaps, ...assets.gaps, ...sourceCss.gaps],
  };
};

const preparePage = async (
  page: Page,
  options: RunOptions,
  bundle: boolean
): Promise<string[]> => {
  await page.goto(options.url, {
    waitUntil: bundle ? "domcontentloaded" : "networkidle",
    timeout: 30_000,
  });
  await options.beforeCapture?.(page);
  if (!bundle) return [];
  await page
    .locator(options.selector)
    .first()
    .waitFor({ state: "visible", timeout: 30_000 });
  const fontsReady = await page.evaluate(async () => {
    // oxlint-disable-next-line promise/avoid-new -- bounded readiness for pages with persistent media traffic
    const timeout = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), 5000);
    });
    return await Promise.race([document.fonts.ready.then(() => true), timeout]);
  });
  const transitionWait = await page
    .locator(options.selector)
    .first()
    .evaluate((element) => {
      const style = getComputedStyle(element);
      // oxlint-disable-next-line unicorn/consistent-function-scoping -- serialized browser evaluation
      const milliseconds = (text: string) =>
        text
          .split(",")
          .map(
            (part) =>
              Number.parseFloat(part) * (part.trim().endsWith("ms") ? 1 : 1000)
          );
      return Math.min(
        1000,
        Math.max(...milliseconds(style.transitionDuration)) +
          Math.max(...milliseconds(style.transitionDelay))
      );
    });
  await page.waitForTimeout(transitionWait);
  await page.evaluate(async () => {
    // oxlint-disable-next-line promise/avoid-new -- frame readiness is callback based
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
  return fontsReady
    ? []
    : ["Font readiness exceeded 5000ms; capture may contain fallback glyphs."];
};

const finishBundle = async (
  directory: string,
  options: RunOptions,
  capture: CaptureResult,
  output: string,
  visual: Awaited<ReturnType<typeof captureVisualEvidence>> | undefined,
  assetsEvidence: Awaited<ReturnType<typeof captureAssets>> | undefined,
  sourceCssEvidence: Awaited<ReturnType<typeof captureSourceCss>> | undefined,
  readinessGaps: string[]
): Promise<void> => {
  await writeJson(directory, "capture.json", capture);
  await writeFile(
    path.join(directory, "prompt.md"),
    redactEvidenceText(output),
    {
      flag: "wx",
    }
  );
  await writeFile(
    path.join(directory, "source.css"),
    redactEvidenceText(sourceCssEvidence?.css ?? ""),
    { flag: "wx" }
  );
  await writeJson(directory, "manifest.json", {
    version: 1,
    status: "captured-not-verified",
    metadata: capture.metadata,
    selector: options.selector,
    settings: capture.settings,
    visual,
    assetsEvidence,
    sourceCssEvidence,
    recipe: {
      url: options.url,
      selector: options.selector,
      viewport: capture.metadata.viewport,
      dpr: capture.metadata.deviceScaleFactor,
      colorScheme: options.colorScheme,
      surface: options.surface,
      states: options.states ?? [],
      stateScope: options.stateScope ?? "element",
      setupHookUsed: Boolean(options.beforeCapture),
    },
    gaps: [
      ...readinessGaps,
      "Forced CSS states do not reproduce application event handlers.",
      "Transition settling is capped at 1000ms; animations may remain active.",
      "No pixel-fidelity comparison has been run.",
      ...(options.beforeCapture
        ? ["Programmatic setup hook must be supplied again for replay."]
        : []),
    ],
  });
};

/**
 * Non-interactive capture — designed for agent/skill usage.
 * Returns the formatted style_capture prompt as a string.
 */
export const run = async (options: RunOptions): Promise<string> => {
  const directory = options.out ? await createBundle(options.out) : undefined;
  const settings = captureSettings(options, Boolean(directory));

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await createPage(browser, options);
    const readinessGaps = await preparePage(page, options, Boolean(directory));
    const count = await page.locator(options.selector).count();
    if (count === 0) {
      throw new Error(
        `Selector "${options.selector}" matched 0 elements on ${options.url}`
      );
    }

    if (count > 1) {
      process.stderr.write(
        `Warning: selector matched ${count} elements, capturing the first\n`
      );
    }

    const sourceCssEvidence = directory
      ? await captureSourceCss(page, options.selector)
      : undefined;
    const assetsEvidence = directory
      ? await captureAssets(
          page,
          options.selector,
          directory,
          sourceCssEvidence
        )
      : undefined;
    const capture = await captureElement(
      page,
      options.selector,
      settings,
      options.states?.length ? STATE_EXTRA_PROPERTIES : []
    );
    if (directory) {
      capture.metadata = {
        ...capture.metadata,
        capturedAt: new Date().toISOString(),
        userAgent: await page.evaluate(() => navigator.userAgent),
        viewport: page.viewportSize() ?? undefined,
        deviceScaleFactor: await page.evaluate(() => window.devicePixelRatio),
        colorScheme: options.colorScheme,
        surface: options.surface ?? "unspecified",
        browserVersion: browser.version(),
      };
    }
    const visual = directory
      ? await captureVisualEvidence(
          page,
          options.selector,
          capture,
          directory,
          "rest",
          assetsEvidence
        )
      : undefined;
    if (options.states?.length) {
      capture.states = await captureStates(
        page,
        options.selector,
        settings,
        options.states,
        options.stateScope ?? "element",
        capture,
        directory
          ? (state, stateCapture) =>
              captureStateBundle(
                page,
                options.selector,
                stateCapture,
                directory,
                state
              )
          : undefined
      );
    }
    const mapping = mapCaptureToTailwind(capture);
    const output = formatCaptureForClaudeMarkdown(capture, mapping);

    if (directory) {
      await finishBundle(
        directory,
        options,
        capture,
        output,
        visual,
        assetsEvidence,
        sourceCssEvidence,
        readinessGaps
      );
    }
    process.stderr.write(
      `Captured ${capture.summary.elementCount} elements, ${mapping.summary.utilityCount} Tailwind utilities mapped\n`
    );

    return output;
  } finally {
    await browser.close();
  }
};
