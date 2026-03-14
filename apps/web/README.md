# @style-capture/web

Next.js App Router marketing site for `style-capture.blode.co`.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run format:check
npm run check-types
npm run check
```

- `npm run lint` uses `oxlint`
- `npm run format:check` uses `oxfmt --check`
- `npm run check` runs `lint`, `format:check`, and `check-types`

## Notes

- The public marketing routes live under `app/(marketing)`.
- The `/store/*` routes generate Chrome Web Store assets and screenshots.
- Shared UI primitives live in `components/ui`.

Use the root `README.md` for repo-wide commands and workspace context.
