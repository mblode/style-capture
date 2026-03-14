<p align="center">
  <img src=".github/assets/logo.png" width="80" height="80" alt="Style Capture logo" />
</p>

<h1 align="center">Style Capture</h1>

<p align="center">Capture computed CSS and sanitized HTML from live pages, map the result to Tailwind, and hand it off to an AI agent or CLI workflow.</p>

## Workspace Layout

- `apps/extension` — Chrome extension that injects the picker, captures a DOM subtree, and copies a `style_capture` handoff.
- `apps/cli` — Playwright-based CLI for capturing the same handoff from a URL and CSS selector.
- `apps/web` — Next.js marketing site for `style-capture.blode.co`.
- `packages/core` — Shared Tailwind mapping and Claude export logic.

## Requirements

- Node.js `22+`
- npm `10+`

## Setup

```bash
npm install
```

## Repo Commands

- `npm run dev` — run workspace dev servers through Turbo
- `npm run build` — build all workspaces that define `build`
- `npm run lint` — run workspace `oxlint` scripts
- `npm run lint:fix` — apply safe Oxlint fixes in each workspace
- `npm run format` — format tracked files with workspace `oxfmt` scripts
- `npm run format:check` — verify Oxfmt formatting
- `npm run check-types` — run workspace type-check scripts
- `npm run test` — run workspace tests
- `npm run check` — run `lint`, `format:check`, `check-types`, and `test`
- `npm run fix` — run `format` and `lint:fix`

Target one workspace:

```bash
npm --workspace @style-capture/extension run lint
npm --workspace @style-capture/web run dev
npm --workspace apps/cli run start -- https://example.com ".hero"
```

## Extension Workflow

1. Run `npm --workspace @style-capture/extension run dev`
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Load `apps/extension/dist` as an unpacked extension

CRXJS handles the local rebuild flow from there.

## CLI Workflow

```bash
npm --workspace apps/cli run build
npm --workspace apps/cli run start -- https://example.com ".hero"
```

The CLI launches Playwright, captures the matching element subtree, maps the computed styles to Tailwind utilities, and prints a structured `style_capture` export.

## Privacy

All capture, mapping, and export steps happen locally. The repo does not send captured page data to a remote service.

## License

[MIT](LICENSE.md)
