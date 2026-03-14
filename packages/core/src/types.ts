export type CaptureMode = "curated" | "full";
export type PseudoElementKind = "before" | "after";

export interface CaptureSettings {
  captureMode: CaptureMode;
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

export interface CaptureMetadata {
  capturedAt?: string;
  title?: string;
  url: string;
  userAgent?: string;
}

export interface CaptureResult {
  elements: Record<string, ElementSnapshot>;
  metadata: CaptureMetadata;
  order: string[];
  rootElementId: string;
  rootOuterHtml: string;
  settings: CaptureSettings;
  summary: CaptureSummary;
  version: 1;
}
