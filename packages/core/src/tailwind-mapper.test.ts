import { mapCaptureToTailwind } from "./tailwind-mapper.ts";
import type { CaptureResult } from "./types.ts";

const createCaptureFixture = (): CaptureResult => ({
  elements: {
    "node-0": {
      attributes: {},
      boundingBox: {
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0,
        x: 0,
        y: 0,
      },
      children: [],
      classList: [],
      id: "node-0",
      parentId: null,
      pseudo: {},
      selector: "div:nth-child(1)",
      styles: {
        "align-items": "center",
        "background-color": "rgb(255, 0, 0)",
        color: "rgb(255, 255, 255)",
        display: "flex",
        "justify-content": "space-between",
        "padding-bottom": "16px",
        "padding-left": "16px",
        "padding-right": "16px",
        "padding-top": "16px",
      },
      tagName: "div",
    },
  },
  metadata: {
    url: "https://example.com/fixture",
  },
  order: ["node-0"],
  rootElementId: "node-0",
  rootOuterHtml: "<div></div>",
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
});

/* eslint-disable vitest/max-expects -- mapping tests verify many properties of the output */
describe("mapCaptureToTailwind()", () => {
  it("derives semantic and scale utilities for a simple flex container", () => {
    const result = mapCaptureToTailwind(createCaptureFixture());
    const rootMapping = result.elements["node-0"];

    expect(rootMapping.className.split(" ")).toStrictEqual(
      expect.arrayContaining([
        "flex",
        "justify-between",
        "items-center",
        "p-4",
        "text-white",
        "bg-[#ff0000]",
      ])
    );
    expect(rootMapping.suggestedClassName.split(" ")).toStrictEqual(
      expect.arrayContaining([
        "flex",
        "justify-between",
        "items-center",
        "p-4",
        "text-white",
        "bg-[#ff0000]",
      ])
    );
    expect(rootMapping.reviewClassName).toBe("");
    expect(rootMapping.confidenceLabel).toBe("high");
    expect(result.reviewQueue).toHaveLength(0);
    expect(result.summary).toMatchObject({
      cleanUtilityCount: 6,
      elementCount: 1,
      mappedElementCount: 1,
      reviewCount: 0,
      reviewUtilityCount: 0,
      utilityCount: 6,
    });
  });

  it("keeps layout-derived and arbitrary-property utilities out of the clean suggestion", () => {
    const fixture = createCaptureFixture();
    const result = mapCaptureToTailwind({
      ...fixture,
      elements: {
        "node-0": {
          ...fixture.elements["node-0"],
          selector:
            "div.flex.flex-col:nth-child(1) > div.group/card.flex:nth-child(1)",
          styles: {
            color: "rgb(44, 37, 33)",
            "font-family": 'glide, "glide Fallback"',
            "font-size": "24px",
            "font-weight": "500",
            height: "32px",
            "line-height": "32px",
            "transform-origin": "176px 16px",
            width: "352px",
          },
        },
      },
    });
    const rootMapping = result.elements["node-0"];

    expect(rootMapping.className).toBe(
      'w-[352px] h-8 text-[#2c2521] [font-family:glide,"glide_Fallback"] text-2xl font-medium leading-8 origin-[176px_16px]'
    );
    expect(rootMapping.suggestedClassName).toBe(
      "text-[#2c2521] text-2xl font-medium leading-8"
    );
    expect(rootMapping.reviewClassName).toBe(
      'w-[352px] h-8 [font-family:glide,"glide_Fallback"] origin-[176px_16px]'
    );
    expect(result.summary).toMatchObject({
      cleanUtilityCount: 4,
      reviewCount: 1,
      reviewUtilityCount: 4,
      utilityCount: 8,
    });
    expect(result.reviewQueue[0]?.reasons).toStrictEqual(
      expect.arrayContaining([
        "w-[352px]: Computed size values are often layout-dependent.",
        "h-8: Computed size values are often layout-dependent.",
        '[font-family:glide,"glide_Fallback"]: Font family required an arbitrary property utility.',
        "origin-[176px_16px]: transform-origin required an arbitrary value.",
      ])
    );
  });
});
