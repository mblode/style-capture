import type { NextConfig } from "next";

import { basePath } from "./lib/config";

const nextConfig: NextConfig = {
  assetPrefix: basePath,
  basePath,
  reactCompiler: true,
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
