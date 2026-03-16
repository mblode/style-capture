"use client";

import type { CaptureResult, TailwindMappingResult } from "@style-capture/core";
import { ClipboardIcon, CrossSmallIcon } from "blode-icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { codeToHtml } from "shiki";

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
  tailwindMapping: _tailwindMapping,
}: CaptureResultsProps): React.JSX.Element => {
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const html = await codeToHtml(capturedExport, {
        defaultColor: false,
        lang: "xml",
        themes: { dark: "github-dark", light: "github-light" },
      });
      if (!cancelled) {
        setHighlightedHtml(html);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [capturedExport]);

  const rootElement = captureResult.elements[captureResult.rootElementId];

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(capturedExport);
    setCopied(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [capturedExport]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-[2147483640] animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-3xl p-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <p className="text-sm">
              <span className="font-semibold">
                {rootElement?.tagName ?? "element"}
              </span>
              <span className="text-muted-foreground">
                {" · "}
                {captureResult.summary.elementCount} element
                {captureResult.summary.elementCount === 1 ? "" : "s"}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={handleCopy} size="sm" variant="secondary">
                <ClipboardIcon data-icon="inline-start" />
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button onClick={onClose} size="xs" variant="ghost">
                <CrossSmallIcon className="size-4" />
              </Button>
            </div>
          </div>

          {/* Export preview */}
          <div className="max-h-64 overflow-auto">
            {highlightedHtml ? (
              <div
                className="[&_pre]:p-5 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:leading-relaxed [&_code]:font-mono"
                // oxlint-disable-next-line eslint-plugin-react(no-danger) -- shiki output is safe
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            ) : (
              <pre className="p-5 font-mono text-xs text-muted-foreground leading-relaxed">
                {capturedExport}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
