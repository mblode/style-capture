<p align="center">
  <img src=".github/assets/logo.png" width="80" height="80" alt="Style Capture logo" />
</p>

<h1 align="center">Style Capture</h1>

<p align="center">Point at any UI. Let your agent rebuild it.</p>

<p align="center">Style Capture turns visual elements into structured context that AI coding agents can understand and act on. Select any element on any website, get computed CSS with Tailwind mappings, and paste it into Claude Code, Cursor, or any AI tool.</p>

## Install

### Chrome extension

Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/style-capture/gnolhcpajlndieinmodljdhcbmdmmepd)

### Agent skill

Give your agent direct access to Style Capture as a slash command:

```bash
npx skills add mblode/style-capture -g --all -y
```

Then point it at any page:

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

## How it works

Without Style Capture, you describe "the blue card with rounded corners" and hope your agent guesses right. With it, your agent gets exact computed styles and Tailwind mappings it can grep for directly.

### Chrome extension

1. Click the Style Capture icon on any website
2. Hover and click the element you want to capture
3. Paste into Claude Code, Cursor, or any AI agent. It gets the full context

Use **Shift** to select a parent, **Alt** for a child, **Escape** to cancel.

### CLI / Agent skill

Provide a URL and a CSS selector. The tool launches a headless browser, captures computed CSS from the element subtree, maps it to Tailwind utilities, and outputs a structured `<style_capture>` prompt your agent can act on immediately.

```
style-capture <url> <selector> [--mode curated|full]
```

- `curated` (default) - common visual properties only
- `full` - all computed styles

## Privacy

All processing happens locally. Nothing leaves your device.

## Licence

[MIT](LICENSE.md)
