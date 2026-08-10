import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

import { personName, siteUrl, twitterHandle } from "@/lib/seo";

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
  // The zone URL, not the bare origin (Rule 11). Only correct because the card
  // is a generated `opengraph-image.tsx` route: Next does not prefix those with
  // `basePath`, so `metadataBase` supplies the prefix exactly once. Against the
  // static PNG this replaced, the two would have stacked into
  // `/style-capture/style-capture/…`.
  metadataBase: new URL(siteUrl),
  // No `images` here: `app/opengraph-image.tsx` is the card. Next reuses it for
  // `twitter:image` too when there is no `twitter-image` file. Routes that
  // bypass `createPublicMetadata` (/store/*, not-found) still get the card via
  // the file convention, and siteName from here.
  openGraph: {
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
