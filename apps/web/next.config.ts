import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
