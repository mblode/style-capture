import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type CaptureCancelledMessage,
  type CaptureCompletedMessage,
  MESSAGE_TYPE_CAPTURE_CANCELLED,
  MESSAGE_TYPE_CAPTURE_COMPLETED,
} from "@/lib/messages.ts";
import type { CaptureSettings } from "@/lib/types.ts";
import { runPicker } from "./run-picker.ts";

const settings: CaptureSettings = {
  captureMode: "curated",
  includeHiddenElements: false,
  includePseudoElements: true,
};

function createRect(
  left: number,
  top: number,
  width: number,
  height: number
): DOMRect {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    toJSON: () => ({}),
    top,
    width,
    x: left,
    y: top,
  } as DOMRect;
}

function mockRect(
  element: Element,
  left: number,
  top: number,
  width: number,
  height: number
): void {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
    createRect(left, top, width, height)
  );
}

function createPointerEvent(
  type: "pointerdown" | "pointermove",
  target: EventTarget,
  options: {
    clientX?: number;
    clientY?: number;
  } = {}
): Event {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: options.clientX ?? 16,
    clientY: options.clientY ?? 16,
  });

  Object.defineProperty(event, "composedPath", {
    configurable: true,
    value: () => [target],
  });

  return event;
}

function getPickerHost(): HTMLDivElement {
  const host = document.querySelector<HTMLDivElement>("#live-css-picker-host");
  if (!host) {
    throw new Error("Picker host was not mounted.");
  }

  return host;
}

function getTooltip(host: HTMLDivElement): HTMLDivElement {
  const tooltip = host.shadowRoot?.querySelector<HTMLDivElement>(".tooltip");
  if (!tooltip) {
    throw new Error("Picker tooltip was not mounted.");
  }

  return tooltip;
}

