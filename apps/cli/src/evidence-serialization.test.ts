import { describe, expect, it } from "vitest";

import {
  redactEvidenceText,
  serializeEvidence,
} from "./evidence-serialization.ts";

describe("bundle evidence serialization", () => {
  it("preserves query email addresses while redacting signed and fragment credentials", () => {
    expect(redactEvidenceText("https://host?email=a@b#contact=c@d")).toBe(
      "https://host?email=a@b#contact=c@d"
    );
    expect(
      redactEvidenceText(
        "https://user:pass@host/image?sig=azure&design=keep&%6awt=jwt-value#password=password-value&%74oken=fragment-token"
      )
    ).toBe(
      "https://host/image?sig=REDACTED&design=keep&%6awt=REDACTED#password=REDACTED&%74oken=REDACTED"
    );
  });
  it("removes credentials from nested evidence and CSS without mutating replay inputs", () => {
    const url =
      "https://person:password@example.com/image.png?size=2&%74oken=private-token";
    const evidence = {
      metadata: { url },
      recipe: { url },
      states: { hover: { css: `a{background:url('${url}');}` } },
    };
    const serialized = serializeEvidence(evidence);
    expect(serialized).not.toContain("person");
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("private-token");
    expect(serialized).toContain("size=2&%74oken=REDACTED");
    expect(evidence.metadata.url).toBe(url);
    expect(
      redactEvidenceText(
        `<div style="background:url(${url.replaceAll("&", "&amp;")})"></div>`
      )
    ).toContain("size=2&amp;%74oken=REDACTED");
  });
});
