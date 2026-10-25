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

Measure a component in its interactive states, not only at rest. `--state` takes `hover`, `focus`, `focus-visible`, `active` and `disabled` (repeat it or use a comma list); `--state all` means hover, focus-visible and active. The state is forced through the DevTools protocol, so no mouse is needed, and the capture waits for the element's transition to finish (1s cap). Add `--state-scope subtree` to force the state on descendants as well:

```bash
npx style-capture https://example.com "#cta" --state hover,focus-visible
npx style-capture https://example.com "#cta" --state all --state-scope subtree
```

The output gains a `<states>` block with a `css_capture` and a `state_diff` per state; the diff lists only the properties that change from the resting capture (`before->after`). `disabled` reads the element as-is when it already has `disabled` or `aria-disabled`, and reports not applicable otherwise.

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

With `--state`, a `<states>` block follows with each state's `css_capture` and a `state_diff` of what changed.

## Capture bundles

Use `--out <new-directory>` to keep source screenshots, available fonts and images, matched CSS, static replay HTML and capture metadata together. Control the browser with `--viewport 1440x900`, `--dpr 2`, `--color-scheme light` and `--surface component-demo`. Requested CSS states receive their own evidence and assets.

The updated extension adds **Download local capture bundle** in Settings. It downloads one JSON file using the existing extension permissions. Extension font and asset coverage is more limited than the CLI; gaps are recorded explicitly.

See [capture bundles](docs/capture-bundles.md) for source-checkout usage, output contents and fidelity limits. These source capabilities require the corresponding published CLI or updated extension build.

## Privacy

Every capture is processed locally, in your browser or your own headless Chromium. Bundle mode writes local files and requests assets from their original hosts. No capture is uploaded to an AI service.

## License

MIT

---

Crafted by [<img src="https://blode.co/avatar-circle.png" width="20" align="top" />](https://blode.co) [Matthew Blode](https://blode.co)
