import { createReadStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import http from "node:http";
import { extname, join, resolve } from "node:path";

import { chromium } from "playwright-core";

const RENDERABLES_ROOT = resolve(process.cwd(), "store/renderables");
const OUTPUT_DIR = resolve(process.cwd(), "store/generated");
const CHROME_EXECUTABLE =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const CONTENT_TYPES = new Map<string, string>([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

const LEADING_SLASHES = /^\/+/;

interface RenderJob {
  html: string;
  output: string;
  viewport: { width: number; height: number };
}

const JOBS: RenderJob[] = [
  {
    html: "screenshot-1-capture.html",
    output: "screenshot-1-capture.png",
    viewport: { width: 1280, height: 800 },
  },
  {
    html: "screenshot-2-export.html",
    output: "screenshot-2-export.png",
    viewport: { width: 1280, height: 800 },
  },
  {
    html: "screenshot-3-settings.html",
    output: "screenshot-3-settings.png",
    viewport: { width: 1280, height: 800 },
  },
  {
    html: "screenshot-4-tailwind.html",
    output: "screenshot-4-tailwind.png",
    viewport: { width: 1280, height: 800 },
  },
  {
    html: "screenshot-5-privacy.html",
    output: "screenshot-5-privacy.png",
    viewport: { width: 1280, height: 800 },
  },
  {
    html: "small-promo-tile.html",
    output: "small-promo-tile.png",
    viewport: { width: 440, height: 280 },
  },
  {
    html: "marquee-promo-tile.html",
    output: "marquee-promo-tile.png",
    viewport: { width: 1400, height: 560 },
  },
];

function createStaticServer(root: string) {
  return http.createServer(async (request, response) => {
    const requestPath =
      request.url === "/" ? "/index.html" : (request.url ?? "/index.html");

    // Resolve against the extension root for font paths like ../../public/
    const extensionRoot = resolve(root, "../..");
    let filePath = resolve(root, `.${requestPath}`);

    if (!filePath.startsWith(root)) {
      // Try resolving relative to extension root for font references
      filePath = resolve(
        extensionRoot,
        requestPath.replace(LEADING_SLASHES, "")
      );
      if (!filePath.startsWith(extensionRoot)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }
    }

    try {
      const fileStats = await stat(filePath);
      if (!fileStats.isFile()) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      const contentType =
        CONTENT_TYPES.get(extname(filePath).toLowerCase()) ??
        "application/octet-stream";
      response.writeHead(200, { "Content-Type": contentType });
      createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const server = createStaticServer(RENDERABLES_ROOT);
  await new Promise<void>((resolveServer) => {
    server.listen(0, "127.0.0.1", () => resolveServer());
  });

  const address = server.address();
  if (!(address && typeof address === "object")) {
    throw new Error("Failed to start render server.");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;
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

      await page.goto(`${baseUrl}/${job.html}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
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
    await new Promise<void>((resolveServer, rejectServer) => {
      server.close((error) => {
        if (error) {
          rejectServer(error);
          return;
        }

        resolveServer();
      });
    });
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
