import type { CaptureSettings } from "@style-capture/core";
import {
  createDefaultSettings,
  formatCaptureForClaudeMarkdown,
  mapCaptureToTailwind,
} from "@style-capture/core";
import { chromium } from "playwright";
import { captureElement } from "./capture.ts";

export interface RunOptions {
  mode?: "curated" | "full";
  selector: string;
  url: string;
}

/**
 * Non-interactive capture — designed for agent/skill usage.
 * Returns the formatted style_capture prompt as a string.
 */
export async function run(options: RunOptions): Promise<string> {
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

    const capture = await captureElement(page, options.selector, settings);
    const mapping = mapCaptureToTailwind(capture);
    return formatCaptureForClaudeMarkdown(capture, mapping);
  } finally {
    await browser.close();
  }
}

/**
 * CLI entry point for non-interactive mode:
 *   npx tsx src/run.ts <url> <selector> [--mode curated|full]
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const url = args[0];
  const selector = args[1];
  const modeIndex = args.indexOf("--mode");
  const mode =
    modeIndex === -1 ? "curated" : (args[modeIndex + 1] as "curated" | "full");

  if (!(url && selector)) {
    console.error(
      "Usage: style-capture <url> <selector> [--mode curated|full]"
    );
    process.exit(1);
  }

  const result = await run({ url, selector, mode });
  console.log(result);
}

main().catch((error) => {
  console.error(String(error));
  process.exit(1);
});
