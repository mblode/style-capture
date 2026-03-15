import type { Metadata } from "next";

import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  description:
    "Capture real CSS from any element and map it to Tailwind classes — as a Chrome extension, CLI, or AI agent skill.",
  path: "/",
  title: "Capture CSS, get Tailwind",
});

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100dvh-8rem)]">{children}</main>
      <Footer />
    </>
  );
}
