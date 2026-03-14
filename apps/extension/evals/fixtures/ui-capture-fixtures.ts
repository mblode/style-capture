import type { CaptureResult } from "@/lib/types.ts";

export interface FormatEvalFixture {
  capture: CaptureResult;
  description: string;
  slug: string;
}

const createBox = (
  x: number,
  y: number,
  width: number,
  height: number
): CaptureResult["elements"][string]["boundingBox"] => ({
  bottom: y + height,
  height,
  left: x,
  right: x + width,
  top: y,
  width,
  x,
  y,
});

export const FORMAT_EVAL_FIXTURES: FormatEvalFixture[] = [
  {
    capture: {
      elements: {
        "node-0": {
          attributes: {},
          boundingBox: createBox(0, 0, 836, 56),
          children: [],
          classList: [],
          id: "node-0",
          parentId: null,
          pseudo: {},
          selector:
            "div.grid.transition-[grid-template-columns]:nth-child(18) > article.flex.flex-col:nth-child(5) > div.prose.flex-1:nth-child(3) > p:nth-child(1)",
          styles: {
            "border-bottom-color": "rgba(204, 204, 204, 0.5)",
            "border-bottom-style": "solid",
            "border-left-color": "rgba(204, 204, 204, 0.5)",
            "border-left-style": "solid",
            "border-right-color": "rgba(204, 204, 204, 0.5)",
            "border-right-style": "solid",
            "border-top-color": "rgba(204, 204, 204, 0.5)",
            "border-top-style": "solid",
            color: "oklab(0.144787 0.00000661612 0.00000289828 / 0.9)",
            "font-family":
              'glide, "glide Fallback", system-ui, -apple-system, "system-ui", "Segoe UI", sans-serif',
            height: "56px",
            "line-height": "28px",
            "margin-bottom": "20px",
            "margin-top": "0px",
            "text-decoration-color":
              "oklab(0.144787 0.00000661612 0.00000289828 / 0.9)",
            "transform-origin": "418px 28px",
            width: "836px",
          },
          tagName: "p",
        },
      },
      metadata: {
        capturedAt: "2026-03-14T00:00:00.000Z",
        title: "Done Bear CLI docs",
        url: "http://localhost:3003/docs/cli",
        userAgent: "Format Eval",
      },
      order: ["node-0"],
      rootElementId: "node-0",
      rootOuterHtml:
        "<p>Use the Done Bear CLI to sign in, pick a workspace, manage tasks, and automate common workflows from the terminal.</p>",
      settings: {
        captureMode: "curated",
        includeHiddenElements: false,
        includePseudoElements: true,
      },
      summary: {
        elementCount: 1,
        pseudoElementCount: 0,
      },
      version: 1,
    },
    description:
      "Single-paragraph docs intro captured from a local Done Bear CLI documentation page.",
    slug: "docs-cli-paragraph",
  },
  {
    capture: {
      elements: {
        "node-0": {
          attributes: {
            class: "card shell",
          },
          boundingBox: createBox(0, 20, 200, 80),
          children: ["node-1"],
          classList: ["card", "shell"],
          id: "node-0",
          parentId: null,
          pseudo: {},
          selector: "#app",
          styles: {
            "background-color": "rgb(255, 255, 255)",
            display: "flex",
            gap: "16px",
            "padding-bottom": "16px",
            "padding-left": "16px",
            "padding-right": "16px",
            "padding-top": "16px",
          },
          tagName: "div",
        },
        "node-1": {
          attributes: {
            class: "label",
          },
          boundingBox: createBox(12, 40, 68, 20),
          children: [],
          classList: ["label"],
          id: "node-1",
          parentId: "node-0",
          pseudo: {
            before: {
              kind: "before",
              styles: {
                color: "rgb(17, 24, 39)",
                content: '"*"',
              },
            },
          },
          selector: ".label",
          styles: {
            color: "rgb(17, 24, 39)",
            "font-size": "14px",
            "line-height": "20px",
          },
          tagName: "span",
        },
      },
      metadata: {
        capturedAt: "2026-03-14T00:00:00.000Z",
        title: "Fixture card",
        url: "https://example.com/card",
        userAgent: "Format Eval",
      },
      order: ["node-0", "node-1"],
      rootElementId: "node-0",
      rootOuterHtml:
        '<div class="card shell"><span class="label">Hello</span></div>',
      settings: {
        captureMode: "curated",
        includeHiddenElements: false,
        includePseudoElements: true,
      },
      summary: {
        elementCount: 2,
        pseudoElementCount: 1,
      },
      version: 1,
    },
    description:
      "Compact card shell with a nested label and pseudo-element content.",
    slug: "annotated-card",
  },
  {
    capture: {
      elements: {
        "node-0": {
          attributes: {
            class: "hero-stack",
          },
          boundingBox: createBox(0, 0, 420, 248),
          children: ["node-1", "node-2", "node-3"],
          classList: ["hero-stack"],
          id: "node-0",
          parentId: null,
          pseudo: {},
          selector: "main > section.hero-stack:nth-child(1)",
          styles: {
            "background-color": "rgb(18, 24, 38)",
            display: "flex",
            "flex-direction": "column",
            gap: "12px",
            "padding-bottom": "32px",
            "padding-left": "32px",
            "padding-right": "32px",
            "padding-top": "32px",
            width: "420px",
          },
          tagName: "section",
        },
        "node-1": {
          attributes: {},
          boundingBox: createBox(32, 32, 300, 40),
          children: [],
          classList: [],
          id: "node-1",
          parentId: "node-0",
          pseudo: {},
          selector: "main > section.hero-stack:nth-child(1) > h1:nth-child(1)",
          styles: {
            color: "rgb(255, 255, 255)",
            "font-size": "36px",
            "font-weight": "600",
            "line-height": "40px",
            "margin-bottom": "0px",
            "margin-top": "0px",
          },
          tagName: "h1",
        },
        "node-2": {
          attributes: {},
          boundingBox: createBox(32, 84, 320, 56),
          children: [],
          classList: [],
          id: "node-2",
          parentId: "node-0",
          pseudo: {},
          selector: "main > section.hero-stack:nth-child(1) > p:nth-child(2)",
          styles: {
            color: "rgba(255, 255, 255, 0.78)",
            "font-size": "18px",
            "line-height": "28px",
            "margin-bottom": "0px",
            "margin-top": "0px",
            width: "320px",
          },
          tagName: "p",
        },
        "node-3": {
          attributes: {},
          boundingBox: createBox(32, 160, 152, 44),
          children: [],
          classList: [],
          id: "node-3",
          parentId: "node-0",
          pseudo: {},
          selector: "main > section.hero-stack:nth-child(1) > a:nth-child(3)",
          styles: {
            "align-items": "center",
            "background-color": "rgb(255, 255, 255)",
            color: "rgb(18, 24, 38)",
            display: "inline-flex",
            "font-size": "16px",
            "font-weight": "600",
            "justify-content": "center",
            "line-height": "24px",
            "padding-bottom": "10px",
            "padding-left": "18px",
            "padding-right": "18px",
            "padding-top": "10px",
          },
          tagName: "a",
        },
      },
      metadata: {
        capturedAt: "2026-03-14T00:00:00.000Z",
        title: "Hero stack",
        url: "https://example.com/hero",
        userAgent: "Format Eval",
      },
      order: ["node-0", "node-1", "node-2", "node-3"],
      rootElementId: "node-0",
      rootOuterHtml: [
        '<section class="hero-stack">',
        "<h1>Ship cleaner captures faster.</h1>",
        "<p>Move from inspection to code without losing the exact structure or the review notes.</p>",
        "<a>Download extension</a>",
        "</section>",
      ].join(""),
      settings: {
        captureMode: "curated",
        includeHiddenElements: false,
        includePseudoElements: true,
      },
      summary: {
        elementCount: 4,
        pseudoElementCount: 0,
      },
      version: 1,
    },
    description:
      "Small marketing hero stack with heading, supporting copy, and a CTA.",
    slug: "hero-stack",
  },
];
