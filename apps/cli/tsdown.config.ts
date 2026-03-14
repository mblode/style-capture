import { defineConfig } from "tsdown";

export default defineConfig([
  {
    clean: true,
    entry: { cli: "src/cli.ts" },
    format: ["esm"],
    noExternal: [/^@style-capture\/core$/],
    outputOptions: {
      banner: "#!/usr/bin/env node",
    },
    sourcemap: true,
    target: "node22",
  },
]);
