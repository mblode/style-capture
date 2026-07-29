import { NextResponse } from "next/server";

import { siteUrl } from "@/lib/seo";

// AI-open on purpose: crawl, index, ground and train are all permitted, so a
// single `*` group states the whole policy. No `Content-Signal:` line: signals
// are a reservation mechanism, so silence already means no restriction is
// expressed, and an all-yes signal only adds an unknown-directive warning in
// Search Console.
const body = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

export const GET = (): NextResponse =>
  new NextResponse(body, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
