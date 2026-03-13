import { createReadStream } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import http from "node:http";
import { extname, join, resolve } from "node:path";

import { chromium } from "playwright-core";
import ts from "typescript";

const DEMO_ROOT = resolve(process.cwd(), "store/demo");
const OUTPUT_ROOT = resolve(process.cwd(), "store/screenshots");
const CHROME_EXECUTABLE =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const VIEWPORT = { height: 800, width: 1280 };
const CAPTURE_SETTINGS = {
  captureMode: "curated" as const,
  includeHiddenElements: false,
  includePseudoElements: true,
};

const CONTENT_TYPES = new Map<string, string>([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

async function main() {
  await mkdir(OUTPUT_ROOT, { recursive: true });

  const runPickerScript = await loadBrowserScript(
    resolve(process.cwd(), "src/runtime/run-picker.ts"),
    "runPicker",
    "__styleCaptureRunPicker"
  );
  const showToastScript = await loadBrowserScript(
    resolve(process.cwd(), "src/runtime/show-toast.ts"),
    "showToast",
    "__styleCaptureShowToast"
  );

  const server = createStaticServer(DEMO_ROOT);
  await new Promise<void>((resolveServer) => {
    server.listen(0, "127.0.0.1", () => resolveServer());
  });

  const address = server.address();
  if (!(address && typeof address === "object")) {
    throw new Error("Failed to start screenshot server.");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch({
    executablePath: CHROME_EXECUTABLE,
    headless: true,
  });

  try {
    const page = await browser.newPage({ viewport: VIEWPORT });

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.addScriptTag({ content: runPickerScript });
    await page.addScriptTag({ content: showToastScript });
    await page.evaluate((settings) => {
      window.__styleCaptureRunPicker(settings);
    }, CAPTURE_SETTINGS);
    await page.locator("#pricing").hover();
    await page.waitForTimeout(250);
    await page.screenshot({
      path: join(OUTPUT_ROOT, "style-capture-overlay.png"),
      type: "png",
    });

    await page.evaluate(
      ([message, isError]) => {
        window.__styleCaptureShowToast(message, isError);
      },
      ["Copied prompt to clipboard", false] as const
    );
    await page.waitForTimeout(120);
    await page.screenshot({
      path: join(OUTPUT_ROOT, "style-capture-overlay-toast.png"),
      type: "png",
    });

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.addScriptTag({ content: runPickerScript });
    await page.addScriptTag({ content: showToastScript });
    await page.evaluate((settings) => {
      window.__styleCaptureRunPicker(settings);
    }, CAPTURE_SETTINGS);
    await page.locator(".feature-card").hover();
    await page.waitForTimeout(250);
    await page.screenshot({
      path: join(OUTPUT_ROOT, "style-capture-feature-card.png"),
      type: "png",
    });
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

function createStaticServer(root: string) {
  return http.createServer(async (request, response) => {
    const requestPath =
      request.url === "/" ? "/index.html" : (request.url ?? "/index.html");
    const filePath = resolve(root, `.${requestPath}`);

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
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

async function loadBrowserScript(
  filePath: string,
  exportName: string,
  globalName: string
) {
  const source = await readFile(filePath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filePath,
  });

  return `${outputText.replaceAll(`export function ${exportName}`, `function ${exportName}`)}
window.${globalName} = ${exportName};`;
}

declare global {
  interface Window {
    __styleCaptureRunPicker: (settings: typeof CAPTURE_SETTINGS) => void;
    __styleCaptureShowToast: (message: string, isError: boolean) => void;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
