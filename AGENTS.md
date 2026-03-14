# style-capture

Turborepo monorepo with three apps and a shared package:

- **`apps/extension/`** — Chrome extension that captures computed CSS from a selected DOM subtree for Tailwind conversion. Manifest V3, React 19, Vite 8, TypeScript 5.9.
- **`apps/cli/`** — CLI tool for capturing computed CSS and HTML from web pages, mapping to Tailwind utilities.
- **`apps/web/`** — Next.js marketing site deployed to `style-capture.blode.co`.
- **`packages/core/`** — Shared core logic (Tailwind mapper, Claude export) used by both the extension and CLI.

## Commands

Setup:

- Use Node.js `22+`
- Run `npm install` at the repo root

Root commands:

- `npm run dev` — Run all apps in dev mode
- `npm run build` — Build all apps
- `npm run lint` — Run workspace `oxlint` scripts
- `npm run lint:fix` — Apply safe Oxlint fixes
- `npm run format` — Run workspace `oxfmt --write`
- `npm run format:check` — Run workspace `oxfmt --check`
- `npm run check-types` — Run workspace type-check scripts
- `npm run test` — Run tests across workspaces that define them
- `npm run check` — Run `lint`, `format:check`, `check-types`, and `test`
- `npm run fix` — Run `format` and `lint:fix`

Filter to a single app:

- `npx turbo run build --filter=@style-capture/extension`
- `npx turbo run dev --filter=@style-capture/web`

Extension-specific (run from `apps/extension/`):

- `npm run eval:format` — Compare capture prompt formats
- `npm run store:publish` — Publish to Chrome Web Store

## Loading the extension

After `npm --workspace @style-capture/extension run dev`, load `apps/extension/dist/` as an unpacked extension at `chrome://extensions` with Developer mode enabled. CRXJS handles HMR from there.

## Gotchas

- **Tailwind isolation:** Tailwind CSS runs only inside extension pages (options). The injected picker and toast use isolated inline styles — NEVER import Tailwind or Preflight into `apps/extension/src/runtime/` files, or it will leak into the host page.
- **`chrome` global:** Tests mock `chrome.*` APIs in `vitest.setup.ts` — check that file before adding new Chrome API calls in tests.
- **Path alias:** `@` maps to `./src` in both apps. Use `@/lib/foo` not `../../../lib/foo`.
- **Test environment:** Vitest uses `jsdom` with setup in `apps/extension/vitest.setup.ts`. Tests live next to source as `*.test.ts`.
- **No popup:** The extension has no popup — clicking the icon triggers `chrome.action.onClicked` which injects the picker directly. Do not add `default_popup` to the manifest.
- **Runtime scripts must be self-contained:** `apps/extension/src/runtime/run-picker.ts` and `apps/extension/src/runtime/show-toast.ts` are injected via `chrome.scripting.executeScript`. They cannot import modules at runtime — all code must be inlined in the function body.
- **DOMParser unavailable in service worker:** `apps/extension/src/lib/claude-export.ts` guards against missing `DOMParser` (MV3 service workers lack DOM APIs). It falls back to original CSS selectors instead of `data-lc` annotations.
- **Lint and format tooling:** Use `oxlint` and `oxfmt`. Generated output is ignored centrally via `.oxlintrc.json` and `.gitignore`; do not add ad hoc Biome config.
- **Repo gate:** `npm run check` is the repo-level validation command. It chains lint, format check, type-checking, and tests instead of relying on Ultracite alone.
- **Format evals:** `apps/extension/evals/format-eval.ts` uses `OPENAI_API_KEY` for live runs and supports `--dry-run` for token/count previews when model calls are unavailable.
- **Workspace dependencies:** App dependencies go in each app's `package.json`, not root. Root only has turbo, ultracite, lefthook, @changesets/cli, portless.
- **Vercel native bindings:** `apps/web/package.json` lists Linux native bindings (`@tailwindcss/oxide-linux-x64-gnu`, `@rolldown/binding-linux-x64-gnu`, `lightningcss-linux-x64-gnu`) in `optionalDependencies` so Vercel (Linux) can resolve platform-specific packages from the macOS-generated lockfile.

## Conventions

- Extension permissions are least-privilege: `activeTab`, `scripting`, `storage`. Do not add host permissions.
- Manifest is defined in `apps/extension/manifest.config.ts` (not a static JSON file).
- UI components follow shadcn patterns with `class-variance-authority` and `tailwind-merge`.
- All extension storage goes through helpers in `apps/extension/src/lib/storage.ts`.
- Web app uses `blode-icons-react` (not `lucide-react`) for icons.

## References

- @docs/technical-spec.md
