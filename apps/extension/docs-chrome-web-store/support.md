# Style Capture Support

Style Capture is a local-only Chrome extension for capturing a selected page subtree, extracting computed CSS, and copying a structured export for Tailwind conversion or UI recreation.

## What The Extension Does

- runs only after you click the toolbar icon
- lets you pick a DOM subtree on the current page
- captures sanitized subtree HTML and computed CSS locally
- copies the formatted result to your clipboard
- stores only capture settings in `chrome.storage.local`

## Common Issues

### The picker does not appear

Make sure you are on a normal webpage. Chrome blocks extension injection on restricted pages such as `chrome://*` pages and the Chrome Web Store.

### Nothing was copied

After you select an element, paste into a text editor to confirm the export. If clipboard write fails on a page, try again on a standard webpage.

### The capture has too much or too little detail

Open the options page and adjust:

- `Capture mode`
- `Pseudo-elements`
- `Hidden elements`

### Why does the extension need these permissions?

- `activeTab`: run only on the tab you explicitly activate
- `scripting`: inject the picker, copy flow, and toast into that tab
- `storage`: save local capture defaults

## When Reporting A Problem

Include:

- Chrome version
- extension version
- the site or app name where the issue happened
- what you expected
- what happened instead

Do not include sensitive captured page content unless you have reviewed and redacted it first.
