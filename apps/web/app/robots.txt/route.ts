import { NextResponse } from "next/server";

import { siteUrl } from "@/lib/seo";

const body = `# Content preferences for automated agents
# See https://contentsignals.org
Content-Signal: search=yes, ai-input=yes, ai-train=no

User-agent: *
Allow: /
Content-Signal: search=yes, ai-input=yes, ai-train=no

Sitemap: ${siteUrl}/sitemap.xml
`;

export const GET = (): NextResponse =>
  new NextResponse(body, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
