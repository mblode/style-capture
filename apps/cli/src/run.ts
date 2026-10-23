import type { CaptureSettings, CaptureState } from "@style-capture/core";
import {
  createDefaultSettings,
  formatCaptureForClaudeMarkdown,
  mapCaptureToTailwind,
} from "@style-capture/core";
import { chromium } from "playwright";

import { captureStates, STATE_EXTRA_PROPERTIES } from "./capture-states.ts";
import { captureElement } from "./capture.ts";
import type { StateScope } from "./states.ts";

export interface RunOptions {
  mode?: "curated" | "full";
  selector: string;
  stateScope?: StateScope;
  states?: CaptureState[];
  url: string;
}

/**
 * Non-interactive capture — designed for agent/skill usage.
 * Returns the formatted style_capture prompt as a string.
 */
export const run = async (options: RunOptions): Promise<string> => {
  const settings: CaptureSettings = {
    ...createDefaultSettings(),
    captureMode: options.mode ?? "curated",
  };

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(options.url, { waitUntil: "networkidle" });

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

    const capture = await captureElement(
      page,
      options.selector,
      settings,
      options.states?.length ? STATE_EXTRA_PROPERTIES : []
    );
    if (options.states?.length) {
      capture.states = await captureStates(
        page,
        options.selector,
        settings,
        options.states,
        options.stateScope ?? "element",
        capture
      );
    }
    const mapping = mapCaptureToTailwind(capture);
    const output = formatCaptureForClaudeMarkdown(capture, mapping);

    process.stderr.write(
      `Captured ${capture.summary.elementCount} elements, ${mapping.summary.utilityCount} Tailwind utilities mapped\n`
    );

    return output;
  } finally {
    await browser.close();
  }
};
