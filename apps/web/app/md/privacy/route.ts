import { NextResponse } from "next/server";

import { siteUrl } from "@/lib/seo";

const body = `# Privacy

Style Capture processes captured CSS locally. No page data is uploaded by this site or the official extension and CLI.

See the full policy at ${siteUrl}/privacy.
`;

export const GET = (): NextResponse =>
  new NextResponse(body, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
