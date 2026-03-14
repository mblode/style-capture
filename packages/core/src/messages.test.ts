import { createDefaultSettings } from "./messages.ts";

describe("createDefaultSettings()", () => {
  it("returns the default capture profile", () => {
    expect(createDefaultSettings()).toStrictEqual({
      captureMode: "curated",
      includeHiddenElements: false,
      includePseudoElements: true,
    });
  });
});
