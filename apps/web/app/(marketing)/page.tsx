"use client";

import {
  ApiConnectionIcon,
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

import { InspectRenderer, useInspect } from "@/components/demo/demo-section";
import { JsonLd } from "@/components/shared/json-ld";
import { Button } from "@/components/ui/button";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo";

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
    icon: ApiConnectionIcon,
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
  const inspect = useInspect();
  const handleTryItNow = inspect.activate;

  return (
    <div>
      <JsonLd data={buildWebSiteSchema()} />
      <JsonLd data={buildOrganizationSchema()} />

      {/* Hero */}
      <section className="@container py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="text-balance text-4xl font-medium sm:text-5xl">
            Capture CSS.
            <br />
            Get Tailwind.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Capture rendered CSS from any element on any website and get
            Tailwind utilities — ready to paste into your AI coding agent.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <a href="https://chromewebstore.google.com/detail/style-capture/gnolhcpajlndieinmodljdhcbmdmmepd">
                <ChromeIcon data-icon="inline-start" />
                Add to Chrome — Free
              </a>
            </Button>
            <Button onClick={handleTryItNow} size="lg" variant="secondary">
              <CursorClickIcon data-icon="inline-start" />
              Try it now
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="@container py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-balance text-4xl font-medium">
            Why Style Capture
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 text-sm @sm:grid-cols-2 @xl:grid-cols-3">
            {features.map((feature) => (
              <div className="space-y-3 border-t pt-6" key={feature.title}>
                <feature.icon className="size-4 text-muted-foreground" />
                <p className="text-muted-foreground leading-5">
                  <span className="font-medium text-foreground">
                    {feature.title}
                  </span>{" "}
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chrome extension */}
      <section className="@container py-24" id="extension">
        <div className="mx-auto grid max-w-3xl gap-6 px-6 @2xl:grid-cols-2 @2xl:gap-12">
          <div className="space-y-4">
            <h2 className="text-balance text-4xl font-medium">
              Chrome extension
            </h2>
            <p className="text-muted-foreground">
              Point and click to capture. No setup, no permissions prompts.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 text-sm @sm:grid-cols-3 @2xl:grid-cols-1">
            {extensionSteps.map((step) => (
              <div className="space-y-3 border-t pt-6" key={step.title}>
                <step.icon className="size-4 text-muted-foreground" />
                <p className="text-muted-foreground leading-5">
                  <span className="font-medium text-foreground">
                    {step.title}
                  </span>{" "}
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent skill */}
      <section className="@container py-24" id="skills">
        <div className="mx-auto grid max-w-3xl gap-6 px-6 @2xl:grid-cols-2 @2xl:gap-12">
          <div className="space-y-4">
            <h2 className="text-balance text-4xl font-medium">Agent skill</h2>
            <p className="text-muted-foreground">
              Add Style Capture as a skill for Claude Code, Cursor, or any
              compatible AI agent.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 text-sm @sm:grid-cols-2 @2xl:grid-cols-1">
            <div className="space-y-3 border-t pt-6">
              <PromptIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">
                  Install the skill
                </span>
              </p>
              <code className="block font-mono text-xs text-muted-foreground">
                npx skills add mblode/style-capture -g --all -y
              </code>
            </div>
            <div className="space-y-3 border-t pt-6">
              <SparkleIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">Use it</span>
              </p>
              <code className="block font-mono text-xs text-muted-foreground">
                /style-capture https://linear.app .hero
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* CLI */}
      <section className="@container py-24" id="cli">
        <div className="mx-auto grid max-w-3xl gap-6 px-6 @2xl:grid-cols-2 @2xl:gap-12">
          <div className="space-y-4">
            <h2 className="text-balance text-4xl font-medium">CLI</h2>
            <p className="text-muted-foreground">
              Capture from the terminal. Give it a URL and a selector — it
              launches a headless browser and outputs Tailwind-mapped styles.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 text-sm @sm:grid-cols-2 @2xl:grid-cols-1">
            <div className="space-y-3 border-t pt-6">
              <ConsoleIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">
                  Run directly
                </span>
              </p>
              <code className="block font-mono text-xs text-muted-foreground">
                npx style-capture https://example.com &quot;main&quot;
              </code>
            </div>
            <div className="space-y-3 border-t pt-6">
              <PromptIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">
                  Or install globally
                </span>
              </p>
              <code className="block font-mono text-xs text-muted-foreground">
                npm i -g style-capture
              </code>
            </div>
          </div>
        </div>
      </section>

      <InspectRenderer inspect={inspect} />
    </div>
  );
}
