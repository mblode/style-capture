import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";

import { chromium } from "playwright-core";

const OUTPUT_DIR = resolve(process.cwd(), "store/generated");
const CHROME_EXECUTABLE =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TRAILING_SLASHES = /\/+$/;

interface RenderJob {
  output: string;
  path: string;
  viewport: { width: number; height: number };
}

const JOBS: RenderJob[] = [
  {
    path: "/store/screenshot-1-capture",
    output: "screenshot-1-capture.png",
    viewport: { width: 1280, height: 800 },
  },
  {
    path: "/store/screenshot-2-export",
    output: "screenshot-2-export.png",
    viewport: { width: 1280, height: 800 },
  },
  {
    path: "/store/screenshot-3-settings",
    output: "screenshot-3-settings.png",
    viewport: { width: 1280, height: 800 },
  },
  {
    path: "/store/screenshot-4-tailwind",
    output: "screenshot-4-tailwind.png",
    viewport: { width: 1280, height: 800 },
  },
  {
    path: "/store/screenshot-5-privacy",
    output: "screenshot-5-privacy.png",
    viewport: { width: 1280, height: 800 },
  },
  {
    path: "/store/small-promo-tile",
    output: "small-promo-tile.png",
    viewport: { width: 440, height: 280 },
  },
  {
    path: "/store/marquee-promo-tile",
    output: "marquee-promo-tile.png",
    viewport: { width: 1400, height: 560 },
  },
];

function getBaseUrl(): string {
  const flag = process.argv.find((arg) => arg.startsWith("--base-url="));
  if (flag) {
    return flag.split("=")[1];
  }
  const idx = process.argv.indexOf("--base-url");
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1];
  }
  return "http://style-capture.localhost:1355";
}

async function main() {
  const baseUrl = getBaseUrl().replace(TRAILING_SLASHES, "");
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Preflight: verify the dev server is reachable
  try {
    await fetch(baseUrl, { signal: AbortSignal.timeout(5000) });
  } catch {
    throw new Error(
      `Cannot reach ${baseUrl}. Start the Next.js dev server first:\n  npm run dev --filter=@style-capture/web`
    );
  }

  const browser = await chromium.launch({
    executablePath: CHROME_EXECUTABLE,
    headless: true,
  });

  try {
    for (const job of JOBS) {
      const page = await browser.newPage({
        deviceScaleFactor: 1,
        viewport: job.viewport,
      });

      await page.goto(`${baseUrl}${job.path}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      // Hide Next.js dev indicators before capture
      await page.evaluate(() => {
        for (const el of document.querySelectorAll(
          "nextjs-portal, [data-nextjs-toast], [data-next-mark]"
        )) {
          (el as HTMLElement).style.display = "none";
        }
        for (const el of document.body.querySelectorAll("*")) {
          const style = window.getComputedStyle(el);
          if (
            style.position === "fixed" &&
            (style.zIndex === "2147483647" ||
              Number.parseInt(style.zIndex, 10) > 99_999)
          ) {
            (el as HTMLElement).style.display = "none";
          }
        }
      });
      await page.screenshot({
        path: join(OUTPUT_DIR, job.output),
        type: "png",
      });
      await page.close();

      console.log(
        `Rendered ${job.output} (${job.viewport.width}x${job.viewport.height})`
      );
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
