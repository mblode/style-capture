# style-capture

Turborepo monorepo with two apps:

- **`apps/extension/`** — Chrome extension that captures computed CSS from a selected DOM subtree for Tailwind conversion. Manifest V3, React 19, Vite 8, TypeScript 5.9.
- **`apps/web/`** — Next.js marketing site deployed to `style-capture.blode.co`.

## Commands

Root commands (turbo-orchestrated):

- `npm run dev` — Run all apps in dev mode
- `npm run build` — Build all apps
- `npm run check-types` — TypeScript type-check all apps
- `npm run lint` — Biome check all apps
- `npm run test` — Run tests across all apps
- `npm run check` — Ultracite full check
- `npm run fix` — Ultracite auto-fix

Filter to a single app:

- `npx turbo run build --filter=@style-capture/extension`
- `npx turbo run dev --filter=@style-capture/web`

Extension-specific (run from `apps/extension/`):

- `npm run eval:format` — Compare capture prompt formats
- `npm run store:publish` — Publish to Chrome Web Store

## Loading the extension

After `npm run dev`, load `apps/extension/dist/` as an unpacked extension at `chrome://extensions` with Developer mode enabled. CRXJS handles HMR from there.

## Gotchas

- **Tailwind isolation:** Tailwind CSS runs only inside extension pages (options). The injected picker and toast use isolated inline styles — NEVER import Tailwind or Preflight into `apps/extension/src/runtime/` files, or it will leak into the host page.
- **`chrome` global:** Declared in `apps/extension/biome.jsonc` globals. Tests mock `chrome.*` APIs in `vitest.setup.ts` — check that file before adding new Chrome API calls in tests.
- **Path alias:** `@` maps to `./src` in both apps. Use `@/lib/foo` not `../../../lib/foo`.
- **Test environment:** Vitest uses `jsdom` with setup in `apps/extension/vitest.setup.ts`. Tests live next to source as `*.test.ts`.
- **No popup:** The extension has no popup — clicking the icon triggers `chrome.action.onClicked` which injects the picker directly. Do not add `default_popup` to the manifest.
- **Runtime scripts must be self-contained:** `apps/extension/src/runtime/run-picker.ts` and `apps/extension/src/runtime/show-toast.ts` are injected via `chrome.scripting.executeScript`. They cannot import modules at runtime — all code must be inlined in the function body.
- **DOMParser unavailable in service worker:** `apps/extension/src/lib/claude-export.ts` guards against missing `DOMParser` (MV3 service workers lack DOM APIs). It falls back to original CSS selectors instead of `data-lc` annotations.
- **Lint pipeline:** `npm run check` (Ultracite) is the strictest gate — it runs Biome + TypeScript. Use `npm run fix` to auto-fix. Pre-commit hook runs `ultracite fix` via lint-staged.
- **Format evals:** `apps/extension/evals/format-eval.ts` uses `OPENAI_API_KEY` for live runs and supports `--dry-run` for token/count previews when model calls are unavailable.
- **Workspace dependencies:** App dependencies go in each app's `package.json`, not root. Root only has turbo, ultracite, husky, lint-staged.
- **Vercel install:** `vercel.json` deletes `package-lock.json` before install because npm lockfiles are platform-specific for optional native deps (lightningcss, rolldown). Without this, Vercel (Linux) fails to find macOS-only binaries baked into the lockfile.

## Conventions

- Extension permissions are least-privilege: `activeTab`, `scripting`, `storage`. Do not add host permissions.
- Manifest is defined in `apps/extension/manifest.config.ts` (not a static JSON file).
- UI components follow shadcn patterns with `class-variance-authority` and `tailwind-merge`.
- All extension storage goes through helpers in `apps/extension/src/lib/storage.ts`.
- Web app uses `blode-icons-react` (not `lucide-react`) for icons.

## References

- @docs/technical-spec.md
