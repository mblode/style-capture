import {
  MESSAGE_TYPE_CAPTURE_CANCELLED,
  MESSAGE_TYPE_CAPTURE_COMPLETED,
} from "@/lib/messages.ts";
import type {
  CaptureCancelledMessage,
  CaptureCompletedMessage,
} from "@/lib/messages.ts";
import type { CaptureSettings } from "@/lib/types.ts";

import { runPicker } from "./run-picker.ts";

const settings: CaptureSettings = {
  captureMode: "curated",
  includeHiddenElements: false,
  includePseudoElements: true,
};

const createRect = (
  left: number,
  top: number,
  width: number,
  height: number
): DOMRect =>
  ({
    bottom: top + height,
    height,
    left,
    right: left + width,
    toJSON: () => ({}),
    top,
    width,
    x: left,
    y: top,
  }) as DOMRect;

const mockRect = (
  element: Element,
  left: number,
  top: number,
  width: number,
  height: number
): void => {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
    createRect(left, top, width, height)
  );
};

const createPointerEvent = (
  type: "pointerdown" | "pointermove",
  target: EventTarget,
  options: {
    clientX?: number;
    clientY?: number;
  } = {}
): Event => {
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
};

const getPickerHost = (): HTMLDivElement => {
  const host = document.querySelector<HTMLDivElement>(
    "#style-capture-picker-host"
  );
  if (!host) {
    throw new Error("Picker host was not mounted.");
  }

  return host;
};

const getTooltip = (host: HTMLDivElement): HTMLDivElement => {
  const tooltip = host.shadowRoot?.querySelector<HTMLDivElement>(".tooltip");
  if (!tooltip) {
    throw new Error("Picker tooltip was not mounted.");
  }

  return tooltip;
};

const getSendMessageCall = (index: number) => {
  const { calls } = vi.mocked(chrome.runtime.sendMessage).mock;
  const call = calls[index];
  if (!call) {
    throw new Error(
      `Expected sendMessage call at index ${index} but found none.`
    );
  }
  return call;
};

/* eslint-disable vitest/max-expects -- picker tests verify many DOM properties per interaction */
describe("runPicker()", () => {
  // eslint-disable-next-line vitest/no-hooks -- shared picker cleanup and chrome mock reset needed before each test
  beforeEach(() => {
    const view = window as Window & {
      __STYLE_CAPTURE_PICKER__?: {
        cleanup: () => void;
      };
    };

    view.__STYLE_CAPTURE_PICKER__?.cleanup();
    document.body.innerHTML = "";
    document.querySelector("#style-capture-picker-cursor-style")?.remove();
    vi.restoreAllMocks();
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: vi.fn(() => null),
    });
    Object.defineProperty(globalThis, "CSS", {
      configurable: true,
      value: {
        ...globalThis.CSS,
        escape: (value: string) => value,
      },
    });
    document.title = "Vitest Page";
    vi.mocked(chrome.runtime.sendMessage).mockReset();
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValue();
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
      document.querySelector("#style-capture-picker-cursor-style")
    ).not.toBeNull();
    expect(runPicker(settings)).toBe("deactivated");

    // Re-activate to test Escape cleanup
    expect(runPicker(settings)).toBe("activated");

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        key: "Escape",
      })
    );
    await Promise.resolve();

    const [message] = getSendMessageCall(0);
    const payload = message as CaptureCancelledMessage | undefined;

    expect(payload?.type).toBe(MESSAGE_TYPE_CAPTURE_CANCELLED);
    expect(document.querySelector("#style-capture-picker-host")).toBeNull();
    expect(
      document.querySelector("#style-capture-picker-cursor-style")
    ).toBeNull();
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
    const frameEl = host.shadowRoot?.querySelector<HTMLDivElement>(".frame");
    const tooltip = getTooltip(host);
    const tooltipPanel =
      tooltip.querySelector<HTMLDivElement>(".tooltip__panel");

    expect(frameEl?.hidden).toBeFalsy();
    expect(frameEl?.style.transform).toBe("translate(40px, 20px)");
    expect(frameEl?.style.width).toBe("80px");
    expect(frameEl?.style.height).toBe("30px");
    expect(tooltip.hidden).toBeFalsy();
    expect(tooltip.style.left).toBe("124px");
    expect(tooltip.style.top).toBe("46px");
    expect(tooltipPanel?.textContent).toBe("button");
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
    const tooltipPanel =
      tooltip.querySelector<HTMLDivElement>(".tooltip__panel");

    document.dispatchEvent(
      createPointerEvent(
        "pointermove",
        tooltipPanel as unknown as EventTarget,
        {
          clientX: 32,
          clientY: 36,
        }
      )
    );

    expect(tooltipPanel?.textContent).toBe("div");
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

    expect(chrome.runtime.sendMessage).toHaveBeenCalledOnce();

    const [message] = getSendMessageCall(0);
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
  });

  it("omits hidden descendants from exported html when hidden elements are disabled", async () => {
    const root = document.createElement("div");
    root.id = "capture-root";

    const visible = document.createElement("span");
    visible.textContent = "Visible";

    const hidden = document.createElement("span");
    hidden.textContent = "Hidden";
    hidden.style.display = "none";

    root.append(visible, hidden);
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

    const [message] = getSendMessageCall(0);
    const payload = message as CaptureCompletedMessage | undefined;

    expect(payload?.capture.order).toStrictEqual(["node-0", "node-1"]);
    expect(payload?.capture.rootOuterHtml).toContain("Visible");
    expect(payload?.capture.rootOuterHtml).not.toContain("Hidden");
  });

  it("omits hidden descendants with inline style display:none from exported html", async () => {
    const root = document.createElement("div");
    root.id = "capture-root";
    root.innerHTML = [
      '<span class="visible-copy">Visible copy</span>',
      '<span class="hidden-copy" style="display:none">Hidden copy</span>',
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

    const [message] = getSendMessageCall(0);
    const payload = message as CaptureCompletedMessage | undefined;

    expect(payload?.capture.rootOuterHtml).toContain("Visible copy");
    expect(payload?.capture.rootOuterHtml).not.toContain("Hidden copy");
    expect(payload?.capture.order).toHaveLength(2);
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

    const [message] = getSendMessageCall(0);
    const payload = message as CaptureCompletedMessage | undefined;
    const captureResult = payload?.capture;

    expect(captureResult?.elements["node-0"]?.styles).toStrictEqual(
      expect.objectContaining({
        color: "rgb(255, 0, 0)",
        display: "flex",
      })
    );
    expect(captureResult?.elements["node-1"]?.styles).not.toHaveProperty(
      "color"
    );
    expect(captureResult?.elements["node-1"]?.styles).not.toHaveProperty(
      "display"
    );
    expect(captureResult?.elements["node-2"]?.styles).not.toHaveProperty(
      "display"
    );
  });
});
