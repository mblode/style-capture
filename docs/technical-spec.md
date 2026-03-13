# Architecture Brief

## Context and Constraints

`Style Capture` is a Chrome extension that captures the computed CSS of a selected DOM subtree, maps it to Tailwind utilities, and copies a Claude-ready markdown prompt to the clipboard. The scaffold prioritizes:

- Manifest V3
- Least-privilege access with `activeTab`
- Vite + React + TypeScript
- shadcn-style extension pages
- Tailwind v4 only inside extension-owned pages
- Local-only processing with no remote upload path
- Zero-click workflow: toolbar icon → pick element → clipboard

## Repo Shape

```text
src/
  background/   MV3 service worker — icon click handler, capture pipeline
  components/   Shared React UI and shadcn-style primitives
  lib/          Types, storage, message contracts, utility helpers
  options/      Settings page
  runtime/      Self-contained injected scripts (picker, toast)
  styles/       Tailwind v4 theme and base styles
```

## Runtime Architecture

### Extension Surfaces

- `options.html`
  Stores default extraction behavior in `chrome.storage.local`.
- `src/background/index.ts`
  Listens for `chrome.action.onClicked`, injects the picker, processes capture results, copies markdown to clipboard, and shows a toast notification.

### Injection Model

The picker is injected on demand with `chrome.scripting.executeScript({ func: runPicker })`.

Why this shape:

- It keeps permissions tight: `activeTab`, `scripting`, `storage`
- It avoids a permanent content script across arbitrary sites
- It works with final rendered DOM and `getComputedStyle()`
- It keeps Tailwind off host pages, preventing Preflight leaks

## Capture Flow

1. User clicks the extension toolbar icon.
2. `chrome.action.onClicked` fires in the background service worker, which loads settings and injects the picker into the active tab.
3. The injected picker mounts a Shadow DOM overlay for highlighting and instructions.
4. Hover updates the target. `Shift` climbs to a parent element. `Alt` descends to the first child. `Escape` cancels.
5. Click captures:
   - sanitized structural `outerHTML`
   - computed longhand styles
   - bounding boxes
   - pseudo-elements when enabled
   - stable node ids plus parent/child relations
6. Background receives the capture, runs Tailwind mapping, formats the Claude markdown export, and injects a clipboard-write script into the active tab.
7. A toast notification confirms the copy via an injected Shadow DOM overlay.

## Data Contract

`CaptureResult` is intentionally stable for downstream mapping.

```ts
interface CaptureResult {
  elements: Record<string, ElementSnapshot>;
  metadata: {
    capturedAt: string;
    title: string;
    url: string;
    userAgent: string;
  };
  order: string[];
  rootElementId: string;
  rootOuterHtml: string;
  settings: CaptureSettings;
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

## Tailwind Mapping Layer

The Tailwind conversion pass is derived from `CaptureResult` and does not mutate the raw capture payload.

`TailwindMappingResult` stores:

- per-element suggested class strings
- per-match confidence scores and mapping strategies
- unsupported or review-required styles

The mapping feeds the Claude export formatter, which packages:

- a task summary block
- capture metadata
- sanitized subtree HTML
- computed CSS grouped by captured element
- Tailwind suggestions plus open questions
- a final request block

Mapping rules prefer:

- semantic Tailwind utilities when the computed value maps cleanly
- scale-based utilities when the value matches Tailwind defaults
- arbitrary values when the property maps cleanly but the value is custom
- arbitrary property utilities when the CSS concept exists but does not fit a stock utility well
- explicit review notes for layout-derived values like computed width, height, insets, and grid tracks

## Security and Data Minimization

- Sensitive form state is stripped from serialized HTML.
- Inline event handler attributes, URL-bearing attributes, and executable/embed-style tags are removed from the sanitized clone.
- Claude export is derived locally from the sanitized payload and never becomes a transport for unsanitized page markup.
- No host permissions are declared persistently.
- No page data is sent off-device.
- Tailwind CSS is not injected into web pages. The picker and toast use isolated inline CSS inside Shadow DOM roots.

## Build and Tooling Decisions

- `@crxjs/vite-plugin`
  Vite-native MV3 bundling and manifest handling.
- `@tailwindcss/vite`
  Tailwind v4 integration for extension pages.
- `Biome + Ultracite`
  Formatting, import hygiene, and stricter consistency rules.
- `vite-plugin-zip-pack`
  Produces a release zip after a successful build.

## Validation Commands

```bash
npm run check-types
npm run lint
npm run check
npm run test
npm run build
```

## Known Gaps

- Theme-token lookup against a project Tailwind config is not implemented yet.
- Cross-frame capture is not implemented yet.
- Closed shadow roots remain inaccessible.
- DOMParser is unavailable in the MV3 service worker, so the Claude export falls back to original CSS selectors instead of `data-live-css-node` annotations when run from the background.

## Sources

- Chrome `activeTab`: https://developer.chrome.com/docs/extensions/develop/concepts/activeTab
- Chrome `chrome.scripting`: https://developer.chrome.com/docs/extensions/reference/api/scripting
- Chrome content scripts and isolated worlds: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
- CRXJS introduction: https://crxjs.dev/guide/introduction/
- shadcn Vite install: https://ui.shadcn.com/docs/installation/vite
- Tailwind Vite install: https://tailwindcss.com/docs/installation/using-vite
- MDN `getComputedStyle()`: https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle
