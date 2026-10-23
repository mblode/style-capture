import { Command } from "commander";

import { interactive } from "./interactive.ts";
import { run } from "./run.ts";
import { parseStateScope, parseStates } from "./states.ts";

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
  .option(
    "-s, --state <state>",
    "also capture a state: hover, focus, focus-visible, active, disabled or all (repeatable or comma list)",
    (value: string, previous: string[]) => [...previous, value],
    [] as string[]
  )
  .option(
    "--state-scope <scope>",
    "force the state on the element or its subtree",
    "element"
  )
  .action(
    async (
      url?: string,
      selector?: string,
      options?: { mode: string; state: string[]; stateScope: string }
    ) => {
      if (url && selector) {
        const result = await run({
          mode: (options?.mode as "curated" | "full") ?? "curated",
          selector,
          stateScope: parseStateScope(options?.stateScope ?? "element"),
          states: parseStates(options?.state ?? []),
          url,
        });
        process.stdout.write(result);
      } else {
        await interactive();
      }
    }
  );

program.parse();
