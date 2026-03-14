import { fileURLToPath, URL } from "node:url";

import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { createLogger, defineConfig } from "vite";
import type { Plugin } from "vite";
import zip from "vite-plugin-zip-pack";

import manifest from "./manifest.config.ts";

// CRXJS was built for Rollup. Vite 8 uses Rolldown and syncs
// rollupOptions ↔ rolldownOptions, which causes two harmless warnings:
//   1. "Both rollupOptions and rolldownOptions were specified by crx:*"
//   2. "Unknown input options: platform"
// Filter the first at the logger level; fix the second by stripping
// `platform` from the resolved rollupOptions before CRXJS reads it.

const logger = createLogger();
const _warn = logger.warn;
logger.warn = (msg, options) => {
  if (
    typeof msg === "string" &&
    msg.includes("rollupOptions") &&
    msg.includes("rolldownOptions")
  ) {
    return;
  }
  _warn(msg, options);
};

const crxVite8Compat = (): Plugin => ({
  configResolved(config) {
    const ro = config.build.rollupOptions;
    if (ro && "platform" in ro) {
      delete (ro as Record<string, unknown>).platform;
    }
  },
  name: "crx-vite8-compat",
});

export default defineConfig({
  customLogger: logger,
  plugins: [
    react(),
    crx({ manifest }),
    crxVite8Compat(),
    zip({
      outDir: "release",
      outFileName: "style-capture.zip",
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("src", import.meta.url)),
    },
  },
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});
