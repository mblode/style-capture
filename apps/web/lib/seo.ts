import type { Metadata } from "next";

import { basePath } from "@/lib/config";

const siteName = "Style Capture";
/**
 * `og:site_name`, deliberately the person and not the product. The 33 zones are
 * one site, and the product is already in `og:title`, so this is the only slot
 * in the card that can say who made the thing.
 */
export const personName = "Matthew Blode";
const titleTemplate = `%s | ${siteName}`;
const host = "https://blode.co";
export const siteUrl = `${host}${basePath}`;
/**
 * Served from `public/`, not the `app/opengraph-image.png` file convention.
 * Under that convention Next joins `basePath` onto the segment and then
 * `resolveUrl` joins `metadataBase.pathname` on again, producing
 * `/style-capture/style-capture/opengraph-image.png`. Absolute here so nothing
 * downstream can prefix it a second time.
 */
export const defaultOgImage = `${siteUrl}/opengraph-image.png`;
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
  const isRoot = path === "/";
  const url = isRoot ? siteUrl : `${siteUrl}${path}`;

  /**
   * Card titles have no template mechanism, so the suffix is applied by hand.
   * It has to be, because `siteName` below is the person: without it a share of
   * /privacy reads "Privacy policy for the Chrome extension" over
   * "Matthew Blode" and nothing on the card names Style Capture.
   */
  const cardTitle = `${title} | ${siteName}`;

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
      siteName: personName,
      title: cardTitle,
      type: "website",
      url,
    },
    /**
     * The root call is the marketing layout, the segment every inner page
     * inherits from. A plain string there resets the root layout's template to
     * null for its children, which is why /privacy and /terms shipped a bare
     * document title with no product suffix. Re-declaring the template here
     * restores it.
     */
    title: isRoot ? { default: title, template: titleTemplate } : title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [defaultOgImage],
      title: cardTitle,
    },
  };
};

const listItem = (position: number, name: string, item: string) => ({
  "@type": "ListItem",
  item,
  name,
  position,
});

/**
 * Every trail on this zone starts at the blode.co root, never at
 * `blode.co/style-capture`. A trail rooted at the zone tells Google the zone is
 * a site of its own, which is the opposite of what the contract is for. The
 * shared prefix is why callers pass only their own page: the zone-rooted
 * version cannot be expressed.
 */
const hostCrumbs = [
  listItem(1, "Matthew Blode", `${host}/`),
  listItem(2, "Projects", `${host}/projects`),
  listItem(3, siteName, siteUrl),
];

export const buildBreadcrumbSchema = (
  page: BreadcrumbItem
): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@id": `${siteUrl}${page.path}#breadcrumb`,
  "@type": "BreadcrumbList",
  itemListElement: [
    ...hostCrumbs,
    listItem(4, page.name, `${siteUrl}${page.path}`),
  ],
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
      itemListElement: hostCrumbs,
    },
  ],
});
