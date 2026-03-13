# Chrome Web Store Release Workspace

This directory contains the publish materials for `Style Capture`.

Canonical human-edited submission copy lives in `docs/chrome-web-store/`.
This `store/` directory keeps the automation inputs and public-facing assets
that support the submission flow.

## Files

- `publish-plan.md` — phased checklist with completed and remaining work
- `listing.md` — store copy, single-purpose text, and permission justifications
- `data-disclosure.md` — privacy tab guidance based on the current implementation
- `privacy-policy.md` — markdown privacy policy source
- `privacy-policy.html` — hostable privacy policy page
- `site/` — GitHub Pages-ready support and privacy site
- `review-notes.md` — reviewer and tester instructions
- `manual-tasks.json` — manual-only handoff tasks for Done Bear or another task tool
- `renderables/` — HTML/CSS source for screenshots and promo tiles
- `generated/` — rendered PNG assets

## Scripts

- `node scripts/render-store-assets.mjs`
  Renders screenshots and promo tiles using local Chrome headless.
- `npm run store:screenshots`
  Captures live extension screenshots from the local demo page with Playwright + Chrome.
- `node scripts/chrome-web-store-publish.mjs --help`
  Uploads and publishes through the Chrome Web Store API when credentials are available.
- `node scripts/create-donebear-cws-tasks.mjs --help`
  Tries to create the remaining manual tasks in Done Bear using the local CLI source.

## Workflows

- `.github/workflows/store-site.yml`
  Publishes `store/site/` to GitHub Pages on `main`.
- `.github/workflows/chrome-web-store-release.yml`
  Builds the extension and runs the Chrome Web Store publish script with GitHub secrets.

## Notes

- The screenshot and tile renders are generated locally and should be visually verified before upload.
- Public HTTPS fallbacks already exist as gists for the support and privacy URLs. The `site/` build can replace them later if a first-party URL is preferred.
- The first publish still requires the dashboard listing/privacy fields to be completed and the publisher account to grant Chrome Web Store API access.
