import {
  MESSAGE_TYPE_CAPTURE_CANCELLED,
  MESSAGE_TYPE_CAPTURE_COMPLETED,
  MESSAGE_TYPE_CAPTURE_FAILED,
} from "@/lib/messages.ts";
import type { CaptureResult, CaptureSettings } from "@/lib/types.ts";

vi.mock(import("@/lib/storage.ts"), () => ({
  getSettings: vi.fn(),
}));

vi.mock(import("@/runtime/run-picker.ts"), () => ({
  runPicker: vi.fn(),
}));

vi.mock(import("@/runtime/show-toast.ts"), () => ({
  showToast: vi.fn(),
}));

vi.mock(import("@/lib/tailwind-mapper.ts"), () => ({
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

vi.mock(import("@/lib/claude-export.ts"), () => ({
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

const dispatchMessage = (
  msgListener: MessageListener,
  message: unknown,
  sender?: Partial<chrome.runtime.MessageSender>
): Promise<unknown> =>
  // eslint-disable-next-line promise/avoid-new -- required to bridge chrome.runtime.onMessage callback API to async/await
  new Promise((resolve) => {
    const returned = msgListener(
      message,
      (sender ?? {}) as chrome.runtime.MessageSender,
      (response: unknown) => resolve(response)
    );

    if (returned === false) {
      resolve(null);
    }
  });

describe("background service worker tests", () => {
  // eslint-disable-next-line typescript-eslint/consistent-type-imports -- dynamic import type needed for vi.mock interop
  let getSettings: Awaited<typeof import("@/lib/storage.ts")>["getSettings"];
  let messageListener: MessageListener;
  let actionClickListener: ActionClickListener;
  let executeScript: ReturnType<typeof vi.fn>;

  // eslint-disable-next-line vitest/no-hooks -- shared chrome mock setup needed before each test
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
        setIcon: vi.fn(() => {
          // noop
        }),
        setTitle: vi.fn(() => {
          // noop
        }),
      },
    });

    executeScript = vi.fn(() => []);

    Object.defineProperty(chrome.scripting, "executeScript", {
      configurable: true,
      value: executeScript,
    });

    const storage = await import("@/lib/storage.ts");
    ({ getSettings } = storage);

    vi.mocked(getSettings).mockReset();
    vi.mocked(getSettings).mockResolvedValue(settings);

    await import("./index.ts");

    messageListener = vi.mocked(onMessage.addListener).mock
      .calls[0]?.[0] as MessageListener;
    actionClickListener = vi.mocked(onClicked.addListener).mock
      .calls[0]?.[0] as ActionClickListener;
  });

  describe("chrome.action.onClicked", () => {
    it("injects the picker and sets the active icon", async () => {
      executeScript.mockResolvedValue([{ result: "activated" }]);

      await actionClickListener({ id: 42 } as chrome.tabs.Tab);

      expect(chrome.action.setIcon).toHaveBeenCalledWith(
        expect.objectContaining({ tabId: 42 })
      );
      expect(chrome.action.setTitle).toHaveBeenCalledWith({
        tabId: 42,
        title: "Style Capture \u2014 inspecting",
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
        messageListener,
        { capture, type: MESSAGE_TYPE_CAPTURE_COMPLETED },
        { tab: { id: 12 } as chrome.tabs.Tab }
      );

      expect(response).toStrictEqual({ ok: true });
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
        messageListener,
        { capture, type: MESSAGE_TYPE_CAPTURE_COMPLETED },
        { tab: { id: 12 } as chrome.tabs.Tab }
      );

      expect(response).toStrictEqual({ ok: true });
      expect(executeScript).toHaveBeenNthCalledWith(2, {
        args: ["Failed to copy prompt to clipboard", true],
        func: expect.any(Function),
        target: { tabId: 12 },
      });
    });
  });

  describe("capture/cancelled and capture/failed", () => {
    it("acknowledges cancellation without side effects", async () => {
      const response = await dispatchMessage(messageListener, {
        reason: "User pressed Escape",
        type: MESSAGE_TYPE_CAPTURE_CANCELLED,
      });

      expect(response).toStrictEqual({ ok: true });
    });

    it("acknowledges failure without side effects", async () => {
      const response = await dispatchMessage(messageListener, {
        error: "Something broke",
        type: MESSAGE_TYPE_CAPTURE_FAILED,
      });

      expect(response).toStrictEqual({ ok: true });
    });
  });
});
