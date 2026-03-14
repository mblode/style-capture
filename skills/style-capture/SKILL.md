---
name: style-capture
description: Capture computed CSS and HTML from any web page element, map it to Tailwind utilities, and return a structured prompt for recreating the UI. Use when the user wants to clone, replicate, or reference a live website's design. Triggers include "capture the styles from", "clone this component", "grab the CSS from", "replicate this UI", "copy the design of", or any task where the user describes a visual element on a website they want to recreate.
user-invocable: true
argument-hint: <url> [element description]
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*), Bash(npx style-capture:*)
---

# Style Capture

Capture computed CSS and HTML from a live web page, map it to Tailwind utilities, and output a structured `<style_capture>` prompt for faithful UI recreation.

## Workflow

**Browser tool:** Always use the `agent-browser` CLI for all browser interactions. Never use Chrome MCP, "Claude in Chrome", or any other browser automation tool.

Every capture follows this pattern:

```text
Capture progress:
- [ ] Step 1: Open the page
- [ ] Step 2: Find the target element
- [ ] Step 3: Get the CSS selector
- [ ] Step 4: Capture styles
```

### Step 1: Open the page

```bash
agent-browser open <url> && agent-browser wait --load networkidle
```

### Step 2: Find the element

Use `agent-browser eval` to locate the element by the user's description and return its parent container's selector. This is the most reliable approach — it runs JavaScript directly in the page:

```bash
agent-browser eval "(() => {
  const el = Array.from(document.querySelectorAll('h2, h1, section, [class]'))
    .find(el => el.textContent.includes('TARGET TEXT'));
  if (!el) return null;
  // Walk up to the nearest section/container
  const container = el.closest('section') || el.parentElement;
  return {
    tag: container.tagName,
    id: container.id,
    classes: container.className,
    selector: container.id ? '#' + container.id : container.tagName.toLowerCase() + '.' + container.className.split(' ')[0]
  };
})()"
```

If the text-based approach doesn't work, fall back to the snapshot:

```bash
agent-browser snapshot -i
```

Read the snapshot output and identify which `@e` ref matches the user's description. Match by tag name, text content, role, or surrounding context.

If the element isn't visible in the snapshot, scroll to it or scope the snapshot:

```bash
agent-browser scrollintoview @e<N>
agent-browser snapshot -i -s "main"
```

For visual identification when there are too many elements:

```bash
agent-browser screenshot --annotate
```

### Step 3: Get the CSS selector

Once you've identified the element (via eval result or `@e` ref), get its HTML:

```bash
agent-browser get html @e<N>
# or for a known selector:
agent-browser get html "section.ClassName"
```

Build a CSS selector. Prefer in order:

1. `#id` if the element has an id
2. A unique class combination like `.hero-section` or `section.CTA_prefooter__abc`
3. A structural selector like `section:nth-child(2)` or `main > div > h1`

### Step 4: Capture styles

Run the capture CLI with the URL and derived CSS selector:

```bash
npx style-capture "<url>" "<css-selector>"
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

## agent-browser command reference

Only use these commands — do not guess command names:

| Task | Command |
|------|---------|
| Navigate | `agent-browser open <url>` |
| Wait for load | `agent-browser wait --load networkidle` |
| Snapshot (interactive) | `agent-browser snapshot -i` |
| Snapshot (scoped) | `agent-browser snapshot -i -s "<selector>"` |
| Screenshot | `agent-browser screenshot --annotate` |
| Run JavaScript | `agent-browser eval "<js>"` |
| Get HTML | `agent-browser get html <sel>` |
| Get styles | `agent-browser get styles <sel>` |
| Scroll to element | `agent-browser scrollintoview <sel>` |
| Scroll direction | `agent-browser scroll down 500` |
| Find by text | `agent-browser find text "Sign In" click` |

**Wrong commands:** `evaluate`, `exec`, `execute`, `run` — these do not exist. The JavaScript command is `eval`.

## Tips

- For complex pages, start with a broader element (e.g. a whole section) rather than individual elements
- Use `--mode full` when you need exact CSS fidelity including all computed properties
- If the element is inside a shadow DOM or iframe, you may need to capture a parent element instead
- After capture, the browser session stays open — you can capture additional elements without reopening
