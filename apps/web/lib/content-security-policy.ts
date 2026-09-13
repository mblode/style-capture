export const DEFAULT_POSTHOG_ORIGIN = "https://r.blode.co";

interface ContentSecurityPolicyOptions {
  isDev: boolean;
  posthogOrigin: string;
}

// Everything this app loads is same-origin: fonts are `next/font/local`, the
// share card lives in `public/`, and the only off-site links are navigations
// rather than subresources. So the policy is 'self' plus the analytics origin.
// 'unsafe-inline' covers Next's own bootstrap script and inline styles.
//
// The homepage client bundle statically imports Shiki (`codeToHtml`) for the
// demo capture panel. Shiki's Oniguruma engine compiles an inlined WASM
// module via WebAssembly.instantiate — Chrome and Firefox require
// 'wasm-unsafe-eval' in script-src for that. Production stays off
// 'unsafe-eval'; Next's webpack eval is a dev-only need.
export const buildContentSecurityPolicy = ({
  isDev,
  posthogOrigin,
}: ContentSecurityPolicyOptions): string =>
  [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""} ${posthogOrigin}`,
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
