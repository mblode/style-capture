# Prompt Format Eval Plan

Execution progress:

- [x] Phase 1: Research current formatter, prompt guidance, and local eval patterns
- [x] Phase 2: Define candidate strategies, fixtures, and graders
- [x] Phase 3: Build the format eval harness and save runnable outputs
- [x] Phase 4: Run the eval, rank strategies, and choose the production format
- [x] Phase 5: Land the smallest formatter change that matches the winning format
- [x] Phase 6: Verify tests, type-checking, and docs

## Goal

Choose the best prompt handoff format for capture exports when the task is:

- recreate or refactor a captured UI faithfully
- treat `html_capture` and `css_capture` as ground truth
- keep Tailwind output helpful without letting it override the capture
- surface ambiguities instead of encouraging invented details

## Research Summary

- The checked-out `style-capture` repo does not contain the `docs/cli` page from the captured sample, so that paragraph is an eval fixture rather than a local page to edit.
- [`/Users/mblode/Code/linktree/linktree-cli/evals/format-eval.ts`](/Users/mblode/Code/linktree/linktree-cli/evals/format-eval.ts) is the local reference pattern for a top-level standalone eval script with saved raw results and a compact summary.
- The shipped formatter already has the right core contract: compact tagged sections, secondary hints, and review notes.
- Token cost alone is not enough to pick a winner for this task. Grounding and implementation safety still need live model scoring.

## Workstreams

### Research team

- [x] Inspect the current formatter and mapper contract
- [x] Inspect the `linktree-cli` eval workflow
- [x] Confirm the captured `docs/cli` sample is external to this repo

### Serializer team

- [x] Extract a reusable prompt payload builder from `src/lib/claude-export.ts`
- [x] Keep the shipped `style_capture` output contract stable
- [x] Change the production formatter only after a winning strategy is clear

### Eval team

- [x] Add a real-capture fixture set plus comparison cases
- [x] Add a runnable `evals/format-eval.ts`
- [x] Add dry-run token reporting
- [x] Save live model-backed summaries to `evals/results/`

### Verification team

- [x] Run unit tests
- [x] Run type-checking
- [x] Run the eval harness in dry-run mode
- [x] Update README, AGENTS, and implementation notes
- [x] Run a live model-backed eval

## Candidate Strategies

- `style_capture`
  Current production control.
- `style_capture_with_url`
  Same compact shape, but with URL grounding in the opening tag.
- `style_capture_data_first`
  Same tags, but data first and instructions last.
- `style_capture_nested`
  Adds explicit XML wrappers for source-of-truth data and hints.
- `markdown_sections`
  Markdown headings plus fenced `html` and `css`.

## Fixtures

- [x] `docs-cli-paragraph`
- [x] `annotated-card`
- [x] `hero-stack`

## Decision Rule

Pick the strategy with the highest weighted quality score unless a lower-token strategy is effectively tied and materially simpler to ship.

Tie-break order:

1. weighted score
2. implementation safety
3. score per token
4. smaller production change

## Current Signal

- Latest live winner by average score: `style_capture`
- Latest live winner by score-per-token: `style_capture`
- Production recommendation: keep the compact `style_capture` format as the shipped output

Latest live summary from `evals/results/format-eval-summary.json`:

- `style_capture`: `avgScore 0.858`, `avgTokens 469`, `scorePerToken 0.001830`
- `style_capture_data_first`: `avgScore 0.853`, `avgTokens 486`, `scorePerToken 0.001753`
- `style_capture_with_url`: `avgScore 0.807`, `avgTokens 478`, `scorePerToken 0.001687`
- `style_capture_nested`: `avgScore 0.799`, `avgTokens 502`, `scorePerToken 0.001591`
- `markdown_sections`: `avgScore 0.630`, `avgTokens 476`, `scorePerToken 0.001325`

Interpretation:

- The compact shipped format still won both average score and score-per-token in the latest live run.
- The instruction-last variant came closer after the rename, but it still lost on both quality and efficiency.
- Adding URL grounding to the opening tag and adding nested wrappers both underperformed the compact control.
- The codebase-ready outcome for this pass is to keep the compact `style_capture` output, retain the reusable prompt payload, and use the harness to test future format changes before shipping them.
