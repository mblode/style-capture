import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

const glide = localFont({
  display: "swap",
  src: [{ path: "../public/glide-variable.woff2" }],
  variable: "--font-glide",
  weight: "400 900",
});

export const metadata: Metadata = {
  description: "Style Capture Chrome Extension",
  metadataBase: new URL("https://style-capture.blode.co"),
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
    <html className={glide.variable} lang="en">
      <body className="antialiased">{children}</body>
      <GoogleAnalytics gaId="G-7XGBDRVZQR" />
    </html>
  );
}
