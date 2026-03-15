"use client";

import { CursorClickIcon } from "blode-icons-react";

import { Button } from "@/components/ui/button";

import { CaptureResults } from "./capture-results";
import { InspectOverlay } from "./inspect-overlay";
import { useInspect } from "./use-inspect";

export const DemoSection = (): React.JSX.Element => {
  const {
    activate,
    capturedExport,
    captureResult,
    clearResults,
    deactivate,
    handleCapture,
    isInspecting,
    tailwindMapping,
  } = useInspect();

  return (
    <>
      <section className="mb-24 text-center" id="demo">
        <h2 className="mb-4 font-semibold text-2xl">Try it now</h2>
        <p className="mx-auto mb-8 max-w-lg text-muted-foreground leading-relaxed">
          Click the button below, then hover over any element on this page to
          see the picker in action. Click an element to capture its styles.
        </p>
        <Button
          disabled={isInspecting}
          onClick={activate}
          size="lg"
          variant={isInspecting ? "secondary" : "default"}
        >
          <CursorClickIcon data-icon="inline-start" />
          {isInspecting ? "Inspecting..." : "Inspect this page"}
        </Button>
        {!isInspecting && (
          <p className="mt-4 text-muted-foreground text-xs">
            Shift to climb the DOM, Alt to descend. Esc to exit.
          </p>
        )}
      </section>

      {isInspecting && (
        <InspectOverlay onCapture={handleCapture} onDeactivate={deactivate} />
      )}

      {captureResult && tailwindMapping && capturedExport && (
        <CaptureResults
          capturedExport={capturedExport}
          captureResult={captureResult}
          onClose={clearResults}
          tailwindMapping={tailwindMapping}
        />
      )}
    </>
  );
};
