import { describe, expect, it } from "vitest";

import type { TailwindMappingResult } from "@/lib/tailwind-mapper.ts";
import type { CaptureResult } from "@/lib/types.ts";
import {
  buildClaudeCapturePrompt,
  formatCaptureForClaudeMarkdown,
} from "./claude-export.ts";

function createCapture(): CaptureResult {
  return {
    elements: {
      "node-0": {
        attributes: {
          class: "card shell",
        },
        boundingBox: {
          bottom: 100,
          height: 80,
          left: 0,
          right: 200,
          top: 20,
          width: 200,
          x: 0,
          y: 20,
        },
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
        },
        tagName: "div",
      },
      "node-1": {
        attributes: {
          class: "label",
        },
        boundingBox: {
          bottom: 60,
          height: 20,
          left: 12,
          right: 80,
          top: 40,
          width: 68,
          x: 12,
          y: 40,
        },
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
        },
        tagName: "span",
      },
    },
    metadata: {
      capturedAt: "2026-03-14T00:00:00.000Z",
      title: "Fixture card",
      url: "https://example.com/card",
      userAgent: "Vitest",
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
  };
}

function createMapping(): TailwindMappingResult {
  return {
    elements: {
      "node-0": {
        className: "flex gap-4 bg-white",
        confidence: 0.93,
        confidenceLabel: "high",
        elementId: "node-0",
        matchCount: 3,
        matches: [
          {
            confidence: 0.95,
            label: "high",
            notes: [],
            sourceProperties: ["display"],
            sourceValues: ["flex"],
            strategy: "semantic",
            utility: "flex",
          },
        ],
        reviewClassName: "",
        reviewMatchCount: 0,
        selector: "#app",
        suggestedClassName: "flex gap-4 bg-white",
        suggestedMatchCount: 3,
        tagName: "div",
        unsupported: [],
      },
      "node-1": {
        className: "text-sm text-slate-900",
        confidence: 0.68,
        confidenceLabel: "low",
        elementId: "node-1",
        matchCount: 2,
        matches: [
          {
            confidence: 0.68,
            label: "low",
            notes: ["Custom color token"],
            sourceProperties: ["color"],
            sourceValues: ["rgb(17, 24, 39)"],
            strategy: "heuristic",
            utility: "text-slate-900",
          },
        ],
        reviewClassName: "",
        reviewMatchCount: 0,
        selector: ".label",
        suggestedClassName: "text-sm text-slate-900",
        suggestedMatchCount: 2,
        tagName: "span",
        unsupported: [
          {
            property: "content",
            reason: "Pseudo-element content requires review",
            value: '"*"',
          },
        ],
      },
    },
    order: ["node-0", "node-1"],
    reviewQueue: [
      {
        confidence: 0.68,
        confidenceLabel: "low",
        elementId: "node-1",
        reasons: ["Pseudo-element content requires review"],
        selector: ".label",
        unsupportedCount: 1,
      },
    ],
    summary: {
      averageConfidence: 0.805,
      cleanUtilityCount: 5,
      elementCount: 2,
      lowConfidenceElementCount: 1,
      mappedElementCount: 2,
      reviewCount: 1,
      reviewUtilityCount: 0,
      unsupportedPropertyCount: 1,
      utilityCount: 5,
    },
  };
}

describe("formatCaptureForClaudeMarkdown", () => {
  it("builds a reusable structured prompt payload for alternate serializers", () => {
    const prompt = buildClaudeCapturePrompt(createCapture(), createMapping());

    expect(prompt.metadata.mode).toBe("curated");
    expect(prompt.metadata.rootRef).toBe("0");
    expect(prompt.metadata.rootSelector).toBe("#app");
    expect(prompt.metadata.url).toBe("https://example.com/card");
    expect(prompt.metadata.elementCount).toBe(2);
    expect(prompt.metadata.pseudoCount).toBe(1);
    expect(prompt.instruction).toContain(
      "html_capture + css_capture are ground truth."
    );
    expect(prompt.htmlCapture).toContain('data-lc="0"');
    expect(prompt.htmlCapture).toContain('data-lc="1"');
    expect(prompt.cssCapture).toContain('[data-lc="0"]{');
    expect(prompt.cssCapture).toContain('[data-lc="1"]::before{');
    expect(prompt.tailwindHints).toEqual([
      {
        key: "root",
        value: "flex gap-4 bg-white",
      },
      {
        key: "1",
        value: "text-sm text-slate-900",
      },
    ]);
    expect(prompt.openQuestions).toEqual([
      {
        key: "1",
        value: "Pseudo-element content requires review",
      },
    ]);
  });

  it("formats a compact coding-agent handoff with annotated html, css, hints, and questions", () => {
    const markdown = formatCaptureForClaudeMarkdown(
      createCapture(),
      createMapping()
    );

    expect(markdown).toContain("<style_capture ");
    expect(markdown).toContain('mode="curated"');
    expect(markdown).toContain('root_ref="0"');
    expect(markdown).toContain('root_selector="#app"');
    expect(markdown).toContain('elements="2"');
    expect(markdown).toContain('pseudos="1"');
    expect(markdown).not.toContain("capturedAt");
    expect(markdown).not.toContain("userAgent");
    expect(markdown).not.toContain("<instructions>");
    expect(markdown).not.toContain("```");
    expect(markdown).not.toContain("/*");
    expect(markdown).toContain("<html_capture>");
    expect(markdown).toContain('data-lc="0"');
    expect(markdown).toContain('data-lc="1"');
    expect(markdown).toContain("<css_capture>");
    expect(markdown).toContain('[data-lc="0"]{');
    expect(markdown).toContain("display:flex");
    expect(markdown).toContain('[data-lc="1"]::before{');
    expect(markdown).toContain('content:"*"');
    expect(markdown).toContain("<tailwind_hints>");
    expect(markdown).toContain("root=flex gap-4 bg-white");
    expect(markdown).toContain("1=text-sm text-slate-900");
    expect(markdown).toContain("<open_questions>");
    expect(markdown).toContain("1:Pseudo-element content requires review");
    expect(markdown).toContain("html_capture + css_capture are ground truth.");
  });

  it("omits tailwind and open_questions when no mapping is provided", () => {
    const markdown = formatCaptureForClaudeMarkdown(createCapture(), null);

    expect(markdown).not.toContain("<tailwind_hints>");
    expect(markdown).not.toContain("<open_questions>");
    expect(markdown).toContain("<html_capture>");
    expect(markdown).toContain("<css_capture>");
  });

  it("falls back to compact raw html and selectors when DOMParser is unavailable", () => {
    const originalDOMParser = globalThis.DOMParser;

    Object.defineProperty(globalThis, "DOMParser", {
      configurable: true,
      value: undefined,
    });

    try {
      const markdown = formatCaptureForClaudeMarkdown(
        createCapture(),
        createMapping()
      );

      expect(markdown).not.toContain("data-lc=");
      expect(markdown).toContain(
        '<html_capture><div class="card shell"><span class="label">Hello</span></div></html_capture>'
      );
      expect(markdown).toContain("<css_capture>#app{");
      expect(markdown).toContain(
        '.label{color:rgb(17, 24, 39);font-size:14px}.label::before{color:rgb(17, 24, 39);content:"*"}'
      );
    } finally {
      Object.defineProperty(globalThis, "DOMParser", {
        configurable: true,
        value: originalDOMParser,
      });
    }
  });
});
