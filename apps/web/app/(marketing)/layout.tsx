import type { Metadata } from "next";

import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { WebMcpProvider } from "@/components/shared/web-mcp";
import { createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  description:
    "Click any element on any website. Get computed styles and Tailwind mappings your coding agent can act on immediately.",
  path: "/",
  title: "Point at any UI, let your agent rebuild it",
});

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100dvh-8rem)] pt-16">{children}</main>
      <Footer />
      <WebMcpProvider />
    </>
  );
}
