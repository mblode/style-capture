import { describe, expect, it } from "vitest";

import type { TailwindMappingResult } from "@/lib/tailwind-mapper.ts";
import type { CaptureResult } from "@/lib/types.ts";
import { formatCaptureForClaudeMarkdown } from "./claude-export.ts";

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
      capturedAt: "2026-03-13T00:00:00.000Z",
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
  it("formats a coding-agent handoff with source, html, css, hints, and questions", () => {
    const markdown = formatCaptureForClaudeMarkdown(
      createCapture(),
      createMapping()
    );

    expect(markdown).toContain("<live_css_capture>");
    expect(markdown).toContain("<task_summary>");
    expect(markdown).toContain("<source>");
    expect(markdown).toContain("capture_mode: curated");
    expect(markdown).toContain("element_count: 2");
    expect(markdown).toContain("pseudo_element_count: 1");
    expect(markdown).toContain("url: https://example.com/card");
    expect(markdown).not.toContain("capturedAt");
    expect(markdown).not.toContain("userAgent");
    expect(markdown).toContain("<html>");
    expect(markdown).toContain("```html");
    expect(markdown).toContain('data-live-css-node="node-0"');
    expect(markdown).toContain('data-live-css-node="node-1"');
    expect(markdown).toContain("<css>");
    expect(markdown).toContain("```css");
    expect(markdown).toContain('[data-live-css-node="node-0"] {');
    expect(markdown).toContain("display: flex;");
    expect(markdown).toContain('[data-live-css-node="node-1"]::before {');
    expect(markdown).toContain('content: "*";');
    expect(markdown).toContain("<tailwind_hints>");
    expect(markdown).toContain("root_suggestion: `flex gap-4 bg-white`");
    expect(markdown).toContain("suggested_class_strings:");
    expect(markdown).toContain("<open_questions>");
    expect(markdown).toContain("Pseudo-element content requires review");
    expect(markdown).toContain("<final_request>");
    expect(markdown).toContain(
      "Treat <html> and <css> as the source of truth."
    );
  });

  it("omits tailwind and open_questions when no mapping is provided", () => {
    const markdown = formatCaptureForClaudeMarkdown(createCapture(), null);

    expect(markdown).not.toContain("<tailwind_hints>");
    expect(markdown).not.toContain("<open_questions>");
    expect(markdown).toContain("<html>");
    expect(markdown).toContain("<css>");
    expect(markdown).toContain("<final_request>");
  });
});
