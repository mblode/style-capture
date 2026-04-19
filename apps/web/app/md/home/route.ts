import { NextResponse } from "next/server";

import { siteUrl } from "@/lib/seo";

const body = `# Style Capture

> Point at any UI. Let your agent rebuild it.

Click any element on any website. Get computed styles and Tailwind mappings your coding agent can act on immediately.

## Why your agent needs this

- **Ground truth** — Computed style, not source CSS. Your agent gets the exact values.
- **Tailwind mapping** — Every property mapped to Tailwind utilities with confidence scores.
- **Three ways to capture** — Chrome extension, CLI, or agent skill.
- **Local only** — All processing happens locally. No data leaves your device.
- **Structured for agents** — Selectors and styles your agent can parse without ambiguity.
- **Instant** — Captured in milliseconds. No network requests.

## Chrome extension

Click, capture, paste. Your agent gets selectors it can grep for directly.

Install: https://chromewebstore.google.com/detail/style-capture/gnolhcpajlndieinmodljdhcbmdmmepd

## CLI

URL and selector in, structured styles out. Runs a headless browser and outputs context your agent can parse.

\`\`\`
npx style-capture https://example.com "main"
\`\`\`

Install globally:

\`\`\`
npm i -g style-capture
\`\`\`

Package: https://www.npmjs.com/package/style-capture

## Agent skill

One slash command. Your agent captures computed styles from any live page directly.

\`\`\`
npx skills add mblode/style-capture
/style-capture https://linear.app .hero
\`\`\`

More: ${siteUrl}/skills

## Discovery

- API catalog: ${siteUrl}/.well-known/api-catalog
- Agent skills: ${siteUrl}/.well-known/agent-skills
- MCP server card: ${siteUrl}/.well-known/mcp/server-card.json
`;

export const GET = (): NextResponse =>
  new NextResponse(body, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
