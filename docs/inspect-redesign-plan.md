# Inspect Redesign Plan

Execution progress:

- [ ] Phase 1: Lock the inspect-mode product contract
- [ ] Phase 2: Simplify the popup into a launcher
- [ ] Phase 3: Replace the fixed picker HUD with an inspect overlay
- [ ] Phase 4: Add a cursor-following hover label
- [ ] Phase 5: Harden interaction, cleanup, and verification

## Goal

Turn the current picker into a lightweight inspect flow:

- Popup should primarily launch inspect mode.
- The page overlay should show a bounding box around the hovered element.
- The cursor should switch to a plus-style inspect cursor.
- A tooltip should follow the cursor and show a readable element path.
- The capture payload and results workspace should stay intact unless a later pass intentionally changes them.

## Decision Summary

- Keep the core capture contract: click still captures the selected DOM subtree and stores the same payload shape.
- Simplify the popup aggressively. The results page already owns review, export, and detailed payload inspection.
- Remove the large bottom-left picker HUD in [`src/runtime/run-picker.ts`](/Users/mblode/Code/mblode/style-capture/src/runtime/run-picker.ts).
- Introduce a dedicated hover-label formatter instead of reusing the persisted selector formatter.
- Prefer a compact breadcrumb in the tooltip, but keep the existing fuller selector for stored capture metadata.
- Treat the inspect cursor as part of picker lifecycle and restore the previous cursor on cleanup.

## Research Notes

### Current `style-capture` constraints

- Popup copy and flow are concentrated in [`src/popup/popup-app.tsx`](/Users/mblode/Code/mblode/style-capture/src/popup/popup-app.tsx).
- Capture start/status orchestration lives in [`src/background/index.ts`](/Users/mblode/Code/mblode/style-capture/src/background/index.ts).
- The injected picker already has the important primitives: a Shadow DOM host, a highlight frame, event interception, selector generation, and capture serialization in [`src/runtime/run-picker.ts`](/Users/mblode/Code/mblode/style-capture/src/runtime/run-picker.ts).
- Existing automated coverage is thin. Runtime interaction tests are minimal in [`src/runtime/run-picker.test.ts`](/Users/mblode/Code/mblode/style-capture/src/runtime/run-picker.test.ts).

### `react-grab` patterns worth borrowing

- The selection label is a fixed overlay at maximum z-index and is positioned from hovered bounds plus cursor X, not as a detached inspector panel.
- Label placement is viewport-aware: it clamps horizontally and flips above the selection if there is not enough room below.
- The overlay stays click-through unless interaction is intentionally enabled.
- `react-grab` changelog history shows repeated work on cursor tracking, label X positioning, and cursor-following success feedback, which is a strong signal that placement polish matters in practice.

Sources:

- `react-grab` selection-label source:
  https://raw.githubusercontent.com/aidenybai/react-grab/a9db390c46de3ca3c48f61c6c4c83939369beef7/packages/react-grab/src/components/selection-label/index.tsx
- `react-grab` constants:
  https://raw.githubusercontent.com/aidenybai/react-grab/a9db390c46de3ca3c48f61c6c4c83939369beef7/packages/react-grab/src/constants.ts
- `react-grab` changelog:
  https://www.react-grab.com/changelog
- `react-grab` agent article:
  https://www.react-grab.com/blog/agent

## Workstreams

### Popup team

Owns [`src/popup/popup-app.tsx`](/Users/mblode/Code/mblode/style-capture/src/popup/popup-app.tsx).

### Runtime overlay team

Owns [`src/runtime/run-picker.ts`](/Users/mblode/Code/mblode/style-capture/src/runtime/run-picker.ts).

### Integration team

Owns [`src/background/index.ts`](/Users/mblode/Code/mblode/style-capture/src/background/index.ts), status messaging, and any results-page handoff changes.

### Verification team

Owns picker/background tests and doc updates.

## Phase 1: Lock the inspect-mode product contract

- [ ] Confirm the popup is no longer a payload dashboard and becomes a launcher with memory.
- [ ] Keep the results page as the review workspace for stored payloads, export, and clear actions.
- [ ] Decide whether the inspect cursor uses native `crosshair`/`cell` for MVP or a custom plus cursor asset for exact visual fidelity.
- [ ] Define the tooltip content contract:
      `tag#id` when available, otherwise `tag.class`, rendered as a compact 2-4 segment breadcrumb.
- [ ] Explicitly keep persisted capture selectors separate from hover-label text.

Exit criteria:

- One agreed interaction contract for popup, overlay, tooltip, cursor, and keyboard behavior.

## Phase 2: Simplify the popup into a launcher

