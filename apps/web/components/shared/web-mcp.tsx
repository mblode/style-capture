"use client";

import { useEffect } from "react";

interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<unknown> | unknown;
}

interface WebMcpContext {
  provideContext: (context: { tools: WebMcpTool[] }) => Promise<void> | void;
}

declare global {
  interface Navigator {
    modelContext?: WebMcpContext;
  }
}

const tools: WebMcpTool[] = [
  {
    description:
      "Open the Style Capture Chrome extension listing on the Chrome Web Store.",
    execute: () => {
      const url =
        "https://chromewebstore.google.com/detail/style-capture/gnolhcpajlndieinmodljdhcbmdmmepd";
      window.open(url, "_blank", "noopener,noreferrer");
      return { url };
    },
    inputSchema: {
      additionalProperties: false,
      properties: {},
      type: "object",
    },
    name: "open_chrome_web_store",
  },
  {
    description:
      "Return the npm command that installs the Style Capture CLI globally or runs it one-off.",
    execute: (input) => {
      const mode = (input as { mode?: string }).mode ?? "run";
      return {
        command:
          mode === "install"
            ? "npm i -g style-capture"
            : "npx style-capture <url> <selector>",
        mode,
        registry: "https://www.npmjs.com/package/style-capture",
      };
    },
    inputSchema: {
      additionalProperties: false,
      properties: {
        mode: {
          description: "Whether to return the install or one-off run command.",
          enum: ["install", "run"],
          type: "string",
        },
      },
      type: "object",
    },
    name: "get_cli_command",
  },
  {
    description:
      "Return the command to install the Style Capture agent skill via skills.sh.",
    execute: () => ({
      command: "npx skills add mblode/style-capture -g --all -y",
      docs: "https://blode.co/style-capture/skills",
      usageExample: "/style-capture https://linear.app .hero",
    }),
    inputSchema: {
      additionalProperties: false,
      properties: {},
      type: "object",
    },
    name: "get_skill_install_command",
  },
];

export const WebMcpProvider = (): null => {
  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }
    const context = navigator.modelContext;
    if (!context || typeof context.provideContext !== "function") {
      return;
    }

    const register = async (): Promise<void> => {
      try {
        await context.provideContext({ tools });
      } catch {
        // WebMCP is best-effort; ignore unsupported-browser errors.
      }
    };

    register();
  }, []);

  return null;
};
