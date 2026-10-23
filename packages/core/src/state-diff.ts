import type { CaptureResult, CaptureState } from "./types.ts";

export interface StyleChange {
  after: string;
  before: string;
}

const UNSET = "(default)";

/**
 * Properties that differ between the resting capture and one state, keyed by
 * element id. A property missing on one side equals the browser default there.
 */
export const diffStateStyles = (
  capture: CaptureResult,
  state: CaptureState
): Record<string, Record<string, StyleChange>> => {
  const result = capture.states?.[state];
  const diff: Record<string, Record<string, StyleChange>> = {};

  if (!result?.applicable) {
    return diff;
  }

  for (const [elementId, stateStyles] of Object.entries(result.styles)) {
    const baseStyles = capture.elements[elementId]?.styles ?? {};
    const changes: Record<string, StyleChange> = {};

    for (const property of new Set([
      ...Object.keys(baseStyles),
      ...Object.keys(stateStyles),
    ])) {
      const before = baseStyles[property] ?? UNSET;
      const after = stateStyles[property] ?? UNSET;
      if (before !== after) {
        changes[property] = { after, before };
      }
    }

    if (Object.keys(changes).length > 0) {
      diff[elementId] = changes;
    }
  }

  return diff;
};
