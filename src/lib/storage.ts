import { createDefaultSettings } from "@/lib/messages.ts";
import type { CaptureSettings } from "@/lib/types.ts";

const SETTINGS_STORAGE_KEY = "live-css.settings";

export async function getSettings(): Promise<CaptureSettings> {
  const stored = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
  return {
    ...createDefaultSettings(),
    ...(stored[SETTINGS_STORAGE_KEY] as Partial<CaptureSettings> | undefined),
  };
}

export async function saveSettings(settings: CaptureSettings): Promise<void> {
  await chrome.storage.local.set({
    [SETTINGS_STORAGE_KEY]: settings,
  });
}
