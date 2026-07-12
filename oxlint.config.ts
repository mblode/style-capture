import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";

export default defineConfig({
  extends: [core, react, next],
  ignorePatterns: [
    ...core.ignorePatterns,
    "**/dist-zip/**",
    "**/evals/results/**",
    "**/release/**",
    "**/store/generated/**",
    "**/store/screenshots/**",
  ],
  rules: {
    "control-has-associated-label": "off",
    curly: "off",
    "func-style": "off",
    "no-await-in-loop": "off",
    "no-danger": "off",
    "prefer-destructuring": "off",
    "prefer-export-from": "off",
    "prefer-import-meta-properties": "off",
    "prefer-named-capture-group": "off",
    "prefer-number-coercion": "off",
    "prefer-single-call": "off",
    "prefer-template": "off",
    "require-unicode-regexp": "off",
    "sort-keys": "off",
    "text-encoding-identifier-case": "off",
    "unicorn/import-style": "off",
    "vitest/prefer-called-times": "off",
  },
});
