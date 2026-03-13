#!/usr/bin/env node

import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const HELP_TEXT = `Usage:
  node scripts/chrome-web-store-publish.mjs <command> [options]

Commands:
  release          Create/update and publish, choosing the best available API path
  create-v1        Create a new item with the deprecated V1 insert endpoint
  update-v1        Upload a new package to an existing item with V1
  publish-v1       Publish an existing item with V1
  status-v1        Fetch draft status with V1
  upload-v2        Upload a new package to an existing item with V2
  publish-v2       Publish an existing item with V2
  status-v2        Fetch store status with V2

Options:
  --file <path>    Zip package to upload (default: release/style-capture.zip)
  --target <name>  Publish target for V1 (default|trustedTesters)
  --dry-run        Print the resolved request instead of calling the API
  --help           Show this message

Auth env:
  OAuth refresh token flow:
    CWS_CLIENT_ID
    CWS_CLIENT_SECRET
    CWS_REFRESH_TOKEN

  Service account flow:
    Either:
      CWS_SERVICE_ACCOUNT_KEY_PATH
    Or:
      CWS_SERVICE_ACCOUNT_EMAIL
      CWS_SERVICE_ACCOUNT_PRIVATE_KEY

  Common:
    CWS_EXTENSION_ID
    CWS_PUBLISHER_ID

Examples:
  node scripts/chrome-web-store-publish.mjs release
  node scripts/chrome-web-store-publish.mjs upload-v2 --file release/style-capture.zip
  node scripts/chrome-web-store-publish.mjs create-v1 --dry-run
`;

