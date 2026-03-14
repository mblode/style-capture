import { formatCaptureForClaudeMarkdown } from "@/lib/claude-export.ts";
import {
  MESSAGE_TYPE_CAPTURE_CANCELLED,
  MESSAGE_TYPE_CAPTURE_COMPLETED,
  MESSAGE_TYPE_CAPTURE_FAILED,
} from "@/lib/messages.ts";
import type { ExtensionMessage } from "@/lib/messages.ts";
import { getSettings } from "@/lib/storage.ts";
import { mapCaptureToTailwind } from "@/lib/tailwind-mapper.ts";
import type { CaptureResult, CaptureSettings } from "@/lib/types.ts";
import { runPicker } from "@/runtime/run-picker.ts";
import type { PickerRunResult } from "@/runtime/run-picker.ts";

const ICON_DEFAULT: Record<string, string> = {
  128: "icons/icon-128.png",
  16: "icons/icon-16.png",
  32: "icons/icon-32.png",
  48: "icons/icon-48.png",
};

const ICON_ACTIVE: Record<string, string> = {
  128: "icons/icon-active-128.png",
  16: "icons/icon-active-16.png",
  32: "icons/icon-active-32.png",
  48: "icons/icon-active-48.png",
};

const setActiveIcon = async (tabId: number): Promise<void> => {
  await chrome.action.setIcon({ path: ICON_ACTIVE, tabId });
  await chrome.action.setTitle({
    tabId,
    title: "Style Capture \u2014 inspecting",
  });
};

const setDefaultIcon = async (tabId: number): Promise<void> => {
  await chrome.action.setIcon({ path: ICON_DEFAULT, tabId });
  await chrome.action.setTitle({ tabId, title: "Style Capture" });
};

const copyToClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back to the legacy textarea flow when clipboard permissions fail.
    }
  }

  const mountRoot = document.body ?? document.documentElement;
  const textarea = document.createElement("textarea");
  const activeElement =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  const selection = document.getSelection();
  const previousRange =
    selection && selection.rangeCount > 0
      ? selection.getRangeAt(0).cloneRange()
      : null;

  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.cssText =
    "position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none";
  mountRoot.append(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const didCopy = document.execCommand("copy");

  textarea.remove();

  if (selection && previousRange) {
    selection.removeAllRanges();
    selection.addRange(previousRange);
  }

  activeElement?.focus();

  if (!didCopy) {
    throw new Error("Copy failed.");
  }
};

const handleCaptureCompleted = async (
  capture: CaptureResult,
  tabId: number | undefined
): Promise<void> => {
  if (!tabId) {
    return;
  }

  const mapping = mapCaptureToTailwind(capture);
  const markdown = formatCaptureForClaudeMarkdown(capture, mapping);

  await chrome.scripting.executeScript({
    args: [markdown],
    func: copyToClipboard,
    target: { tabId },
  });
};

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) {
    return;
  }

  try {
    const settings = await getSettings();

    const results = await chrome.scripting.executeScript<
      [CaptureSettings],
      PickerRunResult
    >({
      args: [settings],
      func: runPicker,
      target: { tabId: tab.id },
    });

    const result = results[0]?.result;
    console.log("[style-capture] picker injected:", result);

    await (result === "activated"
      ? setActiveIcon(tab.id)
      : setDefaultIcon(tab.id));
  } catch (error) {
    console.error("[style-capture] injection failed:", error);
    await setDefaultIcon(tab.id);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const typedMessage = message as ExtensionMessage;
  const tabId = sender.tab?.id;

  const resetIcon = async (id: number) => {
    try {
      await setDefaultIcon(id);
    } catch {
      // noop
    }
  };

  switch (typedMessage.type) {
    case MESSAGE_TYPE_CAPTURE_COMPLETED: {
      (async () => {
        try {
          await handleCaptureCompleted(typedMessage.capture, tabId);
          sendResponse({ ok: true });
        } catch {
          sendResponse({ ok: false });
        }
      })();
      return true;
    }

    case MESSAGE_TYPE_CAPTURE_CANCELLED:
    case MESSAGE_TYPE_CAPTURE_FAILED: {
      if (tabId) {
        resetIcon(tabId);
      }
      sendResponse({ ok: true });
      return false;
    }

    default: {
      return false;
    }
  }
});
