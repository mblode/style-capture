import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  dts: false,
  entry: { index: "src/index.ts" },
  format: ["esm"],
  hash: false,
  sourcemap: true,
  target: "es2023",
});
