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

    if (count > 1) {
      process.stderr.write(
        `Warning: selector matched ${count} elements, capturing the first\n`
      );
    }

    const capture = await captureElement(page, options.selector, settings);
    const mapping = mapCaptureToTailwind(capture);
    const output = formatCaptureForClaudeMarkdown(capture, mapping);

    process.stderr.write(
      `Captured ${capture.summary.elementCount} elements, ${mapping.summary.utilityCount} Tailwind utilities mapped\n`
    );

    return output;
  } finally {
    await browser.close();
  }
}

function parseArgs(argv: string[]): RunOptions {
  const args = argv.slice(2);

  // Support both positional and flag-based args
  let url: string | undefined;
  let selector: string | undefined;
  let mode: "curated" | "full" = "curated";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--mode" && args[i + 1]) {
      mode = args[i + 1] as "curated" | "full";
      i++;
    } else if (arg === "--url" && args[i + 1]) {
      url = args[i + 1];
      i++;
    } else if (arg === "--selector" && args[i + 1]) {
      selector = args[i + 1];
      i++;
    } else if (!url) {
      url = arg;
    } else if (!selector) {
      selector = arg;
    }
  }

  if (!(url && selector)) {
    process.stderr.write(
      "Usage: style-capture <url> <selector> [--mode curated|full]\n"
    );
    process.stderr.write(
      "       style-capture --url <url> --selector <selector>\n"
    );
    process.exit(1);
  }

  return { url, selector, mode };
}

const options = parseArgs(process.argv);
run(options)
  .then((result) => {
    process.stdout.write(result);
  })
  .catch((error) => {
    process.stderr.write(`Error: ${String(error)}\n`);
    process.exit(1);
  });
