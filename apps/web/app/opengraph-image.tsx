import { renderZoneOgImage } from "@/app/og-image-shared";

export {
  OG_CONTENT_TYPE as contentType,
  OG_SIZE as size,
} from "@/app/og-image-shared";

export const alt = "Style Capture";

/**
 * The house card (Rule 12), replacing the static `public/opengraph-image.png`.
 *
 * Converting the PNG to a generated route is also the Rule 11 fix. A static
 * metadata image in `app/` already carries `basePath`, so pointing
 * `metadataBase` at the zone while that PNG is still there produces
 * `/style-capture/style-capture/opengraph-image.png`. A generated route is not
 * prefixed, so this form is the one that cannot double.
 *
 * The matching `twitter-image.png` is gone rather than converted: Next reuses
 * this route for `twitter:image`, and the old pair were the same file twice.
 */
export default function OpengraphImage() {
  return renderZoneOgImage({
    badge: "STYLE",
    eyebrow: "blode.co/style-capture",
    // Shorter than the meta description, which runs long for the SERP. A card
    // is read in a feed, at a glance.
    subtitle: "Point at any UI. Get styles your coding agent can rebuild.",
    title: "Style Capture",
  });
}
