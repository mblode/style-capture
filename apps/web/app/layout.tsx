import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

import { defaultOgImage, personName, siteUrl, twitterHandle } from "@/lib/seo";

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
  // Scalar metadata fields merge down, so these two reach every route from
  // here. `twitter.creator` does not: see the note in `createPublicMetadata`.
  authors: [{ name: personName, url: "https://blode.co" }],
  creator: personName,
  description:
    "Give your AI coding agent the exact styles from any website. Chrome extension, CLI, and agent skill.",
  // The zone URL, not the bare origin: Next does not prefix `basePath` onto
  // generated image routes, so `https://blode.co` would resolve a relative
  // og:image against blode.co/opengraph-image and 404.
  metadataBase: new URL(siteUrl),
  // Routes that do not go through `createPublicMetadata` (/store/*, not-found)
  // inherit their whole card from here. Without it they fall back to the app/
  // image file convention, which double-prefixes the zone path, and they carry
  // no og:site_name at all. Their og:title is "Style Capture" from the title
  // default below, so the product is still named once site_name is the person.
  openGraph: {
    images: [{ height: 630, url: defaultOgImage, width: 1200 }],
    siteName: personName,
  },
  other: {
    "apple-mobile-web-app-title": "Style Capture",
  },
  // For the routes that bypass `createPublicMetadata`. Next still synthesises
  // twitter:title and twitter:image from `title` and `openGraph` alongside it.
  twitter: {
    card: "summary_large_image",
    creator: twitterHandle,
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
