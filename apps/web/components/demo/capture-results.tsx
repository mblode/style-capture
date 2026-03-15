"use client";

import type { CaptureResult, TailwindMappingResult } from "@style-capture/core";
import { ClipboardIcon, XIcon } from "blode-icons-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";

interface CaptureResultsProps {
  capturedExport: string;
  captureResult: CaptureResult;
  onClose: () => void;
  tailwindMapping: TailwindMappingResult;
}

export const CaptureResults = ({
  capturedExport,
  captureResult,
  onClose,
  tailwindMapping,
}: CaptureResultsProps): React.JSX.Element => {
  const [copied, setCopied] = useState(false);

  const rootElement = captureResult.elements[captureResult.rootElementId];
  const rootMapping = rootElement
    ? tailwindMapping.elements[rootElement.id]
    : null;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(capturedExport);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [capturedExport]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-[2147483640] animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-3xl p-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
                <span className="font-mono text-xs text-muted-foreground">
                  {"</>"}
                </span>
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {rootElement?.tagName ?? "element"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {captureResult.summary.elementCount} element
                  {captureResult.summary.elementCount === 1 ? "" : "s"} captured
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleCopy} size="sm" variant="secondary">
                <ClipboardIcon data-icon="inline-start" />
                {copied ? "Copied" : "Copy export"}
              </Button>
              <Button onClick={onClose} size="xs" variant="ghost">
                <XIcon className="size-4" />
              </Button>
            </div>
          </div>

          {/* Tailwind classes */}
          {rootMapping && rootMapping.suggestedClassName && (
            <div className="border-b border-border px-5 py-3">
              <p className="mb-2 font-mono text-muted-foreground text-xs">
                Tailwind
              </p>
              <div className="flex flex-wrap gap-1.5">
                {rootMapping.suggestedClassName.split(" ").map((cls) => (
                  <span
                    className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs"
                    key={cls}
                  >
                    {cls}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Export preview */}
          <div className="max-h-64 overflow-auto">
            <pre className="p-5 font-mono text-xs text-muted-foreground leading-relaxed">
              {capturedExport}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
