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
    output: "screenshot-1-capture.png",
    path: "/store/screenshot-1-capture",
    viewport: { height: 800, width: 1280 },
  },
  {
    output: "screenshot-2-export.png",
    path: "/store/screenshot-2-export",
    viewport: { height: 800, width: 1280 },
  },
  {
    output: "screenshot-3-settings.png",
    path: "/store/screenshot-3-settings",
    viewport: { height: 800, width: 1280 },
  },
  {
    output: "screenshot-4-tailwind.png",
    path: "/store/screenshot-4-tailwind",
    viewport: { height: 800, width: 1280 },
  },
  {
    output: "screenshot-5-privacy.png",
    path: "/store/screenshot-5-privacy",
    viewport: { height: 800, width: 1280 },
  },
  {
    output: "small-promo-tile.png",
    path: "/store/small-promo-tile",
    viewport: { height: 280, width: 440 },
  },
  {
    output: "marquee-promo-tile.png",
    path: "/store/marquee-promo-tile",
    viewport: { height: 560, width: 1400 },
  },
];

const getBaseUrl = (): string => {
  const flag = process.argv.find((arg) => arg.startsWith("--base-url="));
  if (flag) {
    return flag.split("=")[1];
  }
  const idx = process.argv.indexOf("--base-url");
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1];
  }
  return "http://style-capture.localhost:1355";
};

const main = async () => {
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
};

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}
