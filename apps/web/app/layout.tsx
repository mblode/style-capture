import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

const glide = localFont({
  src: [{ path: "../public/glide-variable.woff2" }],
  variable: "--font-glide",
  weight: "400 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://style-capture.blode.co"),
  title: {
    default: "Style Capture",
    template: "%s | Style Capture",
  },
  description: "Style Capture Chrome Extension",
  verification: {
    google: "mFwyBIbXTaKK4uF_NA0MzVWFyY40hPgBjFObg3rje04",
  },
  other: {
    "apple-mobile-web-app-title": "Style Capture",
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
    </html>
  );
}
