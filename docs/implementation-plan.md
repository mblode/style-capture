# Implementation Plan

Execution progress:

- [x] Phase 1: Runtime safety and capture integrity
- [x] Phase 2: Verification baseline and developer tooling
- [x] Phase 3: Results UX and Claude-friendly export
- [ ] Phase 4: Cross-frame capture and deeper integration coverage

## Phase 1: Runtime safety and capture integrity

- [x] Make repeated picker activation idempotent instead of cancelling the capture flow
- [x] Harden sanitized `rootOuterHtml` by stripping executable tags, inline handlers, and URL-bearing attributes
- [x] Fail early when a capture would exceed `chrome.storage.session` limits
- [x] Keep the raw capture contract stable for downstream transforms

## Phase 2: Verification baseline and developer tooling

- [x] Restore a real `vitest` test gate
- [x] Add storage guardrail coverage
- [x] Add picker sanitization coverage
- [x] Remove dead highlighter code and unused dependencies
- [x] Keep `lint`, `check-types`, `check`, and `build` green after the cleanup

## Phase 3: Results UX and Claude-friendly export

- [x] Move the primary handoff format away from raw JSON
- [x] Replace the raw JSON dump with a structured `style_capture` export
- [x] Package sanitized HTML and computed CSS in compact tagged sections for LLM consumption
- [x] Include Tailwind suggestions and review cues in the exported prompt
- [x] Add copy and download actions for the exported prompt in the results page
- [x] Add unit coverage for the export formatter
- [x] Update README and technical spec to reflect the new export path

## Phase 4: Cross-frame capture and deeper integration coverage

- [ ] Capture same-origin iframe content in the review/export pipeline
- [ ] Add broader Chrome API flow tests around injection, status transitions, and storage updates
- [ ] Break up the large results surface if the next round adds more export formats or review tooling

## Format Decision

- Primary agent handoff: structured `style_capture`
- Embedded source blocks: `html_capture` and `css_capture`
- Secondary review artifact: Tailwind mapping JSON
- Rejected option: HAML
- Format comparison workflow: see `docs/prompt-format-eval-plan.md` and `evals/format-eval.ts`

Why this shape:

- XML-like tags keep the capture compact without paying extra structure cost that the eval did not justify.
- HTML plus CSS keeps the handoff closer to the artifact Claude Code needs to reason about.
- The results page can keep mapping JSON for inspection without exposing raw capture JSON as a user-facing fallback.
- HAML adds translation work without improving fidelity or interoperability.
