import { createDefaultSettings } from "@/lib/messages.ts";
import type { CaptureSettings } from "@/lib/types.ts";

const SETTINGS_STORAGE_KEY = "style-capture.settings";
// Preserve migration from pre-Style Capture installs.
const LEGACY_SETTINGS_STORAGE_KEY = "live-css.settings";

export async function getSettings(): Promise<CaptureSettings> {
  const stored = await chrome.storage.local.get([
    SETTINGS_STORAGE_KEY,
    LEGACY_SETTINGS_STORAGE_KEY,
  ]);
  const currentSettings = stored[SETTINGS_STORAGE_KEY] as
    | Partial<CaptureSettings>
    | undefined;

  if (currentSettings) {
    return {
      ...createDefaultSettings(),
      ...currentSettings,
    };
  }

  const legacySettings = stored[LEGACY_SETTINGS_STORAGE_KEY] as
    | Partial<CaptureSettings>
    | undefined;

  if (!legacySettings) {
    return createDefaultSettings();
  }

  const migratedSettings = {
    ...createDefaultSettings(),
    ...legacySettings,
  };

  await chrome.storage.local.set({
    [SETTINGS_STORAGE_KEY]: migratedSettings,
  });
  await chrome.storage.local.remove(LEGACY_SETTINGS_STORAGE_KEY);

  return migratedSettings;
}

export async function saveSettings(settings: CaptureSettings): Promise<void> {
  await chrome.storage.local.set({
    [SETTINGS_STORAGE_KEY]: settings,
  });
}
