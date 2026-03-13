# Style Capture

Chrome extension that captures computed CSS from a selected DOM subtree and prepares it for Tailwind conversion.

## Stack

- Chrome Extension (Manifest V3)
- Vite 8 + [CRXJS](https://crxjs.dev/vite-plugin/) for HMR
- React 19 + TypeScript 5.9
- Tailwind CSS v4 (extension pages only)
- shadcn-style UI primitives
- Biome + Ultracite

## Getting Started

```bash
npm install
npm run dev
```

1. Open `chrome://extensions` and enable **Developer mode**
2. Click **Load unpacked** and select the `dist/` directory
3. Click the Style Capture toolbar icon to start picking on the active tab

## Usage

1. Click the toolbar icon on the page you want to inspect
2. Hover over elements on the active tab while the picker highlights the DOM subtree
3. Click to capture the computed CSS
4. Paste the copied Claude-ready markdown export into Claude Code or another agent

The extension uses `activeTab` and `chrome.scripting.executeScript()` so it requires no persistent host permissions.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with CRXJS HMR |
| `npm run build` | Type-check and build to `dist/` |
| `npm run check-types` | TypeScript type-check only |
| `npm run lint` | Biome check (read-only) |
| `npm run lint:fix` | Biome auto-fix |
| `npm run check` | Ultracite full check (stricter) |
| `npm run fix` | Ultracite auto-fix |
| `npm run test` | Run Vitest unit tests |
| `npm run test:watch` | Vitest watch mode |

## Project Structure

```
src/
  background/   Service worker and message routing
  components/   Shared UI primitives and page shell
  lib/          Types, messages, storage, utilities
  options/      Options page
  runtime/      Injected picker bootstrap
  styles/       Tailwind v4 theme and base styles
```

## Architecture

- The picker is injected on demand via `chrome.scripting.executeScript()` — no persistent content scripts
- Tailwind CSS runs only inside extension pages; the picker uses isolated inline styles to avoid Preflight leaks
- Extension manifest is defined programmatically in `manifest.config.ts`
- Captures are copied to the clipboard immediately as structured markdown with HTML, CSS, and Tailwind hints
- See `docs/technical-spec.md` and `docs/implementation-plan.md` for architecture details and phased execution status

## License

Private
