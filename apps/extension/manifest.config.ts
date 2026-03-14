import { defineManifest } from "@crxjs/vite-plugin";

import packageJson from "./package.json" with { type: "json" };

export default defineManifest({
  action: {
    default_icon: {
      128: "public/icons/icon-128.png",
      16: "public/icons/icon-16.png",
      32: "public/icons/icon-32.png",
      48: "public/icons/icon-48.png",
    },
    default_title: "Style Capture",
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  description:
    "Capture computed CSS from a selected DOM subtree and prepare it for Tailwind conversion.",
  icons: {
    128: "public/icons/icon-128.png",
    16: "public/icons/icon-16.png",
    32: "public/icons/icon-32.png",
    48: "public/icons/icon-48.png",
  },
  manifest_version: 3,
  name: "Style Capture",
  options_page: "options.html",
  permissions: ["activeTab", "scripting", "storage"],
  version: packageJson.version,
});
