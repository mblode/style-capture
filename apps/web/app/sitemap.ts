import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { lastModified: new Date(), priority: 1, url: siteUrl },
    { lastModified: new Date(), priority: 0.3, url: `${siteUrl}/privacy` },
    { lastModified: new Date(), priority: 0.3, url: `${siteUrl}/terms` },
    { lastModified: new Date(), priority: 0.5, url: `${siteUrl}/support` },
  ];
}
