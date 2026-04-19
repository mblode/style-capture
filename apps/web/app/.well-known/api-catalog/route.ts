import { NextResponse } from "next/server";

import { siteUrl } from "@/lib/seo";

interface LinksetLink {
  href: string;
  type?: string;
  title?: string;
}

interface LinksetEntry {
  anchor: string;
  [rel: string]: string | LinksetLink[];
}

const linkset: { linkset: LinksetEntry[] } = {
  linkset: [
    {
      anchor: `${siteUrl}/.well-known/agent-skills`,
      "service-desc": [
        {
          href: `${siteUrl}/.well-known/agent-skills`,
          title: "Agent Skills discovery (agentskills.io)",
          type: "application/json",
        },
      ],
      "service-doc": [
        {
          href: `${siteUrl}/skills`,
          title: "Style Capture agent skill documentation",
          type: "text/html",
        },
      ],
    },
    {
      anchor: "https://www.npmjs.com/package/style-capture",
      "service-desc": [
        {
          href: "https://registry.npmjs.org/style-capture",
          title: "style-capture CLI package metadata",
          type: "application/json",
        },
      ],
      "service-doc": [
        {
          href: "https://github.com/mblode/style-capture#readme",
          title: "Style Capture CLI documentation",
          type: "text/html",
        },
      ],
      status: [
        {
          href: "https://registry.npmjs.org/-/ping",
          title: "npm registry status",
          type: "application/json",
        },
      ],
    },
    {
      anchor:
        "https://chromewebstore.google.com/detail/style-capture/gnolhcpajlndieinmodljdhcbmdmmepd",
      "service-doc": [
        {
          href: `${siteUrl}/#extension`,
          title: "Style Capture Chrome extension",
          type: "text/html",
        },
      ],
    },
  ],
};

export const GET = (): NextResponse =>
  NextResponse.json(linkset, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/linkset+json",
    },
  });
