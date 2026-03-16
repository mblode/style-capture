<p align="center">
  <img src="../../.github/assets/logo.png" width="80" height="80" alt="Style Capture logo" />
</p>

<h1 align="center">Style Capture CLI</h1>

<p align="center">Give your AI coding agent the exact computed styles from any web page. Mapped to Tailwind utilities, structured for immediate use.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/style-capture"><img src="https://img.shields.io/npm/v/style-capture.svg" alt="npm version"></a>
  <a href="../../LICENSE.md"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
</p>

## Install

```bash
npm install style-capture
```

Playwright ships its own Chromium binary. After installing, run `npx playwright install chromium` if you haven't already.

## Usage

### Direct mode

Pass a URL and CSS selector to capture and print the result to stdout:

```bash
style-capture https://stripe.com ".hero-section"
style-capture https://linear.app "main > section:nth-child(2)" --mode full
```

### Interactive mode

Run without arguments for an interactive prompt:

```bash
style-capture
```

You'll be asked for a URL, CSS selector, capture mode, and output destination (clipboard or stdout).

### Options

| Flag                | Description                                                          | Default   |
| ------------------- | -------------------------------------------------------------------- | --------- |
| `-m, --mode <mode>` | `curated` (common visual properties) or `full` (all computed styles) | `curated` |

## Agent Skill

Style Capture ships as a [Claude Code skill](https://docs.anthropic.com/en/docs/claude-code) that gives your agent direct access to any website's styles. Instead of manually finding selectors, describe the element in natural language:

```
/style-capture https://stripe.com the pricing table
/style-capture https://linear.app the hero section with the gradient
/style-capture https://vercel.com/dashboard the sidebar navigation
```

The skill opens the page with `agent-browser`, takes an interactive snapshot to locate the element, derives a CSS selector, and runs the capture CLI automatically.

## Output

The CLI outputs a `<style_capture>` block containing:

- **html_capture** - sanitised, annotated HTML of the subtree
- **css_capture** - computed CSS grouped by element
- **tailwind_hints** - suggested Tailwind utility classes with confidence scores
- **open_questions** - low-confidence mappings flagged for review

Paste the output into Claude Code, Cursor, or any AI tool. Your agent gets selectors it can grep for, styles it can trust, and Tailwind hints it can apply directly.

## Requirements

- Node.js `22+`

## Privacy

All capture, mapping, and export steps happen locally. No page data is sent to a remote service.

## License

[MIT](../../LICENSE.md)
