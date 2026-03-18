"use client";

import {
  ZapIcon,
  Cursor1Icon,
  ChromeIcon,
  ClipboardIcon,
  CodeIcon,
  ConsoleIcon,
  MagicWandIcon,
  GlobusIcon,
  ShieldCheckIcon,
  FileDownloadIcon,
  SparkleIcon,
  ArrowRightIcon,
} from "blode-icons-react";
import { SplitText } from "griffo/motion";
import { stagger } from "motion";
import { motion } from "motion/react";
import Link from "next/link";

import { InspectRenderer, useInspect } from "@/components/demo/demo-section";
import { JsonLd } from "@/components/shared/json-ld";
import { Button } from "@/components/ui/button";
import {
  buildOrganizationSchema,
  buildSoftwareApplicationSchema,
  buildWebSiteSchema,
} from "@/lib/seo";

const extensionSteps = [
  {
    description:
      "Click the toolbar icon, hover to preview, click to capture. Shift for parent, Alt for child.",
    icon: Cursor1Icon,
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
      "Computed style, not source CSS. Your agent gets the exact values.",
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
    description: "Chrome extension, CLI, or agent skills.",
    icon: ChromeIcon,
    title: "Three ways to capture",
  },
  {
    description: "All processing happens locally. No data leaves your device.",
    icon: ShieldCheckIcon,
    title: "Local only",
  },
  {
    description: "Selectors and styles your agent can parse without ambiguity.",
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
      <JsonLd data={buildSoftwareApplicationSchema()} />

      {/* Hero */}
      <section className="@container py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <SplitText
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            as="h1"
            className="text-balance text-4xl font-medium tracking-tight leading-[1.2] sm:text-5xl sm:tracking-[-0.03em] sm:leading-[1.15]"
            initial={{ filter: "blur(8px)", opacity: 0, y: 20 }}
            options={{ type: "words" }}
            transition={{
              delay: stagger(0.05),
              duration: 0.65,
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            <p>Point at any UI. Let your agent rebuild it.</p>
          </SplitText>
          <motion.p
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            className="mx-auto mt-4 max-w-[60ch] text-lg text-muted-foreground leading-relaxed"
            initial={{ filter: "blur(10px)", opacity: 0, y: 8 }}
            transition={{
              delay: 0.6,
              duration: 0.65,
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            Click any element on any website. Get computed styles and Tailwind
            mappings your coding agent can act on immediately.
          </motion.p>
          <motion.div
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
            initial={{ filter: "blur(10px)", opacity: 0, y: 4 }}
            transition={{
              delay: 0.8,
              duration: 0.65,
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            <Button
              render={
                // eslint-disable-next-line jsx-a11y/anchor-has-content -- content provided by Button children via base-ui render prop
                <a
                  href="https://chromewebstore.google.com/detail/style-capture/gnolhcpajlndieinmodljdhcbmdmmepd"
                  rel="noopener noreferrer"
                  target="_blank"
                />
              }
              size="lg"
            >
              <ChromeIcon data-icon="inline-start" />
              Add to Chrome
            </Button>
            <Button
              className={
                inspect.isInspecting
                  ? "bg-[#4389F5] text-white hover:bg-[#4389F5]/90 dark:bg-[#65ABFF] dark:text-black dark:hover:bg-[#65ABFF]/90"
                  : undefined
              }
              onClick={
                inspect.isInspecting ? inspect.deactivate : handleTryItNow
              }
              size="lg"
              variant={inspect.isInspecting ? undefined : "secondary"}
            >
              <Cursor1Icon data-icon="inline-start" />
              Try it now
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="@container pt-8 pb-16 sm:pt-16 sm:pb-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-balance text-3xl font-medium tracking-tight leading-[1.15]">
            Why your agent needs this
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 text-sm @sm:grid-cols-2 @xl:grid-cols-3">
            {features.map((feature) => (
              <div
                className="feature-card space-y-3 border-t pt-6"
                key={feature.title}
              >
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
      <section className="@container py-16 sm:py-24" id="extension">
        <div className="mx-auto grid max-w-3xl gap-6 px-6 @2xl:grid-cols-2 @2xl:gap-12">
          <div className="space-y-4">
            <h2 className="text-balance text-3xl font-medium tracking-tight leading-[1.15]">
              Chrome extension
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Click, capture, paste. Your agent gets selectors it can grep for
              directly.
            </p>
            <Button
              render={
                // eslint-disable-next-line jsx-a11y/anchor-has-content -- content provided by Button children via base-ui render prop
                <a
                  href="https://chromewebstore.google.com/detail/style-capture/gnolhcpajlndieinmodljdhcbmdmmepd"
                  rel="noopener noreferrer"
                  target="_blank"
                />
              }
            >
              <ChromeIcon data-icon="inline-start" />
              Add to Chrome
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 text-sm @sm:grid-cols-2 @2xl:grid-cols-1">
            {extensionSteps.map((step) => (
              <div
                className="feature-card space-y-3 border-t pt-6"
                key={step.title}
              >
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

      {/* CLI */}
      <section className="@container py-16 sm:py-24" id="cli">
        <div className="mx-auto grid max-w-3xl gap-6 px-6 @2xl:grid-cols-2 @2xl:gap-12">
          <div className="space-y-4">
            <h2 className="text-balance text-3xl font-medium tracking-tight leading-[1.15]">
              CLI
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              URL and selector in, structured styles out. Runs a headless
              browser and outputs context your agent can parse.
            </p>
            <Button
              render={
                // eslint-disable-next-line jsx-a11y/anchor-has-content -- content provided by Button children via base-ui render prop
                <a
                  href="https://www.npmjs.com/package/style-capture"
                  rel="noopener noreferrer"
                  target="_blank"
                />
              }
            >
              View on npm
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 text-sm @sm:grid-cols-2 @2xl:grid-cols-1">
            <div className="feature-card space-y-3 border-t pt-6">
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
            <div className="feature-card space-y-3 border-t pt-6">
              <GlobusIcon className="size-4 text-muted-foreground" />
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

      {/* Agent skill */}
      <section className="@container py-16 sm:py-24" id="skills">
        <div className="mx-auto grid max-w-3xl gap-6 px-6 @2xl:grid-cols-2 @2xl:gap-12">
          <div className="space-y-4">
            <h2 className="text-balance text-3xl font-medium tracking-tight leading-[1.15]">
              Agent skill
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              One slash command. Your agent captures computed styles from any
              live page directly.
            </p>
            <Button
              render={
                // eslint-disable-next-line jsx-a11y/anchor-has-content -- content provided by Button children via base-ui render prop
                <Link href="/skills" />
              }
            >
              Add skill
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 text-sm @sm:grid-cols-2 @2xl:grid-cols-1">
            <div className="feature-card space-y-3 border-t pt-6">
              <FileDownloadIcon className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-5">
                <span className="font-medium text-foreground">
                  Install the skill
                </span>
              </p>
              <code className="block font-mono text-xs text-muted-foreground">
                npx skills add mblode/style-capture
              </code>
            </div>
            <div className="feature-card space-y-3 border-t pt-6">
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

      <InspectRenderer inspect={inspect} />
    </div>
  );
}