- [ ] Remove the explanatory shell copy about the capture workflow and injection model from [`src/popup/popup-app.tsx`](/Users/mblode/Code/mblode/style-capture/src/popup/popup-app.tsx).
- [ ] Collapse the current “Capture flow” card into a simpler launcher layout.
- [ ] Keep one dominant CTA such as `Start inspect` or `Inspect page`.
- [ ] Keep one compact status line for `idle`, `arming`, `capturing`, `completed`, and `error`.
- [ ] Replace the large “Last payload” block with a compact latest-capture summary row.
- [ ] Move or remove the popup `Clear stored capture` action so clearing happens from the results workspace instead of the launcher.
- [ ] Keep lightweight access to `Open results` and `Settings`.

Exit criteria:

- Popup can be scanned in a few seconds and its primary action is unambiguous.

## Phase 3: Replace the fixed picker HUD with an inspect overlay

- [ ] Remove the current bottom-left HUD panel from [`src/runtime/run-picker.ts`](/Users/mblode/Code/mblode/style-capture/src/runtime/run-picker.ts).
- [ ] Keep the existing bounding frame primitive and restyle it for inspect mode if needed.
- [ ] Ensure the entire overlay root stays `pointer-events: none`.
- [ ] Make sure hit-testing still resolves the real page element even when the tooltip is near the pointer.
- [ ] Apply the inspect cursor when the picker activates and fully restore the previous cursor on cleanup.
- [ ] Keep capture-on-click and cancel-on-Escape behavior unchanged unless Phase 1 explicitly changes it.
- [ ] Revisit whether the frame animation should remain eased or become snappier for an inspect-tool feel.

Exit criteria:

- Hovering the page feels like inspect mode, not like a guided modal.

## Phase 4: Add a cursor-following hover label

- [ ] Add a dedicated hover-label node inside the overlay host.
- [ ] Implement `buildHoverLabel()` separately from the persisted `buildSelector()` path.
- [ ] Format hover labels as compact breadcrumbs, for example:
      `main > section.pricing > button.primary`
- [ ] Limit each breadcrumb segment to a compact representation:
      prefer `tag#id`, otherwise `tag.class`, with at most one meaningful class.
- [ ] Do not show `:nth-child()` in the hover label.
- [ ] Position the label from cursor coordinates with viewport clamping.
- [ ] Flip the label above the highlighted element when there is not enough space below.
- [ ] Decide whether to include a tiny secondary detail line for dimensions only if it remains readable.
- [ ] Prevent hover-label jitter when moving within the same target.

Exit criteria:

- The label is readable in motion, stays onscreen, and helps users understand what will be captured.

## Phase 5: Harden interaction, cleanup, and verification

- [ ] Add runtime tests for mount, idempotent activation, overlay DOM shape, and cleanup.
- [ ] Add hover tests that assert frame movement and hover-label updates.
- [ ] Add edge-position tests for tooltip clamping and vertical flipping.
- [ ] Add self-targeting tests where composed path or `elementFromPoint()` touches overlay nodes.
- [ ] Add click-to-capture tests that prove payload delivery still works after the overlay rewrite.
- [ ] Add Escape-cancel tests.
- [ ] Add background tests for `capture/start` status transitions:
      no active tab, successful injection, already-active picker, injection failure.
- [ ] Add background tests for `capture/completed`, `capture/failed`, and storage failure handling.
- [ ] Update docs if keyboard behavior, popup responsibilities, or inspect visuals changed materially.

Exit criteria:

- Runtime picker behavior and background state transitions are covered well enough to refactor safely.

## Recommended Sequence

1. Popup team: simplify the launcher first so product scope is clear.
2. Runtime overlay team: remove the large HUD while preserving current capture behavior.
3. Runtime overlay team: add hover-label formatting and cursor-aware placement.
4. Integration team: trim or update status copy to match the new inspect language.
5. Verification team: add runtime tests, then background tests, then doc cleanup.

## Risks

- A moving tooltip can accidentally interfere with hit-testing if any overlay node stops being click-through.
- A custom plus cursor adds asset and cleanup complexity; native `crosshair` is safer for MVP.
- Reusing the full persisted selector in the tooltip will make the UI noisy and unstable.
- Removing the HUD without retaining Escape discoverability may make cancellation less obvious.
- Cursor-follow labels near the viewport edge will feel broken unless clamping and flip behavior are implemented carefully.

## Suggested MVP Cut

If this needs to land in one fast pass, do this first:

- [ ] Simplify the popup to `Start inspect`, compact status, `Open results`, and `Settings`.
- [ ] Remove the picker HUD.
- [ ] Keep the bounding box.
- [ ] Apply a native inspect cursor.
- [ ] Add a one-line compact breadcrumb tooltip that follows the cursor and clamps to viewport edges.
- [ ] Keep existing capture payload generation unchanged.
- [ ] Add mount/cleanup, hover, click, and Escape tests.
