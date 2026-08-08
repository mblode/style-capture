import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

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
  metadataBase: new URL("https://blode.co"),
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
