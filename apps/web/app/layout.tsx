import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

import { defaultOgImage, siteUrl } from "@/lib/seo";

const glide = localFont({
  display: "swap",
  src: [
    { path: "./fonts/glide-variable.woff2", style: "normal" },
    { path: "./fonts/glide-variable-italic.woff2", style: "italic" },
  ],
  variable: "--font-glide",
  weight: "100 950",
});

const glideMono = localFont({
  display: "swap",
  src: "./fonts/glide-mono.woff2",
  variable: "--font-glide-mono",
  weight: "400",
});

export const metadata: Metadata = {
  description:
    "Give your AI coding agent the exact styles from any website. Chrome extension, CLI, and agent skill.",
  // The zone URL, not the bare origin: Next does not prefix `basePath` onto
  // generated image routes, so `https://blode.co` would resolve a relative
  // og:image against blode.co/opengraph-image and 404.
  metadataBase: new URL(siteUrl),
  // Routes that do not go through `createPublicMetadata` (/store/*, not-found)
  // inherit a card from here. Without it they fall back to the app/ image file
  // convention, which double-prefixes the zone path.
  openGraph: {
    images: [{ height: 630, url: defaultOgImage, width: 1200 }],
  },
  other: {
    "apple-mobile-web-app-title": "Style Capture",
  },
  title: {
    default: "Style Capture",
    template: "%s | Style Capture",
  },
  verification: {
    google: "mFwyBIbXTaKK4uF_NA0MzVWFyY40hPgBjFObg3rje04",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${glide.variable} ${glideMono.variable}`} lang="en">
      <head>
        <link href={process.env.NEXT_PUBLIC_POSTHOG_HOST} rel="preconnect" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