const TOKEN_SCOPE = "https://www.googleapis.com/auth/chromewebstore";
const DEFAULT_PACKAGE_PATH = join(ROOT, "release", "style-capture.zip");

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    command: undefined,
    dryRun: false,
    file: DEFAULT_PACKAGE_PATH,
    target: "default",
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--file") {
      options.file = resolve(ROOT, args[index + 1] ?? "");
      index += 1;
      continue;
    }

    if (arg === "--target") {
      options.target = args[index + 1] ?? "default";
      index += 1;
      continue;
    }

    if (!(arg.startsWith("--") || options.command)) {
      options.command = arg;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function getEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function getAccessToken() {
  if (
    process.env.CWS_SERVICE_ACCOUNT_KEY_PATH ||
    (process.env.CWS_SERVICE_ACCOUNT_EMAIL &&
      process.env.CWS_SERVICE_ACCOUNT_PRIVATE_KEY)
  ) {
    return await getServiceAccountAccessToken();
  }

  return await getRefreshTokenAccessToken();
}

async function getRefreshTokenAccessToken() {
  const clientId = getEnv("CWS_CLIENT_ID");
  const clientSecret = getEnv("CWS_CLIENT_SECRET");
  const refreshToken = getEnv("CWS_REFRESH_TOKEN");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  const payload = await response.json();

  if (!(response.ok && payload.access_token)) {
    throw new Error(
      `Failed to obtain OAuth access token: ${JSON.stringify(payload)}`
    );
  }

  return payload.access_token;
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("=", "")
    .replaceAll("+", "-")
    .replaceAll("/", "_");
}

async function getServiceAccountAccessToken() {
  const keyPath = process.env.CWS_SERVICE_ACCOUNT_KEY_PATH;
  const fileCredentials = keyPath
    ? JSON.parse(readFileSync(resolve(process.cwd(), keyPath), "utf8"))
    : null;
  const email =
    fileCredentials?.client_email ?? getEnv("CWS_SERVICE_ACCOUNT_EMAIL");
  const privateKey = (
    fileCredentials?.private_key ?? getEnv("CWS_SERVICE_ACCOUNT_PRIVATE_KEY")
  ).replaceAll("\\n", "\n");
  const now = Math.floor(Date.now() / 1000);

  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64UrlEncode(
    JSON.stringify({
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
      iss: email,
      scope: TOKEN_SCOPE,
    })
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  signer.end();

  const signature = signer
    .sign(privateKey)
    .toString("base64")
    .replaceAll("=", "")
    .replaceAll("+", "-")
    .replaceAll("/", "_");

  const assertion = `${header}.${claims}.${signature}`;
  const body = new URLSearchParams({
    assertion,
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  const payload = await response.json();

  if (!(response.ok && payload.access_token)) {
    throw new Error(
      `Failed to obtain service-account access token: ${JSON.stringify(payload)}`
    );
  }

  return payload.access_token;
}

async function requestJson(url, init, dryRun) {
  if (dryRun) {
    return {
      dryRun: true,
      request: {
        body: init.body ? "<json>" : null,
        headers: init.headers,
        method: init.method,
        url,
      },
    };
  }

  const response = await fetch(url, init);
  const text = await response.text();

  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}\n${JSON.stringify(payload, null, 2)}`
    );
  }

  return payload;
}

async function requestUpload(url, accessToken, filePath, dryRun, method) {
  if (dryRun) {
    return {
      dryRun: true,
      request: {
        filePath,
        headers: {
          Authorization: "Bearer <token>",
          "Content-Type": "application/zip",
        },
        method,
        url,
      },
    };
  }

  const packageBuffer = readFileSync(filePath);
  const response = await fetch(url, {
    body: packageBuffer,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/zip",
    },
    method,
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      `Upload failed: ${response.status} ${response.statusText}\n${JSON.stringify(payload, null, 2)}`
    );
  }

  return payload;
}

async function runCommand(options) {
  const command = options.command;

  if (!command || options.help) {
    process.stdout.write(HELP_TEXT);
    return;
  }

  const accessToken = await getAccessToken();
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  switch (command) {
    case "create-v1":
      return requestUpload(
        "https://www.googleapis.com/upload/chromewebstore/v1.1/items?uploadType=media",
        accessToken,
        options.file,
        options.dryRun,
        "POST"
      );

    case "update-v1": {
      const itemId = getEnv("CWS_EXTENSION_ID");
      return requestUpload(
        `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${itemId}?uploadType=media`,
        accessToken,
        options.file,
        options.dryRun,
        "PUT"
      );
    }

    case "publish-v1": {
      const itemId = getEnv("CWS_EXTENSION_ID");
      const url = `https://www.googleapis.com/chromewebstore/v1.1/items/${itemId}/publish?publishTarget=${encodeURIComponent(options.target)}`;
      return requestJson(url, { headers, method: "POST" }, options.dryRun);
    }

    case "status-v1": {
      const itemId = getEnv("CWS_EXTENSION_ID");
      const url = `https://www.googleapis.com/chromewebstore/v1.1/items/${itemId}?projection=DRAFT`;
      return requestJson(url, { headers, method: "GET" }, options.dryRun);
    }

    case "upload-v2": {
      const publisherId = getEnv("CWS_PUBLISHER_ID");
      const itemId = getEnv("CWS_EXTENSION_ID");
      return requestUpload(
        `https://chromewebstore.googleapis.com/upload/v2/publishers/${publisherId}/items/${itemId}:upload`,
        accessToken,
        options.file,
        options.dryRun,
        "POST"
      );
    }

    case "publish-v2": {
      const publisherId = getEnv("CWS_PUBLISHER_ID");
      const itemId = getEnv("CWS_EXTENSION_ID");
      const url = `https://chromewebstore.googleapis.com/v2/publishers/${publisherId}/items/${itemId}:publish`;
      return requestJson(url, { headers, method: "POST" }, options.dryRun);
    }

    case "status-v2": {
      const publisherId = getEnv("CWS_PUBLISHER_ID");
      const itemId = getEnv("CWS_EXTENSION_ID");
      const url = `https://chromewebstore.googleapis.com/v2/publishers/${publisherId}/items/${itemId}:fetchStatus`;
      return requestJson(url, { headers, method: "GET" }, options.dryRun);
    }

    case "release": {
      if (process.env.CWS_EXTENSION_ID) {
        if (
          process.env.CWS_PUBLISHER_ID &&
          process.env.CWS_SERVICE_ACCOUNT_EMAIL
        ) {
          const upload = await runCommand({
            ...options,
            command: "upload-v2",
          });
          const publish = await runCommand({
            ...options,
            command: "publish-v2",
          });
          return { publish, upload };
        }

        const upload = await runCommand({
          ...options,
          command: "update-v1",
        });
        const publish = await runCommand({
          ...options,
          command: "publish-v1",
        });
        return { publish, upload };
      }

      const create = await runCommand({
        ...options,
        command: "create-v1",
      });

      return {
        create,
        note: "A new item was created through V1 insert. Set CWS_EXTENSION_ID from the API response before calling publish-v1, or publish manually from the dashboard if you are still completing listing/privacy fields.",
      };
    }

    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

runCommand(parseArgs(process.argv))
  .then((result) => {
    if (typeof result !== "undefined") {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    }
  })
  .catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`
    );
    process.exit(1);
  });
