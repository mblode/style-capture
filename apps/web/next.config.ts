import type { NextConfig } from "next";

import { basePath } from "./lib/config";

const isDev = process.env.NODE_ENV === "development";

// Analytics is proxied through r.blode.co so tracker blockers do not drop it.
// Defaulted rather than left empty: an unset var would compile down to
// `connect-src 'self'`, which silently blocks PostHog outright — the exact
// state blode.co/dnd-grid shipped before this sweep.
const posthogOrigin =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://r.blode.co";

// Everything this app loads is same-origin: fonts are `next/font/local`, the
// share card lives in `public/`, and the only off-site links are navigations
// rather than subresources. So the policy is 'self' plus the analytics origin.
// 'unsafe-inline' covers Next's own bootstrap script and inline styles.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${posthogOrigin}`,
  `connect-src 'self' ${posthogOrigin}`,
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // SAMEORIGIN rather than DENY, and this is the pair that says so: blode.co
  // serves this app through a rewrite, so 'self' is blode.co.
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  assetPrefix: basePath,
  basePath,
  reactCompiler: true,
  headers() {
    // Every matching rule applies in array order and a later one wins per
    // header key, so a catch-all must come FIRST and per-route overrides after
    // it. Listed last it silently overwrites every specific rule above it.
    //
    // The pattern is `/:path*` and not `/(.*)`: with `basePath` set Next
    // prefixes the source, and `/style-capture/(.*)` does not match the bare
    // `/style-capture` — the zone root, and the most-visited URL here. That
    // miss is live on blode.co/allmd and blode.co/stratasync today, where
    // inner pages carry the full policy and the landing page carries none.
    return Promise.resolve([{ headers: securityHeaders, source: "/:path*" }]);
  },
  // 16.3: run the React Compiler through Turbopack's native Rust pass instead
  // of the Babel plugin, so no Babel step is needed in the build.
  experimental: { turbopackRustReactCompiler: true },
  redirects() {
    return Promise.resolve([
      {
        basePath: false,
        destination: "https://blode.co/style-capture",
        has: [{ type: "host" as const, value: "style-capture.blode.co" }],
        permanent: true,
        source: "/",
      },
      {
        basePath: false,
        destination: "https://blode.co/style-capture/:path*",
        has: [{ type: "host" as const, value: "style-capture.blode.co" }],
        permanent: true,
        source: "/:path*",
      },
    ]);
  },
};

export default nextConfig;
