import { NextResponse } from "next/server";

import { siteUrl } from "@/lib/seo";

const body = `# Terms

Style Capture is provided as-is under the terms published at ${siteUrl}/terms.
`;

export const GET = (): NextResponse =>
  new NextResponse(body, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
