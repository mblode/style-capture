import type { CaptureResult, CaptureSettings } from "@/lib/types.ts";

export const MESSAGE_TYPE_CAPTURE_COMPLETED = "capture/completed";
export const MESSAGE_TYPE_CAPTURE_CANCELLED = "capture/cancelled";
export const MESSAGE_TYPE_CAPTURE_FAILED = "capture/failed";

export interface CaptureCompletedMessage {
  capture: CaptureResult;
  type: typeof MESSAGE_TYPE_CAPTURE_COMPLETED;
}

export interface CaptureCancelledMessage {
  reason: string;
  type: typeof MESSAGE_TYPE_CAPTURE_CANCELLED;
}

export interface CaptureFailedMessage {
  error: string;
  type: typeof MESSAGE_TYPE_CAPTURE_FAILED;
}

export type ExtensionMessage =
  | CaptureCancelledMessage
  | CaptureCompletedMessage
  | CaptureFailedMessage;

export function createDefaultSettings(): CaptureSettings {
  return {
    captureMode: "curated",
    includeHiddenElements: false,
    includePseudoElements: true,
  };
}
