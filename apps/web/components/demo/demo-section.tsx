"use client";

import { CaptureResults } from "./capture-results";
import { InspectOverlay } from "./inspect-overlay";
import { useInspect } from "./use-inspect";

export { useInspect };

export const InspectRenderer = ({
  inspect,
}: {
  inspect: ReturnType<typeof useInspect>;
}): React.JSX.Element | null => {
  const {
    capturedExport,
    captureResult,
    clearResults,
    deactivate,
    handleCapture,
    isInspecting,
    tailwindMapping,
  } = inspect;

  return (
    <>
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
