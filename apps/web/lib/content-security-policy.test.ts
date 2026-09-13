import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_POSTHOG_ORIGIN,
  buildContentSecurityPolicy,
} from "./content-security-policy.ts";

const directive = (csp: string, name: string): string => {
  const match = csp.split("; ").find((part) => part.startsWith(`${name} `));
  assert.ok(match, `expected ${name} directive in CSP`);
  return match;
};

describe("buildContentSecurityPolicy()", () => {
  it("allows WASM compile in production without broad unsafe-eval", () => {
    const csp = buildContentSecurityPolicy({
      isDev: false,
      posthogOrigin: DEFAULT_POSTHOG_ORIGIN,
    });

    assert.equal(
      directive(csp, "script-src"),
      `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${DEFAULT_POSTHOG_ORIGIN}`
    );
    assert.equal(csp.includes("'unsafe-eval'"), false);
  });

  it("keeps Next webpack eval in development alongside WASM", () => {
    const csp = buildContentSecurityPolicy({
      isDev: true,
      posthogOrigin: DEFAULT_POSTHOG_ORIGIN,
    });

    assert.equal(
      directive(csp, "script-src"),
      `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' 'unsafe-eval' ${DEFAULT_POSTHOG_ORIGIN}`
    );
  });

  it("keeps the analytics origin on script-src and connect-src", () => {
    const posthogOrigin = "https://analytics.example.test";
    const csp = buildContentSecurityPolicy({
      isDev: false,
      posthogOrigin,
    });

    assert.equal(
      directive(csp, "script-src"),
      `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${posthogOrigin}`
    );
    assert.equal(
      directive(csp, "connect-src"),
      `connect-src 'self' ${posthogOrigin}`
    );
  });

  it("preserves the rest of the production policy", () => {
    const csp = buildContentSecurityPolicy({
      isDev: false,
      posthogOrigin: DEFAULT_POSTHOG_ORIGIN,
    });

    assert.equal(
      csp,
      [
        "default-src 'self'",
        `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${DEFAULT_POSTHOG_ORIGIN}`,
        `connect-src 'self' ${DEFAULT_POSTHOG_ORIGIN}`,
        "img-src 'self' data:",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
        "upgrade-insecure-requests",
      ].join("; ")
    );
  });
});
