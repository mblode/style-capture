---
"style-capture": minor
"@style-capture/core": minor
---

Add optional local evidence bundles with viewport, pixel ratio and source-surface metadata; matched source CSS; original font/image assets and hashes; Chromium rendered-font evidence; static replay HTML; and reference screenshots for the resting and requested CSS states. Preserve the existing prompt-only CLI behavior when no output directory is supplied. Record unsupported dependencies and unverified fidelity explicitly.

The extension source also adds an optional JSON bundle download using its existing permissions, including available assets and a visible-element screenshot. Its actual glyph-font verification and repeatable state capture remain CLI-only.

Add a saved-bundle verification command that compares source and replay PNGs with exact pixel metrics, rendered font inventories and asset request failures. Bundle readiness waits for the visible target and bounded font/paint settling instead of network idle.
