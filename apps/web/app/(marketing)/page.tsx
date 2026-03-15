import {
  BoltIcon,
  CaptureIcon,
  ChromeIcon,
  ClipboardIcon,
  CodeIcon,
  ConsoleIcon,
  CursorClickIcon,
  MagicWandIcon,
  PromptIcon,
  ShieldCheckIcon,
  SparkleIcon,
} from "blode-icons-react";
import type { Metadata } from "next";

import { JsonLd } from "@/components/shared/json-ld";
import { Button } from "@/components/ui/button";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  createPublicMetadata,
} from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  description:
    "Capture real CSS from any element and map it to Tailwind classes — as a Chrome extension, CLI, or AI agent skill.",
  path: "/",
  title: "Capture CSS, get Tailwind",
});

const extensionSteps = [
  {
    description: "Click the toolbar icon on any site to start picking.",
    icon: CursorClickIcon,
    title: "Activate",
  },
  {
    description:
      "Hover to preview, click to capture. Shift to climb the DOM, Alt to descend.",
    icon: CaptureIcon,
    title: "Select",
  },
  {
    description:
      "Tailwind-mapped styles land on your clipboard, formatted for your agent.",
    icon: ClipboardIcon,
    title: "Paste",
  },
];

const features = [
  {
    description:
      "Captures what the browser actually computes with getComputedStyle — not source CSS.",
    icon: CodeIcon,
    title: "Real rendered styles",
  },
  {
    description:
      "Every property mapped to utilities with confidence scores. No manual conversion.",
    icon: MagicWandIcon,
    title: "Automatic Tailwind mapping",
  },
  {
    description:
      "Extension, CLI, or agent skill — use whichever fits your workflow.",
    icon: BoltIcon,
    title: "Three ways to capture",
  },
  {
    description: "All processing happens locally. No data sent anywhere.",
    icon: ShieldCheckIcon,
    title: "Nothing leaves your device",
  },
  {
    description:
      "Structured output for Claude Code, Cursor, or whichever coding agent you use.",
    icon: SparkleIcon,
    title: "Built for AI agents",
  },
];

export default function HomePage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:py-24">
      <JsonLd data={buildWebSiteSchema()} />
      <JsonLd data={buildOrganizationSchema()} />

      <section className="mb-24 text-center">
        <h1 className="mb-4 font-bold text-4xl tracking-tight lg:text-5xl">
          Capture CSS.
          <br />
          Get Tailwind.
        </h1>
        <p className="mx-auto mb-8 max-w-lg text-lg text-muted-foreground leading-relaxed">
          Capture rendered CSS from any element on any website and get Tailwind
          utilities — ready to paste into your AI coding agent.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <a href="https://chromewebstore.google.com">
              <ChromeIcon data-icon="inline-start" />
              Add to Chrome — Free
            </a>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <a href="#cli">
              <ConsoleIcon data-icon="inline-start" />
              Use the CLI
            </a>
          </Button>
        </div>
      </section>

      <section className="mb-24" id="skills">
        <h2 className="mb-4 text-center font-semibold text-2xl">Agent skill</h2>
        <p className="mx-auto mb-8 max-w-lg text-center text-muted-foreground leading-relaxed">
          Add Style Capture as a skill for Claude Code, Cursor, or any
          compatible AI agent.
        </p>
        <div className="mx-auto max-w-xl space-y-4">
          <div className="rounded-xl bg-secondary p-5">
            <p className="mb-2 flex items-center gap-2 font-semibold text-sm">
              <PromptIcon className="size-4 text-foreground" />
              Install the skill
            </p>
            <code className="block font-mono text-sm text-muted-foreground">
              npx skills add mblode/style-capture -g --all -y
            </code>
          </div>
          <div className="rounded-xl bg-secondary p-5">
            <p className="mb-2 flex items-center gap-2 font-semibold text-sm">
              <SparkleIcon className="size-4 text-foreground" />
              Use it
            </p>
            <code className="block font-mono text-sm text-muted-foreground">
              /style-capture https://linear.app .hero
            </code>
          </div>
        </div>
      </section>

      <section className="mb-24" id="cli">
        <h2 className="mb-4 text-center font-semibold text-2xl">CLI</h2>
        <p className="mx-auto mb-8 max-w-lg text-center text-muted-foreground leading-relaxed">
          Capture from the terminal. Give it a URL and a selector — it launches
          a headless browser and outputs Tailwind-mapped styles.
        </p>
        <div className="mx-auto max-w-xl space-y-4">
          <div className="rounded-xl bg-secondary p-5">
            <p className="mb-2 flex items-center gap-2 font-semibold text-sm">
              <ConsoleIcon className="size-4 text-foreground" />
              Run directly
            </p>
            <code className="block font-mono text-sm text-muted-foreground">
              npx style-capture https://example.com &quot;main&quot;
            </code>
          </div>
          <div className="rounded-xl bg-secondary p-5">
            <p className="mb-2 flex items-center gap-2 font-semibold text-sm">
              <PromptIcon className="size-4 text-foreground" />
              Or install globally
            </p>
            <code className="block font-mono text-sm text-muted-foreground">
              npm i -g style-capture
            </code>
          </div>
        </div>
      </section>

      <section className="mb-24" id="extension">
        <h2 className="mb-4 text-center font-semibold text-2xl">
          Chrome extension
        </h2>
        <p className="mx-auto mb-8 max-w-lg text-center text-muted-foreground leading-relaxed">
          Point and click to capture. No setup, no permissions prompts.
        </p>
        <div className="grid gap-8 md:grid-cols-3">
          {extensionSteps.map((step, index) => (
            <div className="text-center" key={step.title}>
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-secondary">
                <step.icon className="size-6 text-foreground" />
              </div>
              <p className="mb-1 font-mono text-muted-foreground text-xs">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mb-2 font-semibold text-lg">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-24">
        <h2 className="mb-12 text-center font-semibold text-2xl">
          Why Style Capture
        </h2>
        <div className="space-y-8">
          {features.map((feature) => (
            <div className="flex gap-4" key={feature.title}>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <feature.icon className="size-5 text-foreground" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
