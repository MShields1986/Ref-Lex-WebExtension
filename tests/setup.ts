// Test setup file
import '@testing-library/jest-dom';

// Mock browser API
global.browser = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getURL: jest.fn((path: string) => `chrome-extension://fake-id/${path}`),
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
  cookies: {
    get: jest.fn(),
    getAll: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
} as any;

// Mock chrome API (for compatibility)
global.chrome = global.browser as any;
