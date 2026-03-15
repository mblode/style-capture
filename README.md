<p align="center">
  <img src=".github/assets/logo.png" width="80" height="80" alt="Style Capture logo" />
</p>

<h1 align="center">Style Capture</h1>

<p align="center">Capture CSS from any element and map it to Tailwind — as a Chrome extension, CLI, or AI agent skill.</p>

## Install

### Chrome Extension

Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/style-capture/gnolhcpajlndieinmodljdhcbmdmmepd)

### Agent Skill

Add Style Capture as a skill for Claude Code, Cursor, or any compatible AI agent:

```bash
npx skills add mblode/style-capture -g --all -y
```

Then use it with `/style-capture`:

```
/style-capture https://example.com .hero
```

### CLI

```bash
# Run directly via npx
npx style-capture https://example.com "main" --mode curated

# Or install globally
npm i -g style-capture
style-capture https://example.com ".hero"
```

## Usage

### Chrome Extension

1. Click the Style Capture icon on any website
2. Hover and click the element you want to capture
3. Paste into Claude Code, Cursor, or any AI agent

Use **Shift** to select a parent, **Alt** for a child, **Escape** to cancel.

### CLI / Agent Skill

Provide a URL and a CSS selector. The tool launches a headless browser, captures computed CSS from the element subtree, maps it to Tailwind utilities, and outputs a structured `<style_capture>` prompt.

```
style-capture <url> <selector> [--mode curated|full]
```

- `curated` (default) — common visual properties only
- `full` — all computed styles

## Privacy

All processing happens locally. Nothing leaves your device.

## License

[MIT](LICENSE.md)
