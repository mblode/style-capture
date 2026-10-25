# style-capture

## 1.3.1

### Patch Changes

- c89cdbc: Point the installed command and start script to the compiled ES module so the published CLI launches correctly.

## 1.3.0

### Minor Changes

- 451ed61: Add `--state` and `--state-scope` to capture hover, focus, focus-visible, active and disabled states, with a `states` section and `state_diff` in the output.
- 9a684a0: Add optional local evidence bundles with viewport, pixel ratio and source-surface metadata; matched source CSS; original font/image assets and hashes; Chromium rendered-font evidence; static replay HTML; and reference screenshots for the resting and requested CSS states. Preserve the existing prompt-only CLI behavior when no output directory is supplied. Record unsupported dependencies and unverified fidelity explicitly.

  The extension source also adds an optional JSON bundle download using its existing permissions, including available assets and a visible-element screenshot. Its actual glyph-font verification and repeatable state capture remain CLI-only.

  Add a saved-bundle verification command that compares source and replay PNGs with exact pixel metrics, rendered font inventories and asset request failures. Bundle readiness waits for the visible target and bounded font/paint settling instead of network idle.

## 1.2.0

### Minor Changes

- cbcff03: Fix CI formatting, remove orphaned changeset, and replace ultracite with oxlint+oxfmt in pre-commit hook

## 0.0.3

### Patch Changes

- 4d0d815: Add repository field to CLI package.json to fix npm provenance validation on publish

## 0.0.2

### Patch Changes

- 385b768: Rename CLI package from @style-capture/cli to style-capture and consolidate release workflows
