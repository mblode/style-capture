export const showToast = (message: string, isError: boolean): void => {
  const HOST_ID = "__style-capture-toast__";

  const existing = document.querySelector(`#${HOST_ID}`);
  if (existing) {
    existing.remove();
  }

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.position = "fixed";
  host.style.zIndex = "2147483647";
  host.style.bottom = "24px";
  host.style.left = "50%";
  host.style.transform = "translateX(-50%)";
  host.style.pointerEvents = "none";

  const shadow = host.attachShadow({ mode: "closed" });

  const toast = document.createElement("div");
  toast.textContent = message;

  const bg = isError ? "rgba(220, 38, 38, 0.92)" : "rgba(15, 15, 15, 0.92)";
  const border = isError
    ? "1px solid rgba(248, 113, 113, 0.3)"
    : "1px solid rgba(255, 255, 255, 0.12)";

  toast.style.cssText = [
    `background: ${bg}`,
    `border: ${border}`,
    "border-radius: 8px",
    "color: #fff",
    "font: 13px/1.4 'Glide', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    "padding: 10px 16px",
    "backdrop-filter: blur(12px)",
    "-webkit-backdrop-filter: blur(12px)",
    "box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28)",
    "opacity: 0",
    "transition: opacity 0.2s ease",
    "white-space: nowrap",
  ].join("; ");

  shadow.append(toast);
  document.documentElement.append(host);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => host.remove(), 200);
  }, 2000);
};
