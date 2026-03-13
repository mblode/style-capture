# Chrome Web Store Launch Plan

This checklist matches the current extension behavior: user-triggered capture of a selected DOM subtree, local formatting, clipboard copy, and settings stored in `chrome.storage.local`.

## Phase 1: Package Readiness

- [x] Run `npm run check-types`
- [x] Run `npm run test`
- [x] Run `npm run build` to generate `dist/` and `release/style-capture.zip`
- [x] Confirm the manifest still requests only `activeTab`, `scripting`, and `storage`
- [x] Prepare submission copy in `docs/chrome-web-store/`

## Phase 2: Listing Assets

- [x] Draft the store listing in `listing.md`
- [x] Draft the privacy policy in `privacy-policy.md`
- [x] Draft the support page in `support.md`
- [x] Capture 3 to 5 screenshots that show the real user flow on a normal webpage
- [x] Publish public URLs for the privacy policy and support page

## Phase 3: Chrome Web Store Dashboard

- [ ] Confirm the Chrome Web Store developer account is registered and ready to submit
- [ ] Create the store item or open the existing draft
- [ ] Upload `release/style-capture.zip`
- [ ] Paste the short and detailed descriptions from `listing.md`
- [ ] Upload the final screenshots and icon assets
- [ ] Complete the Privacy tab using `listing.md`
- [ ] Add the reviewer notes from `listing.md`

## Phase 4: Final Validation And Submission

- [ ] Test the uploaded draft in Chrome
- [ ] Verify capture works on a normal webpage and the output pastes correctly
- [ ] Verify the options page saves settings to `chrome.storage.local`
- [ ] Reconfirm there is no remote upload, analytics, or advertising behavior
- [ ] Submit for review
- [ ] Monitor review feedback and respond if Google requests clarification

## Manual-Only Items

- [ ] Chrome Web Store account signup, billing, and publisher setup
- [ ] Adding the service account to the publisher and recording the publisher ID
- [ ] Completing dashboard-only listing and privacy fields
- [ ] Final submission click in the Chrome Web Store dashboard
