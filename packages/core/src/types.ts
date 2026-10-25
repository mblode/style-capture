export type CaptureMode = "curated" | "full";
export type PseudoElementKind = "before" | "after";

export interface CaptureSettings {
  captureMode: CaptureMode;
  downloadBundle?: boolean;
  includeHiddenElements: boolean;
  includePseudoElements: boolean;
}

export interface BoundingBox {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
  x: number;
  y: number;
}

export interface PseudoElementSnapshot {
  kind: PseudoElementKind;
  styles: Record<string, string>;
}

export interface ElementSnapshot {
  domPath?: number[];
  subtreeIndex?: number;
  attributes: Record<string, string>;
  boundingBox: BoundingBox;
  children: string[];
  classList: string[];
  id: string;
  parentId: string | null;
  pseudo: Partial<Record<PseudoElementKind, PseudoElementSnapshot>>;
  selector: string;
  styles: Record<string, string>;
  tagName: string;
}

export interface CaptureSummary {
  elementCount: number;
  pseudoElementCount: number;
}

export interface PixelClip {
  /** Paint/clipping ancestors, nearest first; geometry and passive CSS only. */
  paintContexts?: {
    bounds: { x: number; y: number; width: number; height: number };
    border: { x: number; y: number };
    styles: Record<string, string>;
  }[];
  /** Replay crop origin preserving Chromium raster coordinates, not only fractional phase. */
  replayOrigin?: { x: number; y: number };
  /** Nearest ancestor paint containment, retained without cloning ancestor content. */
  paintContainment?: {
    contain: string;
    bounds: { x: number; y: number; width: number; height: number };
    rootOffset: { x: number; y: number };
  };
  deviceScaleFactor: number;
  source: { x: number; y: number; width: number; height: number };
  rootOffset: { x: number; y: number };
  pixelWidth: number;
  pixelHeight: number;
}

export interface CaptureMetadata {
  /** Selected root identity from document.childNodes, for immediate extension export. */
  rootDomPath?: number[];
  capturedAt?: string;
  title?: string;
  url: string;
  userAgent?: string;
  viewport?: { width: number; height: number };
  deviceScaleFactor?: number;
  colorScheme?: "light" | "dark" | "no-preference";
  surface?: string;
  browserVersion?: string;
}

export type CaptureState =
  | "active"
  | "disabled"
  | "focus"
  | "focus-visible"
  | "hover";

/** Styles per element id (same ids as `CaptureResult.elements`) in one state. */
export type StateCaptureResult =
  | {
      applicable: true;
      styles: Record<string, Record<string, string>>;
      snapshot?: Pick<
        CaptureResult,
        "elements" | "order" | "rootElementId" | "rootOuterHtml"
      >;
      evidence?: {
        screenshot?: string;
        replay?: string;
        gaps: string[];
        pixelClip?: PixelClip;
      };
    }
  | { applicable: false; reason: string };

export interface CaptureResult {
  elements: Record<string, ElementSnapshot>;
  metadata: CaptureMetadata;
  order: string[];
  rootElementId: string;
  rootOuterHtml: string;
  settings: CaptureSettings;
  /** Optional per-state captures; `elements` stays the resting capture. */
  states?: Partial<Record<CaptureState, StateCaptureResult>>;
  summary: CaptureSummary;
  version: 1;
}
