export default {
  "*.{js,jsx,ts,tsx,json,jsonc,css,scss,md,mdx}": (filenames) =>
    `npx ultracite fix ${filenames.map((f) => `"${f}"`).join(" ")}`,
};
