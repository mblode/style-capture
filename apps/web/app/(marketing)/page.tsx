import {
  CaptureIcon,
  ChromeIcon,
  ClipboardIcon,
  CodeIcon,
  CursorClickIcon,
  MagicWandIcon,
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
  title: "Capture CSS, get Tailwind",
  description:
    "Chrome extension that captures real CSS from any element and maps it to Tailwind classes for AI coding agents.",
  path: "/",
});

const steps = [
  {
    icon: CursorClickIcon,
    title: "Activate",
    description: "Click the toolbar icon on any site to start picking.",
  },
  {
    icon: CaptureIcon,
    title: "Select",
    description:
      "Hover to preview, click to capture. Shift to climb the DOM, Alt to descend.",
  },
  {
    icon: ClipboardIcon,
    title: "Paste",
    description:
      "Tailwind-mapped styles land on your clipboard, formatted for your agent.",
  },
];

const features = [
  {
    icon: CodeIcon,
    title: "Real rendered styles",
    description:
      "Captures what the browser actually computes with getComputedStyle — not source CSS.",
  },
  {
    icon: MagicWandIcon,
    title: "Automatic Tailwind mapping",
    description:
      "Every property mapped to utilities with confidence scores. No manual conversion.",
  },
  {
    icon: ChromeIcon,
    title: "Any site, zero config",
    description:
      "Works everywhere the moment you click. No setup, no permissions prompts.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Nothing leaves your device",
    description: "All processing happens locally. No data sent anywhere.",
  },
  {
    icon: SparkleIcon,
    title: "Built for AI agents",
    description:
      "Structured output for Claude Code, Cursor, or whichever coding agent you use.",
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
          Click any element on any website. Get its rendered CSS mapped to
          Tailwind utilities, ready to paste into your AI coding agent.
        </p>
        <Button asChild size="lg">
          <a href="https://chromewebstore.google.com">
            <ChromeIcon data-icon="inline-start" />
            Add to Chrome — Free
          </a>
        </Button>
      </section>

      <section className="mb-24">
        <h2 className="mb-12 text-center font-semibold text-2xl">
          How it works
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
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
