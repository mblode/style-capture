/** Raw resource URLs stay in memory until replay bindings have been resolved. */
export const redactEvidenceText = (text: string): string =>
  text
    .replaceAll(/(https?:\/\/)[^\s/?#"'<>]+@/giu, "$1")
    .replaceAll(
      /([?#&](?:amp;)?)([^?#&\s="'<>]+)=([^&#\s"')<>]*)/gu,
      (match, separator: string, key: string) => {
        let decoded = key;
        try {
          decoded = decodeURIComponent(key);
        } catch {
          // Invalid encoding does not prevent recognizing literal secret keys.
        }
        return /token|secret|signature|credential|auth|key|^(?:sig|jwt|password)$/iu.test(
          decoded
        )
          ? `${separator}${key}=REDACTED`
          : match;
      }
    );

export const serializeEvidence = (value: unknown): string =>
  `${JSON.stringify(
    value,
    (_key, item: unknown) =>
      typeof item === "string" ? redactEvidenceText(item) : item,
    2
  )}\n`;
