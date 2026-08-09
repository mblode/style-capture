import type { Metadata } from "next";

import { basePath } from "@/lib/config";

const siteName = "Style Capture";
const host = "https://blode.co";
export const siteUrl = `${host}${basePath}`;
const defaultOgImage = `${siteUrl}/opengraph-image.png`;
const repoUrl = "https://github.com/mblode/style-capture";

export const homeDescription =
  "Click any element on any website. Get computed styles and Tailwind mappings your coding agent can act on immediately.";

interface PublicMetadataOptions {
  description: string;
  path: string;
  title: string;
}

interface BreadcrumbItem {
  name: string;
  path: string;
}

export const createPublicMetadata = ({
  description,
  path,
  title,
}: PublicMetadataOptions): Metadata => {
  const url = path === "/" ? siteUrl : `${siteUrl}${path}`;

  return {
    alternates: {
      canonical: url,
    },
    description,
    openGraph: {
      description,
      images: [
        {
          alt: `${siteName} preview`,
          height: 630,
          url: defaultOgImage,
          width: 1200,
        },
      ],
      siteName,
      title,
      type: "website",
      url,
    },
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [defaultOgImage],
      title,
    },
  };
};

export const buildBreadcrumbSchema = (
  items: BreadcrumbItem[]
): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    item: item.path === "/" ? siteUrl : `${siteUrl}${item.path}`,
    name: item.name,
    position: index + 1,
  })),
});

/**
 * Stable `@id` anchors so this zone's nodes resolve into one entity rather than
 * a handful of disconnected snippets.
 *
 * The Person, Organization and WebSite ids belong to blode.co and are only ever
 * referenced here, never redefined. blode.co/style-capture is a path on
 * blode.co behind a rewrite, not a site of its own: redefining them would
 * publish a second Matthew Blode and a second website on one domain. Contract:
 * blode-co/apps/web/.claude/knowledge/zone-conventions.md
 */
const schemaId = {
  breadcrumb: `${siteUrl}/#breadcrumb`,
  organization: `${host}/#organization`,
  person: `${host}/#person`,
  software: `${siteUrl}/#software`,
  webPage: `${siteUrl}/#webpage`,
  website: `${host}/#website`,
} as const;

/** One `@graph` for the zone root. Emit it from a single `ld+json` script. */
export const buildHomeGraph = (): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@id": schemaId.webPage,
      "@type": "WebPage",
      about: { "@id": schemaId.software },
      breadcrumb: { "@id": schemaId.breadcrumb },
      description: homeDescription,
      inLanguage: "en-US",
      isPartOf: { "@id": schemaId.website },
      name: siteName,
      url: siteUrl,
    },
    // SoftwareSourceCode, not SoftwareApplication. Google's Software App rich
    // result requires `offers` plus one of `aggregateRating` or `review`, and
    // its review guidelines forbid ratings we author about our own package, so
    // a SoftwareApplication node here could only ever fail validation.
    {
      "@id": schemaId.software,
      "@type": "SoftwareSourceCode",
      author: { "@id": schemaId.person },
      codeRepository: repoUrl,
      description: homeDescription,
      isAccessibleForFree: true,
      isPartOf: { "@id": schemaId.website },
      license: "https://opensource.org/licenses/MIT",
      name: siteName,
      programmingLanguage: "TypeScript",
      publisher: { "@id": schemaId.organization },
      url: siteUrl,
    },
    {
      "@id": schemaId.breadcrumb,
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          item: `${host}/`,
          name: "Matthew Blode",
          position: 1,
        },
        {
          "@type": "ListItem",
          item: `${host}/projects`,
          name: "Projects",
          position: 2,
        },
        { "@type": "ListItem", item: siteUrl, name: siteName, position: 3 },
      ],
    },
  ],
});
