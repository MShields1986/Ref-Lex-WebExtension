// Mock for webextension-polyfill
const browser = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
    getManifest: jest.fn(() => ({ version: '1.0.0' })),
  },
  storage: {
    local: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve()),
      clear: jest.fn(() => Promise.resolve()),
    },
  },
  tabs: {
    query: jest.fn(() => Promise.resolve([])),
    sendMessage: jest.fn(() => Promise.resolve()),
  },
  cookies: {
    getAll: jest.fn(() => Promise.resolve([])),
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve({})),
    remove: jest.fn(() => Promise.resolve({})),
  },
};

module.exports = browser;
module.exports.default = browser;
