import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MESSAGE_TYPE_CAPTURE_CANCELLED,
  MESSAGE_TYPE_CAPTURE_COMPLETED,
  MESSAGE_TYPE_CAPTURE_FAILED,
} from "@/lib/messages.ts";
import type { CaptureResult, CaptureSettings } from "@/lib/types.ts";

vi.mock("@/lib/storage.ts", () => ({
  getSettings: vi.fn(),
}));

vi.mock("@/runtime/run-picker.ts", () => ({
  runPicker: vi.fn(),
}));

vi.mock("@/runtime/show-toast.ts", () => ({
  showToast: vi.fn(),
}));

vi.mock("@/lib/tailwind-mapper.ts", () => ({
  mapCaptureToTailwind: vi.fn(() => ({
    elements: {},
    order: [],
    reviewQueue: [],
    summary: {
      averageConfidence: 0,
      cleanUtilityCount: 0,
      elementCount: 0,
      lowConfidenceElementCount: 0,
      mappedElementCount: 0,
      reviewCount: 0,
      reviewUtilityCount: 0,
      unsupportedPropertyCount: 0,
      utilityCount: 0,
    },
  })),
}));

vi.mock("@/lib/claude-export.ts", () => ({
  formatCaptureForClaudeMarkdown: vi.fn(() => "# Markdown export"),
}));

const settings: CaptureSettings = {
  captureMode: "curated",
  includeHiddenElements: false,
  includePseudoElements: true,
};

const capture: CaptureResult = {
  elements: {
    "node-0": {
      attributes: {},
      boundingBox: {
        bottom: 40,
        height: 30,
        left: 10,
        right: 60,
        top: 10,
        width: 50,
        x: 10,
        y: 10,
      },
      children: [],
      classList: [],
      id: "node-0",
      parentId: null,
      pseudo: {},
      selector: "#capture-root",
      styles: {},
      tagName: "div",
    },
  },
  metadata: {
    url: "https://example.com/capture",
  },
  order: ["node-0"],
  rootElementId: "node-0",
  rootOuterHtml: '<div id="capture-root"></div>',
  settings,
  summary: {
    elementCount: 1,
    pseudoElementCount: 0,
  },
  version: 1,
};

type MessageListener = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
) => boolean;

type ActionClickListener = (tab: chrome.tabs.Tab) => void;

describe("background service worker", () => {
  let getSettings: typeof import("@/lib/storage.ts").getSettings;
  let messageListener: MessageListener;
  let actionClickListener: ActionClickListener;
  let executeScript: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();

    const onMessage = { addListener: vi.fn() };
    const onClicked = { addListener: vi.fn() };

    Object.assign(chrome.runtime, {
      onMessage,
    });

    Object.defineProperty(chrome, "action", {
      configurable: true,
      value: {
        onClicked,
        setIcon: vi.fn(async () => undefined),
        setTitle: vi.fn(async () => undefined),
      },
    });

    executeScript = vi.fn(async () => []);

    Object.defineProperty(chrome.scripting, "executeScript", {
      configurable: true,
      value: executeScript,
    });

    const storage = await import("@/lib/storage.ts");
    getSettings = storage.getSettings;

    vi.mocked(getSettings).mockReset();
    vi.mocked(getSettings).mockResolvedValue(settings);

    await import("./index.ts");

    messageListener = vi.mocked(onMessage.addListener).mock
      .calls[0]?.[0] as MessageListener;
    actionClickListener = vi.mocked(onClicked.addListener).mock
      .calls[0]?.[0] as ActionClickListener;
  });

  async function dispatchMessage(
    message: unknown,
    sender?: Partial<chrome.runtime.MessageSender>
  ): Promise<unknown> {
    return await new Promise((resolve) => {
      const returned = messageListener(
        message,
        (sender ?? {}) as chrome.runtime.MessageSender,
        (response: unknown) => resolve(response)
      );

      if (returned === false) {
        resolve(undefined);
      }
    });
  }

  describe("chrome.action.onClicked", () => {
    it("injects the picker and sets the active icon", async () => {
      executeScript.mockResolvedValue([{ result: "activated" }]);

      await actionClickListener({ id: 42 } as chrome.tabs.Tab);

      expect(chrome.action.setIcon).toHaveBeenCalledWith(
        expect.objectContaining({ tabId: 42 })
      );
      expect(chrome.action.setTitle).toHaveBeenCalledWith({
        tabId: 42,
        title: "Style Capture — inspecting",
      });
      expect(executeScript).toHaveBeenCalledWith({
        args: [settings],
        func: expect.any(Function),
        target: { tabId: 42 },
      });
    });

    it("does nothing when the tab has no id", async () => {
      await actionClickListener({} as chrome.tabs.Tab);

      expect(executeScript).not.toHaveBeenCalled();
    });
  });

  describe("capture/completed", () => {
    it("runs tailwind mapping, formats markdown, and copies to clipboard", async () => {
      executeScript.mockResolvedValue([]);

      const response = await dispatchMessage(
        { capture, type: MESSAGE_TYPE_CAPTURE_COMPLETED },
        { tab: { id: 12 } as chrome.tabs.Tab }
      );

      expect(response).toEqual({ ok: true });
      // First call: clipboard copy, second call: toast
      expect(executeScript).toHaveBeenCalledTimes(2);
      expect(executeScript).toHaveBeenNthCalledWith(1, {
        args: ["# Markdown export"],
        func: expect.any(Function),
        target: { tabId: 12 },
      });
      expect(executeScript).toHaveBeenNthCalledWith(2, {
        args: ["Copied prompt to clipboard", false],
        func: expect.any(Function),
        target: { tabId: 12 },
      });
    });

    it("shows an error toast when clipboard copy fails", async () => {
      executeScript
        .mockRejectedValueOnce(new Error("Clipboard failed"))
        .mockResolvedValueOnce([]);

      const response = await dispatchMessage(
        { capture, type: MESSAGE_TYPE_CAPTURE_COMPLETED },
        { tab: { id: 12 } as chrome.tabs.Tab }
      );

      expect(response).toEqual({ ok: true });
      expect(executeScript).toHaveBeenNthCalledWith(2, {
        args: ["Failed to copy prompt to clipboard", true],
        func: expect.any(Function),
        target: { tabId: 12 },
      });
    });
  });

  describe("capture/cancelled and capture/failed", () => {
    it("acknowledges cancellation without side effects", async () => {
      const response = await dispatchMessage({
        reason: "User pressed Escape",
        type: MESSAGE_TYPE_CAPTURE_CANCELLED,
      });

      expect(response).toEqual({ ok: true });
    });

    it("acknowledges failure without side effects", async () => {
      const response = await dispatchMessage({
        error: "Something broke",
        type: MESSAGE_TYPE_CAPTURE_FAILED,
      });

      expect(response).toEqual({ ok: true });
    });
  });
});
