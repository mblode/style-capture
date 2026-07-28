import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  assetPrefix: "/style-capture",
  basePath: "/style-capture",
  typescript: { ignoreBuildErrors: true },
  reactCompiler: true,
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
