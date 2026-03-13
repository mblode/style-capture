import { defineManifest } from "@crxjs/vite-plugin";

import packageJson from "./package.json" with { type: "json" };

export default defineManifest({
  manifest_version: 3,
  name: "Style Capture",
  version: packageJson.version,
  description:
    "Capture computed CSS from a selected DOM subtree and prepare it for Tailwind conversion.",
  action: {
    default_icon: {
      16: "public/icons/icon-16.png",
      32: "public/icons/icon-32.png",
      48: "public/icons/icon-48.png",
      128: "public/icons/icon-128.png",
    },
    default_title: "Style Capture",
  },
  icons: {
    16: "public/icons/icon-16.png",
    32: "public/icons/icon-32.png",
    48: "public/icons/icon-48.png",
    128: "public/icons/icon-128.png",
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  options_page: "options.html",
  permissions: ["activeTab", "scripting", "storage"],
  web_accessible_resources: [
    {
      matches: ["<all_urls>"],
      resources: [
        "public/icons/icon-active-16.png",
        "public/icons/icon-active-32.png",
        "public/icons/icon-active-48.png",
        "public/icons/icon-active-128.png",
      ],
    },
  ],
});
