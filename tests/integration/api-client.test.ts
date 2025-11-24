/**
 * Integration tests for API client
 * These tests mock fetch calls and test the API client logic
 */

import * as apiClient from '../../src/background/api';
import { browser } from '../../src/shared/browser';
import { API_ENDPOINTS } from '../../src/shared/constants';

// Mock browser storage
const mockStorage: Record<string, any> = {};

beforeEach(() => {
  // Reset storage
  Object.keys(mockStorage).forEach(key => delete mockStorage[key]);

  // Mock storage.local methods
  (browser.storage.local.get as jest.Mock).mockImplementation((keys) => {
    if (typeof keys === 'string') {
      return Promise.resolve({ [keys]: mockStorage[keys] });
    }
    if (Array.isArray(keys)) {
      const result: Record<string, any> = {};
      keys.forEach(key => {
        result[key] = mockStorage[key];
      });
      return Promise.resolve(result);
    }
    return Promise.resolve(mockStorage);
  });

  (browser.storage.local.set as jest.Mock).mockImplementation((items) => {
    Object.assign(mockStorage, items);
    return Promise.resolve();
  });

  (browser.storage.local.remove as jest.Mock).mockImplementation((keys) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    keysArray.forEach(key => delete mockStorage[key]);
    return Promise.resolve();
  });

  // Mock cookies
  (browser.cookies.getAll as jest.Mock).mockResolvedValue([
    { name: 'sessionid', value: 'mock-session-id' }
  ]);

  // Reset fetch mock
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('API Client Integration Tests', () => {
  describe('CSRF Token Management', () => {
    it('should fetch and cache CSRF token', async () => {
      // Mock successful CSRF token fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'X-CSRF-Token' ? 'test-csrf-token' : null,
        },
      });

      // Mock user check endpoint
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, email: 'test@example.com' }),
        headers: new Headers(),
      });

      // Test a protected endpoint (checkAuth will fetch CSRF if needed)
      await expect(apiClient.checkAuth()).resolves.not.toThrow();

      // Verify CSRF token was stored
      expect(mockStorage.csrf_token).toBe('test-csrf-token');
    });

    it('should retry request with new CSRF token on 403', async () => {
      // First request - mock 403 CSRF error
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name: string) => name === 'X-CSRF-Token' ? 'old-token' : null,
          },
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          json: async () => ({ error: 'CSRF token invalid' }),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name: string) => name === 'X-CSRF-Token' ? 'new-token' : null,
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 1, email: 'test@example.com' }),
          headers: new Headers(),
        });

      await expect(apiClient.checkAuth()).resolves.not.toThrow();
    });
  });

  describe('Authentication', () => {
    it('should check authentication status', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name: string) => name === 'X-CSRF-Token' ? 'token' : null,
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 1, email: 'user@example.com', name: 'Test User' }),
          headers: new Headers(),
        });

      const user = await apiClient.checkAuth();

      expect(user).toEqual({
        id: 1,
        email: 'user@example.com',
        name: 'Test User',
      });
    });

    it('should handle unauthenticated state', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name: string) => name === 'X-CSRF-Token' ? 'token' : null,
        },
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ error: 'Not authenticated' }),
          headers: new Headers(),
        });

      await expect(apiClient.checkAuth()).rejects.toThrow();
    });

    it('should login with credentials', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name: string) => name === 'X-CSRF-Token' ? 'token' : null,
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 1, email: 'test@example.com' }),
          headers: new Headers(),
        });

      const user = await apiClient.login('test@example.com', 'password123');

      expect(user.email).toBe('test@example.com');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(API_ENDPOINTS.LOGIN),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    it('should handle login failure', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name: string) => name === 'X-CSRF-Token' ? 'token' : null,
          },
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ error: 'Invalid credentials' }),
          headers: new Headers(),
        });

      await expect(
        apiClient.login('test@example.com', 'wrong-password')
      ).rejects.toThrow();
    });

    it('should logout and clear tokens', async () => {
      // Set up initial state
      mockStorage.csrf_token = 'test-token';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
      });

      await apiClient.logout();

      expect(mockStorage.csrf_token).toBeUndefined();
    });
  });

  describe('Projects API', () => {
    beforeEach(() => {
      // Mock CSRF token fetch for all tests
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'X-CSRF-Token' ? 'token' : null,
        },
      });
    });

    it('should fetch projects list', async () => {
      const mockProjects = [
        { id: 1, name: 'Project 1', description: 'Test project' },
        { id: 2, name: 'Project 2', description: 'Another project' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects,
        headers: new Headers(),
      });

      const projects = await apiClient.getProjects();

      expect(projects).toEqual(mockProjects);
      expect(projects).toHaveLength(2);
    });

    it('should handle empty projects list', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: new Headers(),
      });

      const projects = await apiClient.getProjects();

      expect(projects).toEqual([]);
    });

    it('should handle API errors when fetching projects', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Database error' }),
        headers: new Headers(),
      });

      await expect(apiClient.getProjects()).rejects.toThrow();
    });
  });

  describe('Categories API', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'X-CSRF-Token' ? 'token' : null,
        },
      });
    });

    it('should fetch categories list', async () => {
      const mockCategories = [
        { id: 1, name: 'Machine Learning', color: '#ff0000' },
        { id: 2, name: 'Deep Learning', color: '#00ff00' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
        headers: new Headers(),
      });

      const categories = await apiClient.getCategories();

      expect(categories).toEqual(mockCategories);
      expect(categories).toHaveLength(2);
    });
  });

  describe('Add Reference API', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'X-CSRF-Token' ? 'token' : null,
        },
      });
    });

    it('should add a reference successfully', async () => {
      const referenceData = {
        project_id: 1,
        title: 'Test Paper',
        authors: ['John Doe'],
        year: '2023',
        bibtex: '@article{doe2023test, title={Test Paper}}',
      };

      const mockResponse = {
        id: 123,
        ...referenceData,
        created_at: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      const result = await apiClient.addReference(referenceData);

      expect(result.id).toBe(123);
      expect(result.title).toBe('Test Paper');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(API_ENDPOINTS.ADD_REFERENCE),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle validation errors', async () => {
      const referenceData = {
        project_id: 1,
        title: '',  // Invalid - empty title
        bibtex: '@article{}',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Title is required' }),
        headers: new Headers(),
      });

      await expect(apiClient.addReference(referenceData)).rejects.toThrow();
    });
  });

  describe('Rate Limiting', () => {
    it('should parse and store rate limit headers', async () => {
      const rateLimitHeaders = new Headers({
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '75',
        'X-RateLimit-Reset': '1640000000',
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name: string) => name === 'X-CSRF-Token' ? 'token' : null,
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([]),
          headers: rateLimitHeaders,
        });

      await apiClient.getProjects();

      // Rate limit info should be stored
      expect(mockStorage.rate_limit_info).toEqual({
        limit: 100,
        remaining: 75,
        reset: 1640000000,
      });
    });
  });

  describe('Network Error Handling', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'X-CSRF-Token' ? 'token' : null,
        },
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to fetch')
      );

      await expect(apiClient.getProjects()).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Request timeout')
      );

      await expect(apiClient.checkAuth()).rejects.toThrow();
    });
  });
});
