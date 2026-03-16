<p align="center">
  <img src=".github/assets/logo.png" width="80" height="80" alt="Style Capture logo" />
</p>

<h1 align="center">Style Capture</h1>

<p align="center">Point at any UI. Let your agent rebuild it.</p>

<p align="center">Capture any element on any website, get computed CSS with Tailwind mappings, and paste it straight into your AI coding agent.</p>

## Chrome extension

Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/style-capture/gnolhcpajlndieinmodljdhcbmdmmepd).

1. Click the Style Capture icon on any website
2. Hover and click the element you want to capture
3. Paste into Claude Code, Cursor, or any AI agent

## CLI

```bash
npx style-capture <url> <selector> [--mode curated|full]
```

```bash
npx style-capture https://stripe.com ".hero-section"
npx style-capture https://linear.app "main > section:first-child" --mode full
```

For frequent use, install globally with `npm install -g style-capture`.

## Agent skill

Install the slash command for Claude Code or any [skills.sh](https://skills.sh)-compatible agent:

```bash
npx skills add mblode/style-capture -g --all -y
```

Describe the element in natural language — no CSS selectors needed:

```
/style-capture https://stripe.com the pricing table
/style-capture https://linear.app the hero section with the gradient
```

## Output

A `<style_capture>` block containing:

- **html_capture** — sanitised HTML of the subtree
- **css_capture** — computed CSS grouped by element
- **tailwind_hints** — Tailwind utilities with confidence scores
- **open_questions** — ambiguous mappings flagged for review

## Privacy

All processing happens locally. Nothing leaves your device.

## Licence

[MIT](LICENSE.md)
