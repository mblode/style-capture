import { createDefaultSettings } from "./messages.ts";

describe("createDefaultSettings()", () => {
  it("returns the extension's default capture profile", () => {
    expect(createDefaultSettings()).toStrictEqual({
      captureMode: "curated",
      includeHiddenElements: false,
      includePseudoElements: true,
    });
  });
});
