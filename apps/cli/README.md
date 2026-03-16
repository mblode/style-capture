<p align="center">
  <img src="../../.github/assets/logo.png" width="80" height="80" alt="Style Capture logo" />
</p>

<h1 align="center">Style Capture</h1>

<p align="center">Capture computed styles from any web page. Mapped to Tailwind, structured for AI agents.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/style-capture"><img src="https://img.shields.io/npm/v/style-capture.svg" alt="npm version"></a>
  <a href="../../LICENSE.md"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
</p>

## Usage

```bash
npx style-capture <url> <selector>
```

```bash
npx style-capture https://stripe.com ".hero-section"
npx style-capture https://linear.app "main > section:first-child" --mode full
```

Run without arguments for interactive mode:

```bash
npx style-capture
```

For frequent use, install globally with `npm install -g style-capture`.

## Agent skill

Describe the element in natural language — no selectors needed:

```
/style-capture https://stripe.com the pricing table
/style-capture https://linear.app the hero section with the gradient
```

Install the [Claude Code skill](https://docs.anthropic.com/en/docs/claude-code):

```bash
npx skills add mblode/style-capture -g --all -y
```

## Output

A `<style_capture>` block containing:

- **html_capture** — sanitised HTML of the subtree
- **css_capture** — computed CSS grouped by element
- **tailwind_hints** — Tailwind utilities with confidence scores
- **open_questions** — ambiguous mappings flagged for review

Paste into Claude Code, Cursor, or any AI tool.

## Privacy

All processing happens locally. No data leaves your machine.

## License

[MIT](../../LICENSE.md)
