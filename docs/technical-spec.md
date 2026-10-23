# Technical Reference

## Monorepo Shape

```text
apps/
  extension/   MV3 Chrome extension and injected picker runtime
  cli/         Playwright-based capture CLI
  web/         Next.js marketing site
packages/
  core/        Shared capture/export/mapping logic
```

`Style Capture` has two capture entry points:

- the extension captures the currently active tab through `chrome.scripting.executeScript`
- the CLI captures a URL and selector through Playwright

Both flows converge on the same shared export path in `packages/core`.

## Workspace Responsibilities

### `apps/extension`

- Owns the MV3 service worker, injected picker, options page, and Chrome Web Store assets
- Captures computed CSS from a selected DOM subtree
- Stores settings in `chrome.storage.local`
- Copies the final `style_capture` handoff through an injected clipboard writer

### `apps/cli`

- Launches Playwright against a target URL
- Resolves a CSS selector to a single element subtree
- Produces the same `style_capture` export shape as the extension

### `apps/web`

- Hosts the marketing site for `style-capture.blode.co`
- Includes `/store/*` routes used to generate Chrome Web Store assets and screenshots

### `packages/core`

- Defines shared capture types
- Maps computed CSS to Tailwind utilities
- Formats the Claude-facing `style_capture` export

## Extension Runtime Architecture

The extension injects the picker on demand with `chrome.scripting.executeScript({ func: runPicker })`.

Why this shape:

- Keeps permissions tight: `activeTab`, `scripting`, `storage`
- Avoids a permanent content script on arbitrary sites
- Works against the final rendered DOM and `getComputedStyle()`
- Keeps Tailwind out of host pages, which avoids Preflight leaks

Primary extension surfaces:

- `src/background/index.ts` — icon click handling, capture orchestration, clipboard handoff
- `src/runtime/run-picker.ts` — self-contained injected picker and DOM capture logic
- `src/runtime/show-toast.ts` — self-contained injected success/error toast
- `src/options/` — extension-owned settings UI

## Shared Capture Contract

`CaptureResult` is the stable handoff between capture, mapping, and export.

```ts
interface CaptureResult {
  elements: Record<string, ElementSnapshot>;
  metadata: {
    url: string;
    capturedAt?: string;
    title?: string;
    userAgent?: string;
  };
  order: string[];
  rootElementId: string;
  rootOuterHtml: string;
  settings: CaptureSettings;
  states?: Partial<Record<CaptureState, StateCaptureResult>>;
  summary: {
    elementCount: number;
    pseudoElementCount: number;
  };
  version: 1;
}
```

`ElementSnapshot` stores:

- `id`
- `parentId`
- `children`
- `tagName`
- `classList`
- `selector`
- safe HTML attributes
- `boundingBox`
- `styles`
- `pseudo.before` / `pseudo.after`

## State Capture

`states` is an optional, additive field; `version` stays `1` and consumers that ignore it are unaffected. `elements` is always the resting capture.

```ts
type CaptureState = "hover" | "focus" | "focus-visible" | "active" | "disabled";
type StateCaptureResult =
  | { applicable: true; styles: Record<string, Record<string, string>> } // by element id
  | { applicable: false; reason: string };
```

The CLI produces it with `--state` (repeatable or comma list; `all` is hover, focus-visible and active) and `--state-scope element|subtree` (default `element`):

- It opens a CDP session and calls `CSS.forcePseudoState` on the matched element (and its descendants for `subtree`), so no mouse or keyboard is involved.
- It waits for the longest computed `transition-duration` plus `transition-delay` (capped at 1s) and two animation frames, then runs the same snapshot code as the resting capture. The state is cleared and settled again before the next one.
- State styles are matched to resting elements by `selector`, so an element that appears only in a state is ignored.
- State captures add `outline-color`, `outline-offset`, `outline-style` and `outline-width` to the curated property set (resting capture too, but only when `--state` is used), because focus rings live there.
- `disabled` is not forced: it reads the element as-is when it has `disabled` or `aria-disabled="true"`, and is `applicable: false` otherwise.

`diffStateStyles` in `packages/core` returns the properties that differ from the resting capture per element, `{ before, after }`, where a property missing on one side shows as `(default)`. The export adds, after `tailwind_hints` and `open_questions`:

```text
<states>
<state name="hover">
<css_capture>#cta{background-color:rgb(0, 0, 200);...}</css_capture>
<state_diff>
0 background-color:rgb(0, 0, 255)->rgb(0, 0, 200);transform:(default)->matrix(1.05, 0, 0, 1.05, 0, 0)
</state_diff>
</state>
<state name="disabled" applicable="false">not applicable: element is not disabled</state>
</states>
```

Diff lines start with the element's compact ref (the `data-lc` value in `html_capture`).

## Tailwind Mapping and Export

The mapping pass derives `TailwindMappingResult` from `CaptureResult` without mutating the raw payload.

The Claude export formatter packages:

- a top-level `style_capture` block
- sanitized subtree HTML
- computed CSS grouped by captured element
- Tailwind suggestions
- open questions where the capture is ambiguous

Mapping rules prefer:

- semantic Tailwind utilities when the computed value maps cleanly
- scale-based utilities when the value matches Tailwind defaults
- arbitrary values when the property maps cleanly but the value is custom
- explicit review notes for layout-derived values such as width, height, insets, and grid tracks

## Security and Data Minimization

- Sensitive form state is stripped from serialized HTML
- Inline event handlers, URL-bearing attributes, and executable/embed-style tags are removed from the sanitized clone
- No host permissions are declared persistently
- No page data is uploaded by the repo
- Tailwind CSS is not injected into host pages

## Tooling

- Turbo orchestrates workspace scripts from the repo root
- `oxlint` is the repo linter
- `oxfmt` is the repo formatter
- `npm run check` chains `lint`, `format:check`, `check-types`, and `test`
- Generated outputs are ignored centrally through `.oxlintrc.json` and `.gitignore`

## Validation Commands

Repo-wide:

```bash
npm run lint
npm run format:check
npm run check-types
npm run test
npm run check
npm run build
```

Workspace-targeted:

```bash
npm --workspace @style-capture/extension run check
npm --workspace @style-capture/web run check
npm --workspace apps/cli run check
```

## Known Gaps

- Theme-token lookup against a project Tailwind config is not implemented yet
- Cross-frame capture is not implemented yet
- Closed shadow roots remain inaccessible
- DOMParser is unavailable in the MV3 service worker, so the Claude export falls back to original CSS selectors instead of `data-lc` annotations when it runs from the background

## Sources

- Chrome `activeTab`: https://developer.chrome.com/docs/extensions/develop/concepts/activeTab
- Chrome `chrome.scripting`: https://developer.chrome.com/docs/extensions/reference/api/scripting
- Chrome content scripts and isolated worlds: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
- CRXJS introduction: https://crxjs.dev/guide/introduction/
- Tailwind Vite install: https://tailwindcss.com/docs/installation/using-vite
- MDN `getComputedStyle()`: https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle
