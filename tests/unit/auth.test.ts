import { jest } from '@jest/globals';

// Mock browser API
const mockBrowser = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
  cookies: {
    get: jest.fn(),
    getAll: jest.fn(),
    remove: jest.fn(),
  },
  tabs: {
    create: jest.fn(),
  },
  runtime: {
    getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`),
  },
};

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

jest.mock('../../src/shared/browser', () => ({
  browser: mockBrowser,
}));

import {
  isLoggedIn,
  clearAuthState,
  openLoginPage,
  getApiBaseUrl,
} from '../../src/background/auth';

describe('Auth Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isLoggedIn', () => {
    it('should return true when auth cookie exists', async () => {
      mockBrowser.storage.local.get.mockResolvedValue({
        api_base_url: 'https://test-api.com',
      });
      mockBrowser.cookies.getAll.mockResolvedValue([
        {
          name: 'access_token_cookie',
          value: 'test-token',
        },
      ]);

      const result = await isLoggedIn();

      expect(result).toBe(true);
      expect(mockBrowser.cookies.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'access_token_cookie',
        })
      );
    });

    it('should return false when no auth cookie', async () => {
      mockBrowser.storage.local.get.mockResolvedValue({
        api_base_url: 'https://test-api.com',
      });
      mockBrowser.cookies.getAll.mockResolvedValue([]);

      const result = await isLoggedIn();

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockBrowser.storage.local.get.mockResolvedValue({
        api_base_url: 'https://test-api.com',
      });
      mockBrowser.cookies.getAll.mockRejectedValue(new Error('Cookie error'));

      const result = await isLoggedIn();

      expect(result).toBe(false);
    });
  });

  describe('clearAuthState', () => {
    it('should clear all auth-related storage', async () => {
      mockBrowser.storage.local.get.mockResolvedValue({
        api_base_url: 'https://test-api.com',
      });

      await clearAuthState();

      expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith([
        'auth_state',
        'cached_projects',
        'cached_categories',
        'csrf_token',
      ]);
    });

    it('should remove auth cookie', async () => {
      mockBrowser.storage.local.get.mockResolvedValue({
        api_base_url: 'https://test-api.com',
      });

      await clearAuthState();

      expect(mockBrowser.cookies.remove).toHaveBeenCalledWith({
        url: 'https://test-api.com',
        name: 'access_token_cookie',
      });
    });

    it('should handle errors gracefully', async () => {
      mockBrowser.storage.local.get.mockResolvedValue({
        api_base_url: 'https://test-api.com',
      });
      mockBrowser.storage.local.remove.mockRejectedValue(
        new Error('Storage error')
      );

      await expect(clearAuthState()).rejects.toThrow('Storage error');
    });
  });

  describe('openLoginPage', () => {
    it('should open login page in new tab', async () => {
      mockBrowser.storage.local.get.mockResolvedValue({
        api_base_url: 'https://test-api.com',
      });

      await openLoginPage();

      expect(mockBrowser.tabs.create).toHaveBeenCalledWith({
        url: expect.stringContaining('https://test-api.com/login'),
        active: true,
      });
    });

    it('should use default URL if not configured', async () => {
      mockBrowser.storage.local.get.mockResolvedValue({});

      await openLoginPage();

      expect(mockBrowser.tabs.create).toHaveBeenCalledWith({
        url: expect.stringContaining('/login'),
        active: true,
      });
    });
  });

  describe('getApiBaseUrl', () => {
    it('should return stored API base URL', async () => {
      mockBrowser.storage.local.get.mockResolvedValue({
        api_base_url: 'https://custom-api.com',
      });

      const result = await getApiBaseUrl();

      expect(result).toBe('https://custom-api.com');
    });

    it('should return default URL when not set', async () => {
      mockBrowser.storage.local.get.mockResolvedValue({});

      const result = await getApiBaseUrl();

      expect(result).toBe('https://ref-lex.site');
    });
  });
});
