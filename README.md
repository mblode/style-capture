<p align="center">
  <img src=".github/assets/logo.png" width="80" height="80" alt="Style Capture logo" />
</p>

<h1 align="center">Style Capture</h1>

<p align="center">Capture real CSS from any element. Get Tailwind classes. Paste into your AI coding agent.</p>

## Install

1. Download `style-capture.zip` from the [latest release](https://github.com/mblode/style-capture/releases/latest)
2. Unzip the file
3. Open `chrome://extensions` in Chrome
4. Enable **Developer mode** (top-right toggle)
5. Click **Load unpacked** and select the unzipped folder

## How It Works

1. **Click** the Style Capture icon in your toolbar on any website
2. **Hover** to preview elements — click to capture the one you want
3. **Paste** the clipboard into Claude Code, Cursor, or any AI coding agent

The captured output includes the element's HTML, computed CSS, and suggested Tailwind classes — structured and ready for your agent to use.

## Features

- **Real rendered styles** — captures what the browser actually computed, not source CSS
- **Automatic Tailwind mapping** — every CSS property mapped to Tailwind utilities with confidence scores
- **Any site, zero config** — works on any webpage immediately
- **Nothing leaves your device** — all processing happens locally
- **Built for AI agents** — structured output designed for Claude Code, Cursor, and more

## Keyboard Shortcuts

While the picker is active:

- **Shift** — select the parent element
- **Alt** — select the first child element
- **Escape** — cancel

## Settings

Right-click the extension icon and select **Options** to configure:

- **Capture mode** — *Curated* (default) captures design-relevant properties; *Full* captures everything
- **Pseudo-elements** — include `::before` and `::after` styles
- **Hidden elements** — include elements hidden with `display: none` or `visibility: hidden`

## Privacy

Style Capture processes everything locally. No data is sent to any server.

## License

[MIT](LICENSE.md)
