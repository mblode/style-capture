# style-capture

Chrome extension that captures computed CSS from a selected DOM subtree for Tailwind conversion. Click the toolbar icon to start picking — results are copied to clipboard automatically. Manifest V3, React 19, Vite 8, TypeScript 5.9.

## Commands

- `npm run dev` — Start Vite dev server with CRXJS HMR
- `npm run build` — Type-check then build to `dist/`
- `npm run check-types` — TypeScript type-check only
- `npm run lint` — Biome check (read-only)
- `npm run lint:fix` — Biome auto-fix
- `npm run check` — Ultracite full check (stricter than `lint`)
- `npm run fix` — Ultracite auto-fix
- `npm run test` — Vitest unit tests (single run)
- `npm run test:watch` — Vitest watch mode

## Loading the extension

After `npm run dev`, load `dist/` as an unpacked extension at `chrome://extensions` with Developer mode enabled. CRXJS handles HMR from there.

## Gotchas

- **Tailwind isolation:** Tailwind CSS runs only inside extension pages (options). The injected picker and toast use isolated inline styles — NEVER import Tailwind or Preflight into `src/runtime/` files, or it will leak into the host page.
- **`chrome` global:** Declared in `biome.jsonc` globals. Tests mock `chrome.*` APIs in `vitest.setup.ts` — check that file before adding new Chrome API calls in tests.
- **Path alias:** `@` maps to `./src` (configured in `vite.config.ts`, `vitest.config.ts`, and `tsconfig.app.json`). Use `@/lib/foo` not `../../../lib/foo`.
- **Test environment:** Vitest uses `jsdom` with setup in `vitest.setup.ts`. Tests live next to source as `*.test.ts`.
- **No popup:** The extension has no popup — clicking the icon triggers `chrome.action.onClicked` which injects the picker directly. Do not add `default_popup` to the manifest.
- **Runtime scripts must be self-contained:** `src/runtime/run-picker.ts` and `src/runtime/show-toast.ts` are injected via `chrome.scripting.executeScript`. They cannot import modules at runtime — all code must be inlined in the function body.
- **DOMParser unavailable in service worker:** `src/lib/claude-export.ts` guards against missing `DOMParser` (MV3 service workers lack DOM APIs). It falls back to original CSS selectors instead of `data-live-css-node` annotations.
- **Lint pipeline:** `npm run check` (Ultracite) is the strictest gate — it runs Biome + TypeScript. Use `npm run fix` to auto-fix. Pre-commit hook runs `ultracite fix` via lint-staged.

## Conventions

- Extension permissions are least-privilege: `activeTab`, `scripting`, `storage`. Do not add host permissions.
- Manifest is defined in `manifest.config.ts` (not a static JSON file).
- UI components follow shadcn patterns with `class-variance-authority` and `tailwind-merge`.
- All extension storage goes through helpers in `src/lib/storage.ts`.

## References

- @docs/technical-spec.md