describe("runPicker", () => {
  beforeEach(() => {
    const view = window as Window & {
      __LIVE_CSS_PICKER__?: {
        cleanup: () => void;
      };
    };

    view.__LIVE_CSS_PICKER__?.cleanup();
    document.body.innerHTML = "";
    document.querySelector("#live-css-picker-cursor-style")?.remove();
    vi.restoreAllMocks();
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: vi.fn(() => null),
    });
    Object.defineProperty(globalThis, "CSS", {
      configurable: true,
      value: {
        ...(globalThis.CSS ?? {}),
        escape: (value: string) => value,
      },
    });
    document.title = "Vitest Page";
    vi.mocked(chrome.runtime.sendMessage).mockReset();
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValue(undefined);
  });

  it("mounts one overlay, injects the inspect cursor, and cleans up on escape", async () => {
    expect(
      runPicker({
        ...settings,
        includePseudoElements: false,
      })
    ).toBe("activated");

    const host = getPickerHost();
    expect(host.shadowRoot?.querySelector(".frame")).not.toBeNull();
    expect(host.shadowRoot?.querySelector(".tooltip")).not.toBeNull();
    expect(
      document.querySelector("#live-css-picker-cursor-style")
    ).not.toBeNull();
    expect(runPicker(settings)).toBe("already-active");

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        key: "Escape",
      })
    );
    await Promise.resolve();

    const [message] = vi.mocked(chrome.runtime.sendMessage).mock.calls[0] ?? [];
    const payload = message as CaptureCancelledMessage | undefined;

    expect(payload?.type).toBe(MESSAGE_TYPE_CAPTURE_CANCELLED);
    expect(document.querySelector("#live-css-picker-host")).toBeNull();
    expect(document.querySelector("#live-css-picker-cursor-style")).toBeNull();
  });

  it("updates the bounding frame and tooltip label while hovering", () => {
    const main = document.createElement("main");
    const section = document.createElement("section");
    section.className = "pricing";
    const button = document.createElement("button");
    button.className = "primary";
    section.append(button);
    main.append(section);
    document.body.append(main);
    mockRect(button, 40, 20, 80, 30);

    expect(runPicker(settings)).toBe("activated");

    document.dispatchEvent(
      createPointerEvent("pointermove", button, {
        clientX: 120,
        clientY: 50,
      })
    );

    const host = getPickerHost();
    const frame = host.shadowRoot?.querySelector<HTMLDivElement>(".frame");
    const tooltip = getTooltip(host);
    const tooltipLabel =
      tooltip.querySelector<HTMLSpanElement>(".tooltip__label");

    expect(frame?.hidden).toBe(false);
    expect(frame?.style.transform).toBe("translate(40px, 20px)");
    expect(frame?.style.width).toBe("80px");
    expect(frame?.style.height).toBe("30px");
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.style.left).toBe("120px");
    expect(tooltip.style.top).toBe("62px");
    expect(tooltip.style.getPropertyValue("--tooltip-edge-offset")).toBe("0px");
    expect(tooltip.dataset.arrowPosition).toBe("bottom");
    expect(tooltipLabel?.textContent).toBe(
      "main > section.pricing > button.primary"
    );
  });

  it("ignores overlay nodes and falls back to elementFromPoint for hover targeting", () => {
    const target = document.createElement("div");
    target.id = "capture-root";
    document.body.append(target);
    mockRect(target, 12, 24, 48, 24);
    vi.mocked(document.elementFromPoint).mockReturnValue(target);

    expect(runPicker(settings)).toBe("activated");

    const host = getPickerHost();
    const tooltip = getTooltip(host);
    const tooltipLabel =
      tooltip.querySelector<HTMLSpanElement>(".tooltip__label");

    document.dispatchEvent(
      createPointerEvent(
        "pointermove",
        tooltipLabel as unknown as EventTarget,
        {
          clientX: 32,
          clientY: 36,
        }
      )
    );

    expect(tooltipLabel?.textContent).toBe("html > body > div#capture-root");
  });

  it("captures the selected subtree and cleans up the overlay on click", async () => {
    const root = document.createElement("div");
    root.id = "capture-root";
    root.innerHTML = [
      '<a href="https://example.com" onclick="alert(1)">Link</a>',
      '<img src="https://example.com/image.png" srcset="a 1x" />',
      "<script>window.__bad = true</script>",
      "<textarea>secret value</textarea>",
    ].join("");
    document.body.append(root);
    mockRect(root, 8, 12, 64, 48);

    expect(runPicker({ ...settings, includePseudoElements: false })).toBe(
      "activated"
    );

    document.dispatchEvent(
      createPointerEvent("pointermove", root, {
        clientX: 48,
        clientY: 40,
      })
    );
    document.dispatchEvent(createPointerEvent("pointerdown", root));
    await Promise.resolve();

    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);

    const [message] = vi.mocked(chrome.runtime.sendMessage).mock.calls[0] ?? [];
    const payload = message as CaptureCompletedMessage | undefined;

    expect(payload?.type).toBe(MESSAGE_TYPE_CAPTURE_COMPLETED);
    expect(payload?.capture.rootElementId).toBe("node-0");
    expect(payload?.capture.elements["node-0"]?.selector).toBe("#capture-root");
    expect(payload?.capture.rootOuterHtml).not.toContain("onclick=");
    expect(payload?.capture.rootOuterHtml).not.toContain("href=");
    expect(payload?.capture.rootOuterHtml).not.toContain("src=");
    expect(payload?.capture.rootOuterHtml).not.toContain("srcset=");
    expect(payload?.capture.rootOuterHtml).not.toContain("<script");
    expect(payload?.capture.rootOuterHtml).not.toContain("secret value");
    expect(document.querySelector("#live-css-picker-host")).toBeNull();
    expect(document.querySelector("#live-css-picker-cursor-style")).toBeNull();
  });

  it("strips browser defaults and repeated inherited values in curated captures", async () => {
    const root = document.createElement("div");
    root.id = "capture-root";
    root.style.color = "rgb(255, 0, 0)";
    root.style.display = "flex";

    const label = document.createElement("span");
    label.textContent = "Hello";

    const button = document.createElement("button");
    button.textContent = "Press";

    root.append(label, button);
    document.body.append(root);
    mockRect(root, 8, 12, 64, 48);

    expect(runPicker({ ...settings, includePseudoElements: false })).toBe(
      "activated"
    );

    document.dispatchEvent(
      createPointerEvent("pointermove", root, {
        clientX: 48,
        clientY: 40,
      })
    );
    document.dispatchEvent(createPointerEvent("pointerdown", root));
    await Promise.resolve();

    const [message] = vi.mocked(chrome.runtime.sendMessage).mock.calls[0] ?? [];
    const payload = message as CaptureCompletedMessage | undefined;
    const capture = payload?.capture;

    expect(capture?.elements["node-0"]?.styles).toEqual(
      expect.objectContaining({
        color: "rgb(255, 0, 0)",
        display: "flex",
      })
    );
    expect(capture?.elements["node-1"]?.styles).not.toHaveProperty("color");
    expect(capture?.elements["node-1"]?.styles).not.toHaveProperty("display");
    expect(capture?.elements["node-2"]?.styles).not.toHaveProperty("display");
  });
});
