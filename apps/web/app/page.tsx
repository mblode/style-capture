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
import Link from "next/link";
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
    "Chrome extension that captures computed CSS from any element, maps it to Tailwind utilities, and copies a Claude-ready prompt to your clipboard.",
  path: "/",
});

const steps = [
  {
    icon: CursorClickIcon,
    title: "Click the icon",
    description: "Click the toolbar icon to activate the element picker.",
  },
  {
    icon: CaptureIcon,
    title: "Pick an element",
    description:
      "Hover and click to select any element. Shift to climb up, Alt to descend.",
  },
  {
    icon: ClipboardIcon,
    title: "Paste into Claude",
    description:
      "A structured prompt with CSS and Tailwind suggestions is copied to your clipboard.",
  },
];

const features = [
  {
    icon: CodeIcon,
    title: "Computed CSS, not source CSS",
    description:
      "Captures the actual rendered styles from getComputedStyle — what the browser is really using.",
  },
  {
    icon: MagicWandIcon,
    title: "Tailwind utility mapping",
    description:
      "Automatically suggests Tailwind classes with confidence scores and review notes.",
  },
  {
    icon: ChromeIcon,
    title: "Works on any website",
    description:
      "Activates on demand via activeTab — no persistent permissions, no content scripts.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Privacy first",
    description:
      "All processing happens locally on your device. No data is sent off-device.",
  },
  {
    icon: SparkleIcon,
    title: "Claude-ready output",
    description:
      "Structured prompt format designed for AI-assisted development with Claude.",
  },
];

export default function HomePage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:py-24">
      <JsonLd data={buildWebSiteSchema()} />
      <JsonLd data={buildOrganizationSchema()} />

      <main>
        <section className="mb-24 text-center">
          <h1 className="mb-4 font-bold text-4xl tracking-tight lg:text-5xl">
            Capture CSS.
            <br />
            Get Tailwind.
          </h1>
          <p className="mx-auto mb-8 max-w-lg text-lg text-muted-foreground leading-relaxed">
            A Chrome extension that captures computed CSS from any element, maps
            it to Tailwind utilities, and copies a Claude-ready prompt to your
            clipboard.
          </p>
          <Button asChild size="lg">
            <a href="https://chromewebstore.google.com">
              <ChromeIcon data-icon="inline-start" />
              Add to Chrome
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
          <h2 className="mb-12 text-center font-semibold text-2xl">Features</h2>
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
      </main>

      <footer className="border-border border-t pt-8 text-center text-muted-foreground text-sm">
        <nav className="mb-4 flex justify-center gap-6">
          <Link
            className="transition-colors hover:text-foreground"
            href="/privacy"
          >
            Privacy
          </Link>
          <Link
            className="transition-colors hover:text-foreground"
            href="/terms"
          >
            Terms
          </Link>
          <Link
            className="transition-colors hover:text-foreground"
            href="/support"
          >
            Support
          </Link>
        </nav>
        <p>
          Created by{" "}
          <a
            className="underline underline-offset-4 transition-colors hover:text-foreground"
            href="https://blode.co"
            rel="noopener noreferrer"
            target="_blank"
          >
            Matthew Blode
          </a>
        </p>
      </footer>
    </div>
  );
}
