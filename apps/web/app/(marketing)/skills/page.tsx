import type { Metadata } from "next";

import { JsonLd } from "@/components/shared/json-ld";
import { buildBreadcrumbSchema, createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  description:
    "One slash command to capture computed styles and Tailwind mappings from any website. Works with Claude Code, Cursor, and any skills.sh-compatible agent.",
  path: "/skills",
  title: "Agent skill to capture live UI styles",
});

export default function SkillsPage(): React.JSX.Element {
  return (
    <div className="py-24">
      <JsonLd
        data={buildBreadcrumbSchema({ name: "Agent skill", path: "/skills" })}
      />

      <div className="mx-auto max-w-3xl space-y-16 px-6">
        <div className="space-y-4">
          <h1 className="text-balance text-4xl font-medium tracking-tight leading-[1.1] sm:text-5xl sm:tracking-[-0.03em] sm:leading-[1.05]">
            Agent skill
          </h1>
          <p className="text-muted-foreground">
            One slash command to capture computed styles from any live page, map
            them to Tailwind, and return structured context your agent can act
            on.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-medium tracking-[-0.02em]">Install</h2>
          <p className="text-muted-foreground">
            Run this command to give your agent the Style Capture skill:
          </p>
          <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 font-mono text-sm">
            npx skills add mblode/style-capture -g --all -y
          </pre>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-medium tracking-[-0.02em]">Usage</h2>
          <p className="text-muted-foreground">
            Once installed, point your agent at any live page:
          </p>
          <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 font-mono text-sm">
            /style-capture https://example.com .hero
          </pre>
          <p className="text-muted-foreground">
            The skill launches a headless browser, captures computed CSS, maps
            to Tailwind, and returns selectors your agent can grep for, styles
            it can trust, and hints it can apply directly.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-medium tracking-[-0.02em]">
            Compatible agents
          </h2>
          <ul className="list-inside list-disc space-y-2 text-muted-foreground">
            <li>Claude Code</li>
            <li>Cursor</li>
            <li>
              Any agent that supports the{" "}
              <a
                className="text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
                href="https://www.skills.sh"
              >
                skills.sh
              </a>{" "}
              format
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-medium tracking-[-0.02em]">Options</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pr-6 font-medium">Argument</th>
                  <th className="pb-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-3 pr-6 font-mono text-foreground">url</td>
                  <td className="py-3">The page URL to capture from</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 pr-6 font-mono text-foreground">
                    selector
                  </td>
                  <td className="py-3">
                    CSS selector for the element to capture
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 pr-6 font-mono text-foreground">
                    --mode curated
                  </td>
                  <td className="py-3">
                    Common visual properties only (default)
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-6 font-mono text-foreground">
                    --mode full
                  </td>
                  <td className="py-3">All computed styles</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
