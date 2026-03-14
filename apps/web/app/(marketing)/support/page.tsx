import type { Metadata } from "next";

import { JsonLd } from "@/components/shared/json-ld";
import { buildBreadcrumbSchema, createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Support",
  description:
    "Get help with the Style Capture Chrome extension. Contact us for support, feedback, or general inquiries.",
  path: "/support",
});

export default function SupportPage(): React.JSX.Element {
  return (
    <div className="flex min-h-[calc(100dvh-12rem)] items-center justify-center py-6 md:py-10">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Support", path: "/support" },
        ])}
      />

      <div className="mx-auto max-w-2xl text-center">
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
    </div>
  );
}
