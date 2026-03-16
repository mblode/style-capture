"use client";

import {
  ApiConnectionIcon,
  ZapIcon,
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
    description:
      "Click the toolbar icon, hover to preview, click to capture. Shift for parent, Alt for child.",
    icon: CaptureIcon,
    title: "Select",
  },
  {
    description:
      "Computed styles and Tailwind mappings go straight to your clipboard, ready for your agent.",
    icon: ClipboardIcon,
    title: "Paste",
  },
];

const features = [
  {
    description:
      "getComputedStyle, not source CSS. Your agent gets the exact rendered values.",
    icon: CodeIcon,
    title: "Ground truth",
  },
  {
    description:
      "Every property mapped to Tailwind utilities with confidence scores.",
    icon: MagicWandIcon,
    title: "Tailwind mapping",
  },
  {
    description: "Chrome extension, CLI, or slash command.",
    icon: ApiConnectionIcon,
    title: "Three ways to capture",
  },
  {
    description: "All processing happens locally. No data leaves your device.",
    icon: ShieldCheckIcon,
    title: "Local only",
  },
  {
    description:
      "Selectors, computed styles, and Tailwind hints your agent can parse without ambiguity.",
    icon: SparkleIcon,
    title: "Structured for agents",
  },
  {
    description: "Captured in milliseconds. No network requests.",
    icon: ZapIcon,
    title: "Instant",
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
            Point at any UI.
            <br />
            Let your agent rebuild it.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Click any element on any website. Get computed styles and Tailwind
            mappings your coding agent can act on immediately.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <a href="https://chromewebstore.google.com/detail/style-capture/gnolhcpajlndieinmodljdhcbmdmmepd">
                <ChromeIcon data-icon="inline-start" />
                Add to Chrome - free
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
            Why your agent needs this
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
              Click, capture, paste. Your agent gets selectors it can grep for
              directly.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 text-sm @sm:grid-cols-2 @2xl:grid-cols-1">
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
              One slash command. Your agent captures computed styles from any
              live page directly.
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
                <span className="font-medium text-foreground">
                  Point at any page
                </span>
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
              URL and selector in, structured styles out. Runs a headless
              browser and outputs context your agent can parse.
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
