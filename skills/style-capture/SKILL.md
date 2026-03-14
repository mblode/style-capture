---
name: style-capture
description: Capture computed CSS and HTML from any web page element, map it to Tailwind utilities, and return a structured prompt for recreating the UI. Use when the user wants to clone, replicate, or reference a live website's design. Triggers include "capture the styles from", "clone this component", "grab the CSS from", "replicate this UI", "copy the design of", or any task where the user describes a visual element on a website they want to recreate.
user-invocable: true
argument-hint: <url> [element description]
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*), Bash(npx @style-capture/cli:*)
---

# Style Capture

Capture computed CSS and HTML from a live web page, map it to Tailwind utilities, and output a structured `<style_capture>` prompt for faithful UI recreation.

## Workflow

Every capture follows this pattern:

1. **Open the page** with agent-browser
2. **Find the target element** using snapshot + the user's natural language description
3. **Get the CSS selector** for the matched element
4. **Run style-capture** with that selector to capture styles and map to Tailwind

### Step 1: Open the page

```bash
agent-browser open <url> && agent-browser wait --load networkidle
```

### Step 2: Find the element

Take an interactive snapshot to see all elements on the page:

```bash
agent-browser snapshot -i
```

Read the snapshot output and identify which `@e` ref matches the user's description (e.g. "the hero section", "the navigation bar", "the pricing card"). Match by tag name, text content, role, or surrounding context.

If the element isn't visible in the snapshot, try:

```bash
# Scroll down to reveal more elements
agent-browser scroll down 500
agent-browser snapshot -i

# Or scope to a section
agent-browser snapshot -i -s "main"
```

If there are too many elements and it's hard to find the right one, use an annotated screenshot for visual identification:

```bash
agent-browser screenshot --annotate
```

### Step 3: Get the CSS selector

Once you've identified the right `@e` ref, extract its HTML to derive a selector:

```bash
agent-browser get html @e<N>
```

From the HTML output, build a CSS selector. Prefer in order:
1. `#id` if the element has an id
2. A unique class combination like `.hero-section`
3. A structural selector like `section:nth-child(2)` or `main > div > h1`

### Step 4: Capture styles

Run the capture CLI with the URL and derived CSS selector:

```bash
npx @style-capture/cli "<url>" "<css-selector>"
```

Options:
- `--mode curated` (default) — common visual CSS properties only
- `--mode full` — all computed styles

## Arguments

`$ARGUMENTS` is parsed as: `<url> [natural language element description]`

- First argument: the URL
- Remaining arguments: natural language description of the target element

Examples:
- `/style-capture https://stripe.com the pricing table`
- `/style-capture https://linear.app the hero section with the gradient`
- `/style-capture https://vercel.com/dashboard the sidebar navigation`

If only a URL is provided, ask the user which element they want to capture.

## Output

The output is a `<style_capture>` XML block containing:
- **html_capture** — sanitized, annotated HTML of the subtree
- **css_capture** — computed CSS grouped by element
- **tailwind_hints** — suggested Tailwind utility classes with confidence scores
- **open_questions** — low-confidence mappings flagged for review

Use this output to faithfully recreate or refactor the captured UI in code.

## Tips

- For complex pages, start with a broader element (e.g. a whole section) rather than individual elements
- Use `--mode full` when you need exact CSS fidelity including all computed properties
- If the element is inside a shadow DOM or iframe, you may need to capture a parent element instead
- After capture, the browser session stays open — you can capture additional elements without reopening
