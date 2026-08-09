/**
 * This app is served at blode.co/style-capture, proxied by the blode.co host
 * app's multi-zone rewrite. `basePath` is imported by next.config.ts so the
 * prefix lives in exactly one place.
 */
export const basePath = "/style-capture";

/**
 * `basePath` covers next/link, next/image and route handlers. It does NOT cover
 * raw `<a href>`, `<img src>`, or manifest icon paths, so those go through this
 * helper.
 */
export const asset = (path: string) => `${basePath}${path}`;
