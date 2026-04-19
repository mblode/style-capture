import { NextResponse } from "next/server";

const body = `# Agent skill

One slash command to capture computed styles from any live page, map them to Tailwind, and return structured context your agent can act on.

## Install

\`\`\`
npx skills add mblode/style-capture -g --all -y
\`\`\`

## Usage

Once installed, point your agent at any live page:

\`\`\`
/style-capture https://linear.app .hero
\`\`\`

Your agent will:

1. Open the URL in a headless browser.
2. Resolve the selector to a single DOM subtree.
3. Capture computed CSS, sanitized HTML, and Tailwind mappings.
4. Return a structured handoff the agent can act on directly.
`;

export const GET = (): NextResponse =>
  new NextResponse(body, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
