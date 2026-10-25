# Local capture bundles

A bundle keeps the measured component, source evidence and available assets together. It is a static capture for reconstruction and review, not a guarantee that the original application works offline.

## CLI

In a source checkout with dependencies installed:

```sh
node apps/cli/src/cli.ts https://www.framer.com/pricing/ \
  "a[href='https://framer.com/projects/?showUpgrade=true&upgradeTo=proSite2025']" \
  --out captures/framer-pro \
  --viewport 1440x900 --dpr 2 --color-scheme light --surface marketing \
  --state hover,focus-visible
```

After the next CLI release, the same flags are available through `style-capture`. Without `--out`, the existing prompt-on-stdout behavior stays unchanged. Bundle capture defaults to full computed CSS; `--mode curated` remains available. The output directory must not exist. A selector matching several elements captures the first and prints a warning.

The directory contains `capture.json`, `manifest.json`, `prompt.md`, matched `source.css`, a resting-state PNG and static replay HTML, plus asset files. Requested states have their own subdirectories containing CSS, assets, replay and screenshots. The manifest records viewport, device pixel ratio, browser version, source URL, selector, surface and capture time.

Use `marketing`, `app`, `component-demo` or `case-study` for `--surface` to keep evidence from different product surfaces separate. `--color-scheme` changes the browser preference; it does not operate a website's own theme switch. The programmatic `run()` function accepts a `beforeCapture(page)` hook for authorized setup; the manifest records that the hook must be supplied again.

Bundle navigation waits for the document and visible target, then waits up to five seconds for fonts and up to one second for transitions before two paint frames. Persistent video/network traffic does not prevent capture. Font readiness timeouts are recorded as gaps; a missing target still fails.

Fonts include captured files and source face descriptors. Chromium's rendered-font information is retained separately from the declared CSS family stack. A declared font is not proof that it rendered the text. Downloads keep hashes; rewritten SVG files distinguish their original hash. Unavailable resources and dependencies remain explicit gaps.

Forced `hover`, `focus`, `focus-visible` and `active` states measure CSS. They do not invoke an application's JavaScript event handlers. `disabled` is captured only when the selected element is already disabled. State settling is capped at one second; a long or continuously running animation can remain in progress.

Serve the bundle directory locally to inspect replay HTML with its local font and image files. Compare it with the source PNG at the recorded size. Replay fixes the selected element's dimensions and preserves computed styling, but ancestor layout, layered backgrounds, shadow roots, sprite dependencies and application behavior can still differ. The manifest stays `captured-not-verified` until a separate comparison establishes what matches.

## Compare saved snapshots

```sh
node apps/cli/src/cli.ts --verify-bundle captures/framer-pro
```

This starts a temporary server bound to `127.0.0.1`, renders each saved replay at the recorded viewport and pixel ratio, and compares its PNG with the corresponding source crop. It writes timestamped verification JSON and replay PNGs without replacing the original evidence.

The capture uses a native-resolution viewport screenshot and copies the selected integer pixel rectangle without resizing. The full viewport image stays in memory and is not saved in the bundle. This avoids fractional CSS clip rounding and keeps the browser context’s device pixel ratio intact; both the viewport PNG and cropped PNG dimensions are checked against the recorded geometry.

The report contains image dimensions, exact RGBA pixel mismatch counts and ratios, the largest channel difference, image hashes, rendered PostScript font inventories and failed local resource requests. The font comparison covers names and custom/platform identity, not per-glyph positioning. A missing source crop or unknown font inventory remains a gap. Exact pixel differences can include antialiasing or animation timing; the report does not hide them behind a tolerance.

Verification applies only to the saved component snapshots. It does not mark a whole design system, responsive layout or original application as matching.

## Chrome extension

In extension Settings, enable **Download local capture bundle**. Then use the toolbar picker on the page as usual. Clipboard output remains available, and the browser downloads one `style-capture-<timestamp>.json` file.

The JSON contains full computed capture data, static replay HTML and CSS, available font/image bytes as data URLs, hashes, sanitized inline SVG snapshots and a screenshot of the selected element. Assets are fetched in the page context without credentials and are subject to CORS. Up to 50 assets of at most 5 MB each are attempted. Each blocked resource is recorded instead of silently substituted.

The screenshot uses the browser's actual captured pixel scale. It is exported only when the selected element fits entirely in the visible viewport and the source tab is still active. The extension does not gain host, debugger or download permissions: it continues using `activeTab`, `scripting` and `storage`.

Extension capture cannot verify which font actually supplied each glyph. It captures the current viewport and state only; use the CLI for repeatable environment settings, CSS state captures and Chromium font evidence. Inline SVG snapshots retain sanitized geometry, but external sprite references or definitions outside the selected subtree can remain missing.

This extension workflow requires the updated extension build. Repository lint/typechecking does not establish that the Chrome Web Store version has been updated.

## Privacy and limitations

Processing and bundle files stay local. Resource downloads make requests to the original asset hosts; no capture is sent to an AI service. Captured visible text and screenshots can contain page content, so treat captures from private applications accordingly.

Scripts, event handlers and private form values are removed from captured HTML. Replay blocks scripts and remote resources through a content security policy. SVG assets with active content or unsupported external dependencies are refused or recorded as incomplete. These controls do not establish a complete, faithful copy of every page asset.

This release does not export a complete original component library, a shadcn registry package, or a responsive React implementation. Bundles provide the evidence and assets for those downstream tasks.

### Capture identity and populated controls

Replay maps nodes using child-node paths recorded during capture, rather than globally resolving shortened CSS selectors. The extension also records the selected root's path from the document, without adding attributes to the source page. Older extension captures without this identity must be recaptured before downloading a bundle. Full computed captures retain inherited font properties so browser defaults on form controls do not override the captured font.

CLI and extension screenshots are omitted when the selected subtree contains populated text-like inputs, textareas, nonempty selected options, or editable content. The bundle records the omission as a gap; the source DOM is not cleared or changed to obtain a screenshot. A missing source screenshot cannot receive a pixel-match verdict. Ordinary visible page text remains captured, so this safeguard does not make private-page bundles safe to publish.
