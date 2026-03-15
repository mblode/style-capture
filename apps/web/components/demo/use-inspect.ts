"use client";

import type { CaptureResult, TailwindMappingResult } from "@style-capture/core";
import {
  formatCaptureForClaudeMarkdown,
  mapCaptureToTailwind,
} from "@style-capture/core";
import { useCallback, useState } from "react";

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
  const [tailwindMapping, setTailwindMapping] =
    useState<TailwindMappingResult | null>(null);
  const [capturedExport, setCapturedExport] = useState<string | null>(null);

  const activate = useCallback(() => {
    setIsInspecting(true);
    setCaptureResult(null);
    setTailwindMapping(null);
    setCapturedExport(null);
  }, []);

  const deactivate = useCallback(() => {
    setIsInspecting(false);
  }, []);

  const clearResults = useCallback(() => {
    setCaptureResult(null);
    setTailwindMapping(null);
    setCapturedExport(null);
  }, []);

  const handleCapture = useCallback((element: Element) => {
    try {
      const capture = buildCapture(element, {
        captureMode: "curated",
        includeHiddenElements: false,
        includePseudoElements: true,
      });

      const mapping = mapCaptureToTailwind(capture);
      const exported = formatCaptureForClaudeMarkdown(capture, mapping);

      setCaptureResult(capture);
      setTailwindMapping(mapping);
      setCapturedExport(exported);
      setIsInspecting(false);
    } catch {
      setIsInspecting(false);
    }
  }, []);

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
