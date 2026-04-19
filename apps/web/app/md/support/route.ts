import { NextResponse } from "next/server";

const body = `# Support

Style Capture is an open source project. Report issues, ask questions, or request features on GitHub.

- Issues: https://github.com/mblode/style-capture/issues
- Repository: https://github.com/mblode/style-capture
`;

export const GET = (): NextResponse =>
  new NextResponse(body, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
