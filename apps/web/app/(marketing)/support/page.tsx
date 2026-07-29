import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/shared/json-ld";
import { buildBreadcrumbSchema, createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  description:
    "Get help with the Style Capture Chrome extension. Contact us for support, feedback, or general inquiries.",
  path: "/support",
  title: "Support and help with the Chrome extension",
});

export default function SupportPage(): React.JSX.Element {
  return (
    <div className="py-12 md:py-20">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Support", path: "/support" },
        ])}
      />

      <div className="mx-auto max-w-2xl px-6">
        <div className="text-center">
          <h1 className="h1 mb-6">Support</h1>

          <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
            Have a question or feedback? Get in touch.
          </p>

          <a
            className="font-medium text-2xl underline underline-offset-4 transition-colors hover:text-muted-foreground"
            href="mailto:m@blode.co"
          >
            m@blode.co
          </a>
        </div>

        <div className="mt-16 space-y-10">
          <section className="space-y-4">
            <h2 className="font-medium text-2xl tracking-[-0.02em]">
              What to include
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Style Capture does all its work in your browser and sends nothing
              anywhere, which is good for your privacy and unhelpful for me:
              when a capture goes wrong, there is no log on my end to go and
              read. So the more of this you can put in the email, the faster it
              gets sorted. The URL of the page you were capturing, roughly which
              element you clicked, what actually landed on your clipboard, and
              what you expected instead. A screenshot with the highlight over
              the element is often enough on its own.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-medium text-2xl tracking-[-0.02em]">
              Things that are not bugs
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The extension can only see a tab once you have clicked its toolbar
              icon. That is the activeTab permission working as intended, and it
              is why nothing happens on a page until you start a capture. Chrome
              also blocks extensions outright on its own pages, on the Chrome
              Web Store, and on a handful of other reserved URLs, so a capture
              there will fail however many times you try it. If you need styles
              from a page the extension cannot reach, the CLI and the{" "}
              <Link
                className="underline underline-offset-4 hover:text-foreground"
                href="/skills"
              >
                agent skill
              </Link>{" "}
              capture the same thing from a headless browser instead.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
