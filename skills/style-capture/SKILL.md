---
name: style-capture
description: Capture computed CSS and HTML from any web page element, map it to Tailwind utilities, and return a structured prompt for recreating the UI. Use when the user wants to clone, replicate, or reference a live website's design.
user-invocable: true
argument-hint: <url> <css-selector> [--mode curated|full]
allowed-tools: Bash(npx *)
---

# Style Capture

Capture the computed CSS and HTML of a DOM element from a live URL, map it to Tailwind utilities, and output a structured `style_capture` prompt.

## Usage

Run the capture CLI with the provided arguments:

```bash
npx @style-capture/cli $ARGUMENTS
```

If no arguments were provided, ask the user for:
1. **URL** — the page to capture from
2. **CSS selector** — the element to target (e.g. `main`, `.hero`, `#app`, `nav > ul`)

Then run:

```bash
npx @style-capture/cli "<url>" "<selector>"
```

## Options

- `--mode curated` (default) — capture only common visual CSS properties
- `--mode full` — capture all computed styles

## Output

The output is a `<style_capture>` XML block containing:
- **html_capture** — sanitized, annotated HTML of the subtree
- **css_capture** — computed CSS grouped by element
- **tailwind_hints** — suggested Tailwind utility classes
- **open_questions** — low-confidence mappings flagged for review

Use this output to faithfully recreate or refactor the captured UI in code.
