import type {
  CaptureResult,
  CaptureSettings,
  CaptureState,
  PixelClip,
  StateCaptureResult,
} from "@style-capture/core";
import type { Page } from "playwright";

import { captureElement } from "./capture.ts";
import type { StateScope } from "./states.ts";

const MAX_TRANSITION_WAIT_MS = 1000;

export type StateCaptureHook = (
  state: CaptureState,
  capture: CaptureResult
) => Promise<{
  screenshot?: string;
  replay?: string;
  gaps: string[];
  pixelClip?: PixelClip;
}>;

const snapshot = (capture: CaptureResult) => ({
  elements: capture.elements,
  order: capture.order,
  rootElementId: capture.rootElementId,
  rootOuterHtml: capture.rootOuterHtml,
});

/** Not in the curated set, but what focus-visible and similar states change. */
export const STATE_EXTRA_PROPERTIES = [
  "outline-color",
  "outline-offset",
  "outline-style",
  "outline-width",
];

/** Longest transition duration + delay among the targets, in ms, capped. */
const readTransitionWait = (
  page: Page,
  selector: string,
  scope: StateScope
): Promise<number> =>
  page.evaluate(
    ({ cap, scope: s, selector: sel }) => {
      const root = document.querySelector(sel);
      if (!root) {
        return 0;
      }
      // eslint-disable-next-line unicorn/consistent-function-scoping -- must stay inside page.evaluate
      const toMs = (list: string): number[] =>
        list.split(",").map((item) => {
          const value = Number.parseFloat(item);
          if (Number.isNaN(value)) {
            return 0;
          }
          return item.trim().endsWith("ms") ? value : value * 1000;
        });
      const targets =
        s === "subtree" ? [root, ...root.querySelectorAll("*")] : [root];
      let wait = 0;
      for (const target of targets) {
        const style = getComputedStyle(target);
        const delay = Math.max(...toMs(style.transitionDelay));
        const duration = Math.max(...toMs(style.transitionDuration));
        wait = Math.max(wait, delay + duration);
      }
      return Math.min(wait, cap);
    },
    { cap: MAX_TRANSITION_WAIT_MS, scope, selector }
  );

const settle = async (
  page: Page,
  selector: string,
  scope: StateScope
): Promise<void> => {
  await page.waitForTimeout(await readTransitionWait(page, selector, scope));
  // Transitions only advance with rendered frames, so let two paint.
  await page.evaluate(async () => {
    // eslint-disable-next-line promise/avoid-new -- rAF has no promise form
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
};

const isDisabled = (page: Page, selector: string): Promise<boolean> =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return Boolean(
      el &&
      (el.matches(":disabled") ||
        el.hasAttribute("disabled") ||
        el.getAttribute("aria-disabled") === "true")
    );
  }, selector);

/** Style maps keyed by the resting capture's element ids, matched on selector. */
const alignStyles = (
  base: CaptureResult,
  stateCapture: CaptureResult
): Record<string, Record<string, string>> => {
  const bySelector = new Map<string, Record<string, string>>();
  for (const element of Object.values(stateCapture.elements)) {
    bySelector.set(
      JSON.stringify(element.domPath ?? element.selector),
      element.styles
    );
  }

  const styles: Record<string, Record<string, string>> = {};
  for (const [id, element] of Object.entries(base.elements)) {
    const found = bySelector.get(
      JSON.stringify(element.domPath ?? element.selector)
    );
    if (found) {
      styles[id] = found;
    }
  }
  return styles;
};

const captureForcedState = async (
  page: Page,
  selector: string,
  settings: CaptureSettings,
  state: Exclude<CaptureState, "disabled">,
  scope: StateScope,
  base: CaptureResult,
  onCapture?: StateCaptureHook
): Promise<StateCaptureResult> => {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument", { depth: 0 });
    const { nodeId } = await cdp.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector,
    });
    const nodeIds = [nodeId];
    if (scope === "subtree") {
      const descendants = await cdp.send("DOM.querySelectorAll", {
        nodeId,
        selector: "*",
      });
      nodeIds.push(...descendants.nodeIds);
    }

    const force = (forcedPseudoClasses: string[]) =>
      Promise.all(
        nodeIds.map((id) =>
          cdp.send("CSS.forcePseudoState", {
            forcedPseudoClasses,
            nodeId: id,
          })
        )
      );

    await force([state]);
    try {
      await settle(page, selector, scope);
      const stateCapture = await captureElement(
        page,
        selector,
        settings,
        STATE_EXTRA_PROPERTIES
      );
      return {
        applicable: true,
        styles: alignStyles(base, stateCapture),
        ...(onCapture
          ? {
              snapshot: snapshot(stateCapture),
              evidence: await onCapture(state, stateCapture),
            }
          : {}),
      };
    } finally {
      await force([]);
      await settle(page, selector, scope);
    }
  } finally {
    await cdp.detach();
  }
};

/** Measures the target in each state; the resting capture is left untouched. */
export const captureStates = async (
  page: Page,
  selector: string,
  settings: CaptureSettings,
  states: CaptureState[],
  scope: StateScope,
  base: CaptureResult,
  onCapture?: StateCaptureHook
): Promise<NonNullable<CaptureResult["states"]>> => {
  const result: NonNullable<CaptureResult["states"]> = {};

  for (const state of states) {
    if (state === "disabled") {
      result.disabled = (await isDisabled(page, selector))
        ? {
            applicable: true,
            ...(onCapture
              ? {
                  snapshot: snapshot(base),
                  evidence: await onCapture(state, base),
                }
              : {}),
            styles: Object.fromEntries(
              Object.entries(base.elements).map(([id, el]) => [id, el.styles])
            ),
          }
        : {
            applicable: false,
            reason: "not applicable: element is not disabled",
          };
    } else {
      result[state] = await captureForcedState(
        page,
        selector,
        settings,
        state,
        scope,
        base,
        onCapture
      );
    }
  }

  return result;
};
