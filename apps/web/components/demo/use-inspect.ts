"use client";

import type { CaptureResult, TailwindMappingResult } from "@style-capture/core";
import {
  createDefaultSettings,
  formatCaptureForClaudeMarkdown,
  mapCaptureToTailwind,
} from "@style-capture/core";
import { useMemo, useState } from "react";

import { buildCapture } from "./build-capture";

interface InspectState {
  activate: () => void;
  capturedExport: string | null;
  captureResult: CaptureResult | null;
  clearResults: () => void;
  deactivate: () => void;
  handleCapture: (element: Element) => void;
  isInspecting: boolean;
  tailwindMapping: TailwindMappingResult | null;
}

export const useInspect = (): InspectState => {
  const [isInspecting, setIsInspecting] = useState(false);
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(
    null
  );

  const tailwindMapping = useMemo<TailwindMappingResult | null>(
    () => (captureResult ? mapCaptureToTailwind(captureResult) : null),
    [captureResult]
  );

  const capturedExport = useMemo<string | null>(
    () =>
      captureResult && tailwindMapping
        ? formatCaptureForClaudeMarkdown(captureResult, tailwindMapping)
        : null,
    [captureResult, tailwindMapping]
  );

  const activate = () => {
    setIsInspecting(true);
    setCaptureResult(null);
  };

  const deactivate = () => {
    setIsInspecting(false);
  };

  const clearResults = () => {
    setCaptureResult(null);
  };

  const handleCapture = (element: Element) => {
    try {
      const capture = buildCapture(element, createDefaultSettings());
      setCaptureResult(capture);
      setIsInspecting(false);
    } catch {
      setIsInspecting(false);
    }
  };

  return {
    activate,
    captureResult,
    capturedExport,
    clearResults,
    deactivate,
    handleCapture,
    isInspecting,
    tailwindMapping,
  };
};
