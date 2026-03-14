import { vi } from "vitest";

const createStorageArea = () => ({
  get: vi.fn(() => ({})),
  getBytesInUse: vi.fn(() => 0),
  remove: vi.fn(() => {
    // noop
  }),
  set: vi.fn(() => {
    // noop
  }),
});

Object.defineProperty(globalThis, "chrome", {
  configurable: true,
  value: {
    action: {
      onClicked: {
        addListener: vi.fn(),
      },
      setIcon: vi.fn(() => {
        // noop
      }),
      setTitle: vi.fn(() => {
        // noop
      }),
    },
    runtime: {
      getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
      sendMessage: vi.fn(() => {
        // noop
      }),
    },
    scripting: {
      executeScript: vi.fn(() => {
        // noop
      }),
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
      create: vi.fn(() => {
        // noop
      }),
      query: vi.fn(() => []),
    },
  },
});
