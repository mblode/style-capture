import { Command } from "commander";

import { interactive } from "./interactive.ts";
import { run } from "./run.ts";

const program = new Command();

program
  .name("style-capture")
  .description(
    "Capture computed CSS and HTML from web pages, map to Tailwind utilities"
  )
  .version("0.0.1")
  .argument("[url]", "URL to capture")
  .argument("[selector]", "CSS selector for target element")
  .option("-m, --mode <mode>", "capture mode: curated or full", "curated")
  .action(
    async (url?: string, selector?: string, options?: { mode: string }) => {
      if (url && selector) {
        const result = await run({
          mode: (options?.mode as "curated" | "full") ?? "curated",
          selector,
          url,
        });
        process.stdout.write(result);
      } else {
        await interactive();
      }
    }
  );

program.parse();
