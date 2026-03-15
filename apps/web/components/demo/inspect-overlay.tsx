"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const GRAB_RGB = "67, 137, 245";
const FRAME_BORDER_COLOR = `rgba(${GRAB_RGB}, 1)`;
const FRAME_FILL_COLOR = `rgba(${GRAB_RGB}, 0.08)`;
const TOOLTIP_TEXT_MAX_LENGTH = 30;
const TOOLTIP_CURSOR_OFFSET_X = 4;
const TOOLTIP_CURSOR_OFFSET_Y = 4;
const LABEL_VIEWPORT_MARGIN = 8;
const CURSOR_STYLE_ID = "style-capture-demo-cursor-style";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const buildHoverLabel = (element: Element): string => {
  const tagName = element.tagName.toLowerCase();
  let textContent = "";
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        textContent = text;
        break;
      }
    }
  }
  if (textContent) {
    if (textContent.length > TOOLTIP_TEXT_MAX_LENGTH) {
      textContent = `${textContent.slice(0, TOOLTIP_TEXT_MAX_LENGTH)}...`;
    }
    return `${tagName} \u201C${textContent}\u201D`;
  }
  return tagName;
};

interface InspectOverlayProps {
  onCapture: (element: Element) => void;
  onDeactivate: () => void;
}

export const InspectOverlay = ({
  onCapture,
  onDeactivate,
}: InspectOverlayProps): React.JSX.Element | null => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipPanelRef = useRef<HTMLDivElement>(null);
  const currentTargetRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  // Inject crosshair cursor style
  useEffect(() => {
    const style = document.createElement("style");
    style.id = CURSOR_STYLE_ID;
    style.textContent = "html, body, body * { cursor: crosshair !important; }";
    document.head.append(style);
    return () => {
      style.remove();
    };
  }, []);

  const isOwnElement = useCallback((target: Element): boolean => {
    const overlay = overlayRef.current;
    if (!overlay) {
      return false;
    }
    return overlay.contains(target);
  }, []);

  const updateOverlay = useCallback(
    (target: Element, pointerX: number, pointerY: number) => {
      const frame = frameRef.current;
      const tooltip = tooltipRef.current;
      const tooltipPanel = tooltipPanelRef.current;
      if (!frame || !tooltip || !tooltipPanel) {
        return;
      }

      // Update frame
      const box = target.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(target);
      frame.style.display = "block";
      frame.style.transform = `translate(${box.left}px, ${box.top}px)`;
      frame.style.width = `${Math.max(box.width, 1)}px`;
      frame.style.height = `${Math.max(box.height, 1)}px`;
      frame.style.borderRadius = computedStyle.borderRadius || "0px";

      // Update tooltip
      tooltipPanel.textContent = buildHoverLabel(target);
      tooltip.style.display = "block";

      // Force layout so getBoundingClientRect returns real dimensions
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      tooltip.offsetHeight;

      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
      const panelRect = tooltipPanel.getBoundingClientRect();
      const labelWidth =
        panelRect.width || tooltipPanel.scrollWidth || tooltipPanel.offsetWidth;
      const tooltipRect = tooltip.getBoundingClientRect();
      const labelHeight =
        tooltipRect.height ||
        tooltip.scrollHeight ||
        tooltip.offsetHeight ||
        panelRect.height;

      let left = pointerX + TOOLTIP_CURSOR_OFFSET_X;
      let top = pointerY - labelHeight - TOOLTIP_CURSOR_OFFSET_Y;

      if (left + labelWidth > viewportWidth - LABEL_VIEWPORT_MARGIN) {
        left = pointerX - labelWidth - TOOLTIP_CURSOR_OFFSET_X;
      }
      left = Math.max(left, LABEL_VIEWPORT_MARGIN);

      if (top < LABEL_VIEWPORT_MARGIN) {
        top = pointerY + TOOLTIP_CURSOR_OFFSET_Y + 20;
      }
      top = clamp(
        top,
        LABEL_VIEWPORT_MARGIN,
        viewportHeight - labelHeight - LABEL_VIEWPORT_MARGIN
      );

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    },
    []
  );

  const hideOverlay = useCallback(() => {
    const frame = frameRef.current;
    const tooltip = tooltipRef.current;
    if (frame) {
      frame.style.display = "none";
    }
    if (tooltip) {
      tooltip.style.display = "none";
    }
  }, []);

  // Event listeners
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent): void => {
      const target =
        event.composedPath()[0] instanceof Element
          ? (event.composedPath()[0] as Element)
          : null;

      if (!target || isOwnElement(target)) {
        const fallback = document.elementFromPoint(
          event.clientX,
          event.clientY
        );
        if (fallback && !isOwnElement(fallback)) {
          currentTargetRef.current = fallback;
          updateOverlay(fallback, event.clientX, event.clientY);
        }
        return;
      }

      currentTargetRef.current = target;
      updateOverlay(target, event.clientX, event.clientY);
    };

    const handlePointerDown = (event: PointerEvent): void => {
      const target = currentTargetRef.current;
      if (!target || isOwnElement(target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      onCapture(target);
    };

    const handleClick = (event: MouseEvent): void => {
      const target = event.target instanceof Element ? event.target : null;
      if (target && isOwnElement(target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onDeactivate();
        return;
      }

      if (!currentTargetRef.current) {
        return;
      }

      if (event.key === "Shift") {
        const parent = currentTargetRef.current.parentElement;
        if (parent && parent !== document.documentElement) {
          currentTargetRef.current = parent;
          updateOverlay(
            parent,
            event instanceof MouseEvent ? event.clientX : 0,
            event instanceof MouseEvent ? event.clientY : 0
          );
        }
        return;
      }

      if (event.key === "Alt") {
        event.preventDefault();
        const child = currentTargetRef.current.firstElementChild;
        if (child) {
          currentTargetRef.current = child;
          updateOverlay(child, 0, 0);
        }
      }
    };

    document.addEventListener("pointermove", handlePointerMove, true);
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOwnElement, updateOverlay, onCapture, onDeactivate]);

  // Hide overlay on unmount
  useEffect(
    () => () => {
      hideOverlay();
    },
    [hideOverlay]
  );

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      ref={overlayRef}
      style={{
        inset: 0,
        pointerEvents: "none",
        position: "fixed",
        zIndex: 2_147_483_647,
      }}
    >
      {/* Highlight frame */}
      <div
        ref={frameRef}
        style={{
          background: FRAME_FILL_COLOR,
          border: `1px solid ${FRAME_BORDER_COLOR}`,
          borderRadius: 0,
          boxSizing: "border-box",
          display: "none",
          left: 0,
          pointerEvents: "none",
          position: "fixed",
          top: 0,
          zIndex: 2_147_483_646,
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          WebkitFontSmoothing: "antialiased",
          display: "none",
          filter: "drop-shadow(0px 1px 4px rgba(0, 0, 0, 0.3))",
          fontFamily:
            '"Glide", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: "13px",
          left: 0,
          lineHeight: "16px",
          maxWidth: "min(280px, calc(100vw - 16px))",
          pointerEvents: "none",
          position: "fixed",
          top: 0,
          transition: "opacity 100ms ease-out",
          userSelect: "none",
          width: "max-content",
          zIndex: 2_147_483_647,
        }}
      >
        <div
          ref={tooltipPanelRef}
          style={{
            alignItems: "center",
            background: "#232425",
            borderRadius: "8px",
            color: "#fff",
            display: "inline-flex",
            fontWeight: 500,
            padding: "6px 10px",
            whiteSpace: "nowrap",
          }}
        />
      </div>
    </div>,
    document.body
  );
};
