# Chrome Web Store Publish Plan

## Phase 1: Release Hardening

- [x] Audit the extension for Chrome Web Store policy and review risks.
- [x] Validate the current release build with `npm run test`, `npm run check-types`, and `npm run build`.
- [x] Fix the broken packaged mono font import so the shipped options page does not reference missing assets.
- [x] Confirm the extension stays least-privilege: `activeTab`, `scripting`, `storage`, no persistent host permissions.

## Phase 2: Listing And Compliance Materials

- [x] Draft the store title, short description, long description, single-purpose text, and permission justifications.
- [x] Draft a privacy policy that matches the actual implementation.
- [x] Draft privacy/data-handling notes for the dashboard privacy fields.
- [x] Draft reviewer instructions and testing notes.

## Phase 3: Graphic Assets

- [x] Reuse the existing 128x128 icon from `public/icons/icon-128.png`.
- [x] Create automated render sources for store screenshots.
- [x] Create automated render sources for the small promo tile.
- [x] Create automated render sources for the marquee promo tile.
- [x] Generate the screenshot bundle and promo tiles locally.
- [ ] Verify the generated screenshots against the live extension one final time before upload.

## Phase 4: Automation Surface

- [x] Keep the packaged zip build output in `release/style-capture.zip`.
- [x] Add a local renderer for screenshots and promo tiles.
- [x] Add a Chrome Web Store API publish script with V1 first-item support and V2 existing-item support.
- [x] Add a Done Bear task creation script for manual-only follow-up.
- [x] Publish public fallback support and privacy URLs.
- [x] Create a Google Cloud service account and local key for Chrome Web Store API use.
- [ ] Run the live Chrome Web Store upload/publish flow after publisher access is granted in the dashboard.

## Phase 5: Remaining Manual-Only Work

- [ ] Confirm the Chrome Web Store developer account is registered and protected with 2-Step Verification.
- [ ] Add the service account to the Chrome Web Store publisher and record `CWS_PUBLISHER_ID`.
- [ ] Fill the dashboard Store listing, Privacy practices, Distribution, and test instructions fields using the prepared copy.
- [ ] Submit the first review and monitor the review result.

## Blockers Found In This Session

- [x] `donebear` global CLI is stale, so task creation must use the local source entrypoint.
- [x] Chrome Web Store dashboard access still requires an interactive Google sign-in and publisher onboarding flow.
