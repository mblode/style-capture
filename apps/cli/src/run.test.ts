import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import { run } from "./run.ts";

const fixture = pathToFileURL(
  new URL("../test/fixtures/button.html", import.meta.url).pathname
).href;

describe("run with --state", () => {
  it("reports only the properties each state changes", async () => {
    const output = await run({
      selector: "#cta",
      states: ["hover", "focus-visible", "active", "disabled"],
      url: fixture,
    });

    const section = (name: string) =>
      output.split(`<state name="${name}"`)[1]?.split("</state>")[0] ?? "";

    expect(section("hover")).toContain(
      "background-color:rgb(0, 0, 255)->rgb(0, 0, 200)"
    );
    expect(section("hover")).toMatch(/transform:\(default\)->matrix\(1\.05/);
    expect(section("focus-visible")).toContain("outline-");
    expect(section("focus-visible")).not.toContain("transform:");
    expect(section("active")).toContain(
      "background-color:rgb(0, 0, 255)->rgb(0, 0, 120)"
    );
    expect(section("active")).not.toContain("transform:");
    expect(output).toContain('<state name="disabled" applicable="false">');
  }, 60_000);

  it("reads an already-disabled element as is", async () => {
    const output = await run({
      selector: "#off",
      states: ["disabled"],
      url: fixture,
    });

    expect(output).toContain('<state name="disabled">');
    expect(output).toContain("no differences from default");
  }, 60_000);

  it("leaves the default capture alone without --state", async () => {
    const output = await run({ selector: "#cta", url: fixture });

    expect(output).not.toContain("<states>");
  }, 60_000);
});
