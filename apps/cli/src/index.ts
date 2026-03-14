#!/usr/bin/env node

import {
  cancel,
  group,
  intro,
  log,
  outro,
  select,
  spinner,
  text,
} from "@clack/prompts";
import type { CaptureSettings } from "@style-capture/core";
import {
  createDefaultSettings,
  formatCaptureForClaudeMarkdown,
  mapCaptureToTailwind,
} from "@style-capture/core";
import { chromium } from "playwright";
import { captureElement } from "./capture.ts";

async function main(): Promise<void> {
  intro("style-capture");

  const inputs = await group(
    {
      url: () =>
        text({
          message: "URL to capture",
          placeholder: "https://example.com",
          validate: (val) => {
            if (!val) {
              return "URL is required";
            }
            try {
              new URL(val);
            } catch {
              return "Please enter a valid URL";
            }
          },
        }),
      selector: () =>
        text({
          message: "CSS selector for target element",
          placeholder: "main, .hero, #app",
          validate: (val) => {
            if (!val?.trim()) {
              return "Selector is required";
            }
          },
        }),
      mode: () =>
        select({
          message: "Capture mode",
          options: [
            {
              label: "Curated",
              value: "curated" as const,
              hint: "Common visual properties only",
            },
            {
              label: "Full",
              value: "full" as const,
              hint: "All computed styles",
            },
          ],
        }),
      output: () =>
        select({
          message: "Output",
          options: [
            { label: "Clipboard", value: "clipboard" as const },
            { label: "Stdout", value: "stdout" as const },
          ],
        }),
    },
    {
      onCancel: () => {
        cancel("Cancelled.");
        process.exit(0);
      },
    }
  );

  const settings: CaptureSettings = {
    ...createDefaultSettings(),
    captureMode: inputs.mode,
  };

  const spin = spinner();
  spin.start("Launching browser");

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();

    spin.message(`Loading ${inputs.url}`);
    await page.goto(inputs.url, { waitUntil: "networkidle" });

    spin.message("Verifying selector");
    const found = await page.locator(inputs.selector).count();
    if (found === 0) {
      spin.stop("No element found");
      log.error(
        `Selector "${inputs.selector}" matched 0 elements on ${inputs.url}`
      );
      await browser.close();
      process.exit(1);
    }

    if (found > 1) {
      log.warn(`Selector matched ${found} elements — capturing the first one`);
    }

    spin.message(`Capturing ${found} element(s)`);
    const capture = await captureElement(page, inputs.selector, settings);

    spin.message("Mapping to Tailwind");
    const mapping = mapCaptureToTailwind(capture);

    spin.message("Formatting");
    const markdown = formatCaptureForClaudeMarkdown(capture, mapping);

    spin.stop("Capture complete");

    log.info(
      `${capture.summary.elementCount} elements, ${capture.summary.pseudoElementCount} pseudo-elements`
    );
    log.info(
      `Tailwind: ${mapping.summary.utilityCount} utilities mapped (${mapping.summary.averageConfidence.toFixed(0)}% avg confidence)`
    );

    if (inputs.output === "clipboard") {
      const { default: clipboardy } = await import("clipboardy");
      await clipboardy.write(markdown);
      log.success("Copied to clipboard");
    } else {
      console.log(`\n${markdown}`);
    }
  } finally {
    await browser.close();
  }

  outro("Done");
}

main().catch((error) => {
  log.error(String(error));
  process.exit(1);
});
