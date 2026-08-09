import type { Metadata } from "next";

import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { WebMcpProvider } from "@/components/shared/web-mcp";
import { createPublicMetadata, homeDescription } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  description: homeDescription,
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
