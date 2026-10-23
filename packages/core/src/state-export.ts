import { diffStateStyles } from "./state-diff.ts";
import type { CaptureResult, CaptureState } from "./types.ts";

const compact = (value: string): string => value.replaceAll(/\s+/g, " ").trim();

const formatDeclarations = (styles: Record<string, string>): string =>
  Object.entries(styles)
    .filter(([, value]) => value.trim().length > 0)
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([property, value]) => `${property}:${compact(value)}`)
    .join(";");

const formatState = (
  capture: CaptureResult,
  state: CaptureState,
  refs: Record<string, string>,
  selectors: Record<string, string>
): string => {
  const result = capture.states?.[state];

  if (!result) {
    return "";
  }

  if (!result.applicable) {
    return `<state name="${state}" applicable="false">${compact(result.reason)}</state>`;
  }

  const css = capture.order
    .map((elementId) => {
      const declarations = formatDeclarations(result.styles[elementId] ?? {});
      return declarations
        ? `${selectors[elementId] ?? elementId}{${declarations}}`
        : "";
    })
    .join("");

  const diff = diffStateStyles(capture, state);
  const diffLines = capture.order
    .filter((elementId) => diff[elementId])
    .map((elementId) => {
      const changes = Object.entries(diff[elementId])
        .toSorted(([left], [right]) => left.localeCompare(right))
        .map(
          ([property, { after, before }]) =>
            `${property}:${compact(before)}->${compact(after)}`
        )
        .join(";");
      return `${refs[elementId] ?? elementId} ${changes}`;
    });

  return [
    `<state name="${state}">`,
    `<css_capture>${css}</css_capture>`,
    "<state_diff>",
    ...(diffLines.length > 0 ? diffLines : ["no differences from default"]),
    "</state_diff>",
    "</state>",
  ].join("\n");
};

/** The `<states>` block lines, or none when the capture has no state data. */
export const formatStatesSection = (
  capture: CaptureResult,
  refs: Record<string, string>,
  selectors: Record<string, string>
): string[] => {
  const states = Object.keys(capture.states ?? {}) as CaptureState[];

  if (states.length === 0) {
    return [];
  }

  return [
    "<states>",
    ...states.map((state) => formatState(capture, state, refs, selectors)),
    "</states>",
  ];
};
