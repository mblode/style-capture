# Style Capture Privacy Policy

Last updated: 2026-03-14

Style Capture is a Chrome extension that runs only when you click the toolbar icon on a webpage. It lets you select a DOM subtree, captures that subtree's sanitized HTML and computed CSS locally, formats the result as a structured prompt, and copies it to your clipboard.

## Information The Extension Handles

Style Capture handles only the data needed for that local workflow:

- selected page content from the subtree you choose
- computed CSS for the captured elements
- pseudo-element styles if you enable that option
- local extension settings stored in `chrome.storage.local`

Style Capture includes the current page URL in the local capture payload so the copied prompt stays grounded to its source page.

## How The Information Is Used

Style Capture uses this information only to:

- build the capture you requested
- format the structured export
- copy the export to your clipboard
- remember your local capture settings

## Data Sharing

Style Capture does not send captured content, clipboard output, or settings to the developer or to third parties.

Style Capture does not sell data, run analytics, serve ads, or use data for any purpose unrelated to the extension's single purpose.

## Data Retention

- Settings remain in `chrome.storage.local` until you change them, clear browser data, or uninstall the extension.
- Capture data is processed locally for the current action. The developer does not receive or retain it.
- Any copied export remains only wherever you choose to paste it.

## User Control

- You decide when the extension runs by clicking the toolbar icon.
- You decide which subtree gets captured.
- You can change capture settings or uninstall the extension at any time.

## Support

Use the public support URL listed in the Chrome Web Store entry for help with the extension.
