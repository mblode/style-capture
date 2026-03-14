<h3 align="center">@style-capture/core</h3>
<p align="center">Tailwind mapping, capture contracts, and Claude-ready serializers extracted from Style Capture.</p>

## Highlights

- Shared capture types and message contracts for Style Capture tooling
- Tailwind utility mapping with confidence, unsupported-property, and review metadata
- Compact Claude-friendly HTML and CSS serializers for captured DOM snapshots

## Quick Start

```bash
npm install @style-capture/core
```

```tsx
import {
  createDefaultSettings,
  formatCaptureForClaudeMarkdown,
  mapCaptureToTailwind,
  type CaptureResult,
} from "@style-capture/core";

const capture: CaptureResult = {
  elements: {
    "node-0": {
      attributes: {},
      boundingBox: {
        bottom: 48,
        height: 48,
        left: 0,
        right: 160,
        top: 0,
        width: 160,
        x: 0,
        y: 0,
      },
      children: [],
      classList: [],
      id: "node-0",
      parentId: null,
      pseudo: {},
      selector: ".hero-card",
      styles: {
        "background-color": "rgb(255, 255, 255)",
        display: "flex",
        "justify-content": "space-between",
        padding: "16px",
      },
      tagName: "div",
    },
  },
  metadata: {
    url: "https://example.com/card",
  },
  order: ["node-0"],
  rootElementId: "node-0",
  rootOuterHtml: '<div class="hero-card">Hello</div>',
  settings: createDefaultSettings(),
  summary: {
    elementCount: 1,
    pseudoElementCount: 0,
  },
  version: 1,
};

const mapping = mapCaptureToTailwind(capture);
const prompt = formatCaptureForClaudeMarkdown(capture, mapping);

console.log(mapping.elements["node-0"]?.suggestedClassName);
console.log(prompt);
```

## Usage

```tsx
import {
  buildClaudeCapturePrompt,
  createDefaultSettings,
  mapCaptureToTailwind,
} from "@style-capture/core";

const settings = createDefaultSettings();
const mapping = mapCaptureToTailwind(capture);
const prompt = buildClaudeCapturePrompt(capture, mapping);
```

Public exports:

- `createDefaultSettings`
- `mapCaptureToTailwind`
- `buildClaudeCapturePrompt`
- `formatCaptureForClaudeMarkdown`
- Capture result, mapping, and message types from the package root

Requires a runtime with standard DOM globals if you want annotated HTML output. When `DOMParser` is unavailable, the serializer falls back to compact raw HTML and selector-based CSS output.

## License

[MIT](LICENSE.md)
