#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DONEBEAR_ROOT =
  process.env.DONEBEAR_REPO_ROOT ??
  "/Users/mblode/Code/mblode/donebear/donebear";
const TASKS_PATH = join(ROOT, "store", "manual-tasks.json");

function parseArgs(argv) {
  return {
    dryRun: argv.includes("--dry-run"),
    help: argv.includes("--help") || argv.includes("-h"),
  };
}

function runDonebear(args) {
  return spawnSync(
    "node",
    ["--import", "tsx", "packages/cli/src/cli.ts", ...args],
    {
      cwd: DONEBEAR_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    process.stdout.write(`Usage:
  node scripts/create-donebear-cws-tasks.mjs [--dry-run]

Creates the manual Chrome Web Store follow-up tasks in Done Bear using the
source CLI entrypoint. The task payloads come from store/manual-tasks.json.
`);
    return;
  }

  const tasks = JSON.parse(readFileSync(TASKS_PATH, "utf8"));

  for (const task of tasks) {
    if (options.dryRun) {
      process.stdout.write(`${JSON.stringify(task)}\n`);
      continue;
    }

    const result = runDonebear([
      "task",
      "add",
      task.title,
      "--notes",
      task.notes,
      "--json",
    ]);

    if (result.status !== 0) {
      const message = [
        `Failed to create Done Bear task: ${task.title}`,
        result.stdout.trim(),
        result.stderr.trim(),
      ]
        .filter(Boolean)
        .join("\n");

      throw new Error(message);
    }

    process.stdout.write(`${result.stdout.trim()}\n`);
  }
}

main();
