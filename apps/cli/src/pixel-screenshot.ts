import type { PixelClip } from "@style-capture/core";
import type { Page } from "playwright";

/** Capture native pixels, then copy an integer pixel rectangle without resizing. */
export const pixelScreenshot = async (
  page: Page,
  clip: PixelClip,
  replay = false
): Promise<Buffer> => {
  const viewport = page.viewportSize();
  const dpr = await page.evaluate(() => devicePixelRatio);
  if (!viewport || dpr !== clip.deviceScaleFactor)
    throw new Error(
      `Screenshot DPR ${dpr} differs from recorded DPR ${clip.deviceScaleFactor}.`
    );
  // Playwright retains its context-owned emulation. Never persist this full viewport image.
  const full = await page.screenshot({ scale: "device", timeout: 10_000 });
  const fullWidth = full.readUInt32BE(16);
  const fullHeight = full.readUInt32BE(20);
  if (
    fullWidth !== Math.round(viewport.width * dpr) ||
    fullHeight !== Math.round(viewport.height * dpr)
  )
    throw new Error(
      `Viewport PNG ${fullWidth}x${fullHeight} does not match viewport and DPR.`
    );
  const x = Math.round(
    (replay ? (clip.replayOrigin?.x ?? 0) : clip.source.x) * dpr
  );
  const y = Math.round(
    (replay ? (clip.replayOrigin?.y ?? 0) : clip.source.y) * dpr
  );
  if (
    x < 0 ||
    y < 0 ||
    x + clip.pixelWidth > fullWidth ||
    y + clip.pixelHeight > fullHeight
  )
    throw new Error("Recorded crop exceeds the native viewport PNG.");
  const encoded = await page.evaluate(
    async ({ png, left, top, width, height }) => {
      const binary = atob(png);
      const bytes = Uint8Array.from(
        binary,
        (character) => character.codePointAt(0) ?? 0
      );
      const bitmap = await createImageBitmap(
        new Blob([bytes], { type: "image/png" }),
        left,
        top,
        width,
        height
      );
      try {
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("OffscreenCanvas is unavailable.");
        context.drawImage(bitmap, 0, 0);
        const croppedBlob = await canvas.convertToBlob({ type: "image/png" });
        const cropped = new Uint8Array(await croppedBlob.arrayBuffer());
        let result = "";
        for (const byte of cropped) result += String.fromCodePoint(byte);
        return btoa(result);
      } finally {
        bitmap.close();
      }
    },
    {
      png: full.toString("base64"),
      left: x,
      top: y,
      width: clip.pixelWidth,
      height: clip.pixelHeight,
    }
  );
  const result = Buffer.from(encoded, "base64");
  if (
    result.readUInt32BE(16) !== clip.pixelWidth ||
    result.readUInt32BE(20) !== clip.pixelHeight
  )
    throw new Error(
      "Cropped PNG dimensions differ from the recorded physical pixel grid."
    );
  if ((await page.evaluate(() => devicePixelRatio)) !== dpr)
    throw new Error("Device pixel ratio changed during screenshot capture.");
  return result;
};
