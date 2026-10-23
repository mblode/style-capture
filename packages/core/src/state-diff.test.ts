import { formatCaptureForClaudeMarkdown } from "./claude-export.ts";
import { diffStateStyles } from "./state-diff.ts";
import type { CaptureResult } from "./types.ts";

const createCapture = (): CaptureResult => ({
  elements: {
    "node-0": {
      attributes: {},
      boundingBox: {
        bottom: 10,
        height: 10,
        left: 0,
        right: 10,
        top: 0,
        width: 10,
        x: 0,
        y: 0,
      },
      children: [],
      classList: [],
      id: "node-0",
      parentId: null,
      pseudo: {},
      selector: "#cta",
      styles: { "background-color": "rgb(0, 0, 255)", display: "block" },
      tagName: "button",
    },
  },
  metadata: { url: "https://example.test/" },
  order: ["node-0"],
  rootElementId: "node-0",
  rootOuterHtml: "",
  settings: {
    captureMode: "curated",
    includeHiddenElements: false,
    includePseudoElements: false,
  },
  states: {
    active: { applicable: true, styles: { "node-0": { display: "block" } } },
    disabled: { applicable: false, reason: "element is not disabled" },
    hover: {
      applicable: true,
      styles: {
        "node-0": {
          "background-color": "rgb(0, 0, 200)",
          display: "block",
          transform: "matrix(1.05, 0, 0, 1.05, 0, 0)",
        },
      },
    },
  },
  summary: { elementCount: 1, pseudoElementCount: 0 },
  version: 1,
});

describe("diffStateStyles", () => {
  it("lists only changed properties and treats a missing side as the default", () => {
    expect(diffStateStyles(createCapture(), "hover")).toEqual({
      "node-0": {
        "background-color": {
          after: "rgb(0, 0, 200)",
          before: "rgb(0, 0, 255)",
        },
        transform: {
          after: "matrix(1.05, 0, 0, 1.05, 0, 0)",
          before: "(default)",
        },
      },
    });
  });

  it("reports a property that falls back to the default as changed", () => {
    expect(diffStateStyles(createCapture(), "active")).toEqual({
      "node-0": {
        "background-color": { after: "(default)", before: "rgb(0, 0, 255)" },
      },
    });
  });

  it("returns nothing for a state that does not apply or was not captured", () => {
    expect(diffStateStyles(createCapture(), "disabled")).toEqual({});
    expect(diffStateStyles(createCapture(), "focus")).toEqual({});
  });
});

describe("states in the style_capture block", () => {
  it("emits per-state css and state_diff", () => {
    const output = formatCaptureForClaudeMarkdown(createCapture(), null);

    expect(output).toContain('<state name="hover">');
    expect(output).toContain(
      "0 background-color:rgb(0, 0, 255)->rgb(0, 0, 200);transform:(default)->matrix(1.05, 0, 0, 1.05, 0, 0)"
    );
    expect(output).toContain(
      '<state name="disabled" applicable="false">element is not disabled</state>'
    );
  });

  it("leaves the block unchanged when there is no state data", () => {
    const capture = { ...createCapture(), states: undefined };

    expect(formatCaptureForClaudeMarkdown(capture, null)).not.toContain(
      "<states>"
    );
  });
});
