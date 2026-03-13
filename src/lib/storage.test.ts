import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSettings, saveSettings } from "./storage.ts";

describe("getSettings", () => {
  beforeEach(() => {
    vi.mocked(chrome.storage.local.get).mockReset();
  });

  it("returns default settings when storage is empty", async () => {
    vi.mocked(chrome.storage.local.get).mockImplementation(
      async () => ({}) as never
    );

    const settings = await getSettings();

    expect(settings).toEqual({
      captureMode: "curated",
      includeHiddenElements: false,
      includePseudoElements: true,
    });
  });

  it("merges stored settings with defaults", async () => {
    vi.mocked(chrome.storage.local.get).mockImplementation(
      async () =>
        ({
          "live-css.settings": { captureMode: "full" },
        }) as never
    );

    const settings = await getSettings();

    expect(settings.captureMode).toBe("full");
    expect(settings.includePseudoElements).toBe(true);
  });
});

describe("saveSettings", () => {
  beforeEach(() => {
    vi.mocked(chrome.storage.local.set).mockReset();
  });

  it("persists settings to chrome.storage.local", async () => {
    await saveSettings({
      captureMode: "full",
      includeHiddenElements: true,
      includePseudoElements: false,
    });

    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      "live-css.settings": {
        captureMode: "full",
        includeHiddenElements: true,
        includePseudoElements: false,
      },
    });
  });
});
