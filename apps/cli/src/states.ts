import type { CaptureState } from "@style-capture/core";

export type StateScope = "element" | "subtree";

const CAPTURE_STATES: readonly CaptureState[] = [
  "hover",
  "focus",
  "focus-visible",
  "active",
  "disabled",
];
const ALL_STATES: readonly CaptureState[] = [
  "hover",
  "focus-visible",
  "active",
];

/** Expands repeated and comma-separated `--state` values; `all` is hover, focus-visible and active. */
export const parseStates = (values: string[]): CaptureState[] => {
  const states = new Set<CaptureState>();

  for (const raw of values.flatMap((value) => value.split(","))) {
    const name = raw.trim();
    if (name === "all") {
      for (const state of ALL_STATES) {
        states.add(state);
      }
    } else if ((CAPTURE_STATES as readonly string[]).includes(name)) {
      states.add(name as CaptureState);
    } else if (name) {
      throw new Error(
        `Unknown state "${name}". Use ${[...CAPTURE_STATES, "all"].join(", ")}`
      );
    }
  }

  return [...states];
};

export const parseStateScope = (value: string): StateScope => {
  if (value === "element" || value === "subtree") {
    return value;
  }
  throw new Error(`Unknown --state-scope "${value}". Use element or subtree`);
};
