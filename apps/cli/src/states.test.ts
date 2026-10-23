import { describe, expect, it } from "vitest";

import { parseStateScope, parseStates } from "./states.ts";

describe("parseStates", () => {
  it("merges repeated and comma-separated values without duplicates", () => {
    expect(parseStates(["hover,focus", "hover", "disabled"])).toEqual([
      "hover",
      "focus",
      "disabled",
    ]);
  });

  it("expands all to hover, focus-visible and active", () => {
    expect(parseStates(["all"])).toEqual(["hover", "focus-visible", "active"]);
  });

  it("rejects an unknown state", () => {
    expect(() => parseStates(["visited"])).toThrow('Unknown state "visited"');
  });
});

describe("parseStateScope", () => {
  it("rejects an unknown scope", () => {
    expect(parseStateScope("subtree")).toBe("subtree");
    expect(() => parseStateScope("page")).toThrow("Unknown --state-scope");
  });
});
