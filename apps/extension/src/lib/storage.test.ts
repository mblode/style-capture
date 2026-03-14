import { getSettings, saveSettings } from "./storage.ts";

describe("getSettings()", () => {
  // eslint-disable-next-line vitest/no-hooks -- shared chrome mock reset needed before each test
  beforeEach(() => {
    vi.mocked(chrome.storage.local.get).mockReset();
    vi.mocked(chrome.storage.local.remove).mockReset();
    vi.mocked(chrome.storage.local.set).mockReset();
  });

  it("returns default settings when storage is empty", async () => {
    vi.mocked(chrome.storage.local.get).mockReturnValue({} as never);

    const settings = await getSettings();

    expect(settings).toStrictEqual({
      captureMode: "curated",
      includeHiddenElements: false,
      includePseudoElements: true,
    });
  });

  it("merges stored settings with defaults", async () => {
    vi.mocked(chrome.storage.local.get).mockReturnValue({
      "style-capture.settings": { captureMode: "full" },
    } as never);

    const settings = await getSettings();

    expect(settings.captureMode).toBe("full");
    expect(settings.includePseudoElements).toBeTruthy();
  });

  it("migrates legacy settings to the new storage key", async () => {
    vi.mocked(chrome.storage.local.get).mockReturnValue({
      "live-css.settings": { includeHiddenElements: true },
    } as never);

    const settings = await getSettings();

    expect(settings).toStrictEqual({
      captureMode: "curated",
      includeHiddenElements: true,
      includePseudoElements: true,
    });
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      "style-capture.settings": settings,
    });
    expect(chrome.storage.local.remove).toHaveBeenCalledWith(
      "live-css.settings"
    );
  });
});

describe("saveSettings()", () => {
  // eslint-disable-next-line vitest/no-hooks -- shared chrome mock reset needed before each test
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
      "style-capture.settings": {
        captureMode: "full",
        includeHiddenElements: true,
        includePseudoElements: false,
      },
    });
  });
});
