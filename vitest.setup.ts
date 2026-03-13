import { vi } from "vitest";

function createStorageArea() {
  return {
    get: vi.fn(async () => ({})),
    getBytesInUse: vi.fn(async () => 0),
    remove: vi.fn(async () => undefined),
    set: vi.fn(async () => undefined),
  };
}

Object.defineProperty(globalThis, "chrome", {
  configurable: true,
  value: {
    action: {
      onClicked: {
        addListener: vi.fn(),
      },
      setIcon: vi.fn(async () => undefined),
      setTitle: vi.fn(async () => undefined),
    },
    runtime: {
      getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
      sendMessage: vi.fn(async () => undefined),
    },
    scripting: {
      executeScript: vi.fn(async () => undefined),
    },
    storage: {
      local: createStorageArea(),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
      session: createStorageArea(),
    },
    tabs: {
      create: vi.fn(async () => undefined),
      query: vi.fn(async () => []),
    },
  },
});
