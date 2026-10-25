import { afterEach, expect, it, vi } from "vitest";

import type { CaptureResult } from "@/lib/types.ts";

import { downloadBundle } from "./download-bundle.ts";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.replaceChildren();
});

it("redacts credentials in the downloaded bundle without corrupting query email addresses", async () => {
  const root = document.createElement("div");
  document.body.append(root);
  const rootDomPath: number[] = [];
  let node: Node = root;
  while (node.parentNode) {
    rootDomPath.unshift(
      [...node.parentNode.childNodes].indexOf(node as ChildNode)
    );
    node = node.parentNode;
  }
  const originalUrl =
    "https://user:pass@host?email=a@b&sig=azure&%6awt=jwt-value#password=password-value&%74oken=fragment-token";
  const capture: CaptureResult = {
    version: 1,
    metadata: { url: originalUrl, rootDomPath },
    rootElementId: "node-0",
    rootOuterHtml: root.outerHTML,
    order: ["node-0"],
    elements: {
      "node-0": {
        id: "node-0",
        tagName: "div",
        parentId: null,
        domPath: [],
        subtreeIndex: 0,
        attributes: {},
        children: [],
        classList: [],
        boundingBox: {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
        },
        pseudo: {},
        selector: "div",
        styles: {},
      },
    },
    settings: {
      captureMode: "full",
      includeHiddenElements: false,
      includePseudoElements: true,
    },
    summary: { elementCount: 1, pseudoElementCount: 0 },
  };
  let downloaded: Blob | undefined;
  vi.stubGlobal(
    "URL",
    class extends URL {
      static override createObjectURL(blob: Blob): string {
        downloaded = blob;
        return "blob:captured-bundle";
      }
    }
  );
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  vi.useFakeTimers();
  await downloadBundle(capture, null, null);
  vi.useRealTimers();
  if (!downloaded) throw new Error("No bundle was downloaded");
  const text = await downloaded.text();
  const bundle = JSON.parse(text) as { capture: CaptureResult };
  expect(bundle.capture.metadata.url).toBe(
    "https://host?email=a@b&sig=REDACTED&%6awt=REDACTED#password=REDACTED&%74oken=REDACTED"
  );
  expect(capture.metadata.url).toBe(originalUrl);
});
