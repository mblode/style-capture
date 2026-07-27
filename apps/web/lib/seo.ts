import type { Metadata } from "next";

const siteName = "Style Capture";
export const siteUrl = "https://blode.co/style-capture";
const defaultOgImage = `${siteUrl}/opengraph-image.png`;

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

export const buildOrganizationSchema = (): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  logo: `${siteUrl}/apple-icon.png`,
  name: siteName,
  url: siteUrl,
});

export const buildWebSiteSchema = (): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
});
