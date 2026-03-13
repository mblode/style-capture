# Reviewer Notes And Test Instructions

## What The Extension Does

Style Capture lets the user click the toolbar icon, select a DOM subtree on the current page, capture computed CSS plus sanitized HTML, and copy a structured export to the clipboard for UI recreation or Tailwind conversion.

## Fast Review Notes

- Manifest V3 extension
- No persistent host permissions
- No remote code
- No analytics or advertising
- No network transmission in the capture flow
- No account or login required
- No popup by design; the toolbar action injects the picker directly

## Permissions

- `activeTab`: grants temporary access to the current tab only after user action
- `scripting`: injects the picker, clipboard writer, and toast into the current tab
- `storage`: saves user preferences locally

## How To Test

1. Build the extension with `npm run build`.
2. Load the unpacked extension from `dist/` in `chrome://extensions`.
3. Open any normal webpage such as `https://example.com`.
4. Click the Style Capture toolbar icon.
5. Move the pointer across the page and confirm the highlight overlay follows the hovered subtree.
6. Click an element to capture it.
7. Confirm a toast appears and the clipboard contains a structured export starting with `<style_capture`.
8. Open the options page and confirm settings can be changed and persist.

## Expected Keyboard Behavior

- `Escape` cancels the picker
- `Shift` moves the current selection to the parent element
- `Alt` moves the current selection to the first child element

## Data Handling Notes

- Captured page data is handled locally and copied to the clipboard
- The extension stores only settings in `chrome.storage.local`
- The capture payload excludes page URL and page title
- Sanitized exports strip script-like elements, inline handlers, URL-bearing attributes, and some form-state attributes

## Useful Files

- `manifest.config.ts`
- `src/background/index.ts`
- `src/runtime/run-picker.ts`
- `src/runtime/show-toast.ts`
- `src/lib/claude-export.ts`
