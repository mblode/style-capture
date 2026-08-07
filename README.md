<div align="center">

# [Style Capture](https://blode.co/style-capture)

**Click any element on any website and hand your coding agent its computed CSS, mapped to Tailwind**

Point at the UI you want, paste the capture into your agent, and let it rebuild the thing.

<p align="center">
  <a href="https://www.npmjs.com/package/style-capture">
    <img src="https://img.shields.io/npm/v/style-capture?style=flat&colorA=000000&colorB=000000" />
  </a>
  <a href="https://github.com/mblode/style-capture/blob/main/LICENSE.md">
    <img src="https://img.shields.io/github/license/mblode/style-capture?style=flat&colorA=000000&colorB=000000" />
  </a>
</p>

</div>

## Demo

Compare the three ways to capture, and add the extension to Chrome.

<p>
<a href="https://blode.co/style-capture">
<img alt="Visit the site" src=".github/assets/demo.svg" width="200" />
</a>
</p>

## Install

```bash
npm install -g style-capture
```

## Quickstart

```bash
npx style-capture https://linear.app "main > section:first-child"
```

The capture goes to stdout. Add `--mode full` for every computed property rather than the curated set, or run `npx style-capture` with no arguments for an interactive prompt.

## Chrome extension

Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/style-capture/gnolhcpajlndieinmodljdhcbmdmmepd), then click the toolbar icon on any page. Hover to preview the element, click to capture it to your clipboard, or press Escape to cancel.

The extension asks for `activeTab`, `scripting`, and `storage`, and holds no host permissions.

## Agent skill

Install the slash command for Claude Code or any [skills.sh](https://skills.sh)-compatible agent:

```bash
npx skills add mblode/style-capture -g --all -y
```

Then describe the element in words, with no selector to work out:

```text
/style-capture https://stripe.com the pricing table
/style-capture https://linear.app the hero section with the gradient
```

## Output

A `<style_capture>` block containing four parts:

- **html_capture:** the subtree's HTML, with form state, inline handlers, and script tags stripped out.
- **css_capture:** computed CSS grouped by element, so the agent reads real values rather than source declarations.
- **tailwind_hints:** the Tailwind utility for each property, with a confidence score.
- **open_questions:** the mappings that were ambiguous, flagged for review.

## Privacy

Every capture runs locally, in your browser or in your own headless Chromium. Nothing is uploaded, stored, or sent anywhere.

## License

MIT

---

Crafted by [<img src="https://blode.co/avatar-circle.png" width="20" align="top" />](https://blode.co) [Matthew Blode](https://blode.co)
