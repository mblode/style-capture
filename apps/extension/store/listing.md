# Store Listing Draft

## Product Name

Style Capture

## Short Description

Capture a selected page subtree, extract computed CSS, and copy a Claude-ready markdown prompt for Tailwind conversion.

## Suggested Category

Developer Tools

## Suggested Language

English

## Single Purpose Description

Capture computed CSS from a user-selected DOM subtree and turn it into a structured prompt for UI recreation or Tailwind conversion.

## Detailed Description

Style Capture helps you inspect a live webpage and export a clean, structured capture for UI recreation or Tailwind conversion.

How it works:

1. Click the toolbar icon on a normal webpage.
2. Hover and choose the DOM subtree you want.
3. The extension captures sanitized subtree HTML and computed CSS locally.
4. It formats the result as markdown and copies it to your clipboard.

Style Capture is local-only by design. It has no account system, no analytics, no ads, and no remote upload path. It uses `activeTab` instead of persistent host permissions, so it runs only on the page you explicitly activate.

The options page stores only capture preferences in `chrome.storage.local`:

- capture mode: `curated` or `full`
- include pseudo-elements
- include hidden elements

## Permission Justifications

### `activeTab`

Used only after the user clicks the extension action so Style Capture can inspect the current page without requesting persistent host access.

### `scripting`

Used to inject the picker overlay, clipboard writer, and toast UI into the active tab at runtime after user action.

### `storage`

Used to save local capture preferences such as capture mode and whether pseudo-elements or hidden elements should be included.

## Privacy Tab Answers

### Data handled

- Website content: `Yes`
  The extension reads the user-selected subtree's sanitized HTML and computed CSS after an explicit capture action.
- Page URL: `No`
- Page title: `No`
- User settings or preferences: `Yes`
  The options page stores capture defaults in `chrome.storage.local`.
- Personal communications: `No`
- Location: `No`
- Web history: `No`
- Health information: `No`
- Financial and payment information: `No`
- Authentication information: `No`
- Personal contacts: `No`

### Data use

- User-facing functionality: `Yes`
- Authentication: `No`
- Analytics: `No`
- Advertising: `No`
- Creditworthiness or lending: `No`

### Data practices

- Collected only after a user action: `Yes`
- Transmitted to the developer or third parties: `No`
- Sold: `No`
- Used for purposes unrelated to the extension's single purpose: `No`
- Used for personalized ads: `No`

### Retention

- Settings remain in `chrome.storage.local` until the user changes them, clears browser data, or uninstalls the extension.
- Capture data is processed locally for the requested action and copied to the clipboard. The developer does not receive or retain it.

## Reviewer Notes

- Single purpose: user-initiated capture of selected page HTML and computed CSS for local export into a Tailwind or UI-recreation workflow.
- No popup: clicking the toolbar icon injects the picker directly into the active page.
- No remote services: the extension does not send captured data, settings, or telemetry to any backend.
- Sanitization: serialized HTML strips inline event handlers, URL-bearing attributes, executable or embed-style elements, and textarea contents before export.
- Restricted pages: Chrome blocks injection on pages such as `chrome://*` and the Chrome Web Store itself.

## Reviewer Test Steps

1. Open any normal webpage.
2. Click the Style Capture toolbar icon.
3. Hover and click an element or subtree.
4. Paste into a text editor to verify a markdown export was copied.
5. Open the options page and change capture defaults.

## Public URLs

- Support URL: `https://gist.github.com/mblode/bcd5ea9bf89ad112d9d91869ca273da3`
- Privacy Policy URL: `https://gist.github.com/mblode/e2c46c69ac5828d9b11a48c8ed8a3ab0`
