/* biome-ignore-all lint/security/noDangerouslySetInnerHtml: JSON-LD must be emitted as raw script content. */
interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps): React.JSX.Element {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      type="application/ld+json"
    />
  );
}
