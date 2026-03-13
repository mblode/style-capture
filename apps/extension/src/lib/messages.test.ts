import { describe, expect, it } from "vitest";

import { createDefaultSettings } from "./messages.ts";

describe("createDefaultSettings", () => {
  it("returns the extension's default capture profile", () => {
    expect(createDefaultSettings()).toEqual({
      captureMode: "curated",
      includeHiddenElements: false,
      includePseudoElements: true,
    });
  });
});
