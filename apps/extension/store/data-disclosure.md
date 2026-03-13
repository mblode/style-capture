# Privacy Practices Guidance

This file is for the Chrome Web Store Privacy practices tab.

## Core Facts

- The extension handles selected website content as part of its user-facing feature.
- Handling is local-only inside the browser extension.
- The extension does not send captured page data to the developer or any third party.
- The extension does not include analytics, ads, tracking, accounts, or remote code execution.
- The extension stores only user settings in `chrome.storage.local`.
- Captured page data is processed transiently in memory and copied to the system clipboard.

## What The Extension Handles

- Selected subtree HTML after sanitization
- Computed CSS for the selected DOM subtree
- Pseudo-element styles if enabled
- Local capture settings chosen by the user

## What The Extension Strips Or Avoids

- No persistent host permissions
- No background scraping without user action
- No inline event handlers in the exported HTML
- No script, style, iframe, object, or template tags in the sanitized export
- No `href`, `src`, `srcset`, `poster`, `action`, `formaction`, or similar URL-bearing attributes in the sanitized export
- No form state values such as `value`, `checked`, or `selected` in sanitized attributes

## Dashboard Privacy Tab Suggested Answers

### Single purpose

Capture computed CSS from a user-selected DOM subtree and turn it into a structured prompt for UI recreation or Tailwind conversion.

### Permission justifications

Use the text from `listing.md`.

### Remote code

Select `No, I am not using remote code.`

### Data use certifications

Use statements consistent with these facts:

- Website content and current page context are handled only to deliver the explicit capture feature the user requests.
- Data is not sold.
- Data is not used or transferred for unrelated advertising or profiling.
- Data is not used to determine creditworthiness or for lending purposes.
- Data is not transmitted off-device by the extension.

## Important Policy Notes

Because the extension captures selected page content from the active tab, it still falls under Chrome Web Store guidance for products that handle website content or resources. Even local-only handling requires a privacy policy.
