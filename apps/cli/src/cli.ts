import { Command, InvalidArgumentError, Option } from "commander";

import { interactive } from "./interactive.ts";
import { run } from "./run.ts";
import { parseStateScope, parseStates } from "./states.ts";
import { verifyBundle } from "./verify-bundle.ts";

const program = new Command();

const positiveNumber = (value: string): number => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0)
    throw new InvalidArgumentError("Expected a positive number.");
  return number;
};

const parseViewport = (value: string): { width: number; height: number } => {
  const match = /^(\d+)x(\d+)$/u.exec(value);
  if (!match)
    throw new InvalidArgumentError("Expected WIDTHxHEIGHT, such as 1440x900.");
  return { width: positiveNumber(match[1]), height: positiveNumber(match[2]) };
};

program
  .name("style-capture")
  .description(
    "Capture computed CSS and HTML from web pages, map to Tailwind utilities"
  )
  .version("0.0.1")
  .argument("[url]", "URL to capture")
  .argument("[selector]", "CSS selector for target element")
  .addOption(
    new Option(
      "-m, --mode <mode>",
      "capture mode (bundle defaults to full)"
    ).choices(["curated", "full"])
  )
  .option(
    "--verify-bundle <directory>",
    "compare saved source crops with local replay; writes a scoped report"
  )
  .option(
    "--out <directory>",
    "write a new local evidence bundle; refuses existing directories"
  )
  .option(
    "--viewport <WIDTHxHEIGHT>",
    "browser viewport in CSS pixels",
    parseViewport
  )
  .option("--dpr <number>", "device pixel ratio", positiveNumber)
  .addOption(
    new Option(
      "--color-scheme <scheme>",
      "emulated system colour preference"
    ).choices(["light", "dark", "no-preference"])
  )
  .addOption(
    new Option("--surface <surface>", "source surface for provenance").choices([
      "marketing",
      "app",
      "component-demo",
      "case-study",
    ])
  )
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
      options?: {
        verifyBundle?: string;
        mode?: "curated" | "full";
        state: string[];
        stateScope: string;
        out?: string;
        viewport?: { width: number; height: number };
        dpr?: number;
        colorScheme?: "light" | "dark" | "no-preference";
        surface?: string;
      }
    ) => {
      if (options?.verifyBundle) {
        process.stdout.write(`${await verifyBundle(options.verifyBundle)}\n`);
      } else if (url && selector) {
        const result = await run({
          mode: options?.mode,
          out: options?.out,
          viewport: options?.viewport,
          dpr: options?.dpr,
          colorScheme: options?.colorScheme,
          surface: options?.surface,
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
