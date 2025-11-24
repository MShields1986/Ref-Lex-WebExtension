import { jest } from '@jest/globals';

// Mock browser API BEFORE any imports that use it
const mockBrowser = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
  cookies: {
    getAll: jest.fn(),
    remove: jest.fn(),
  },
};

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

jest.mock('../../src/shared/browser', () => ({
  browser: mockBrowser,
}));

jest.mock('../../src/background/auth', () => ({
  getApiBaseUrl: jest.fn().mockResolvedValue('https://test-api.com'),
}));

import {
  checkAuthStatus,
  getProjects,
  getProject,
  createProject,
  getCategories,
  getReferences,
  addReference,
  updateReference,
  deleteReference,
  getBackendVersion,
  fetchBibtexFromDoi,
  fetchBibtexFromArxiv,
} from '../../src/background/api';
import { AuthenticationError, NetworkError } from '../../src/shared/types';

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBrowser.cookies.getAll.mockResolvedValue([
      { name: 'access_token_cookie', value: 'test-token' },
    ]);
    mockBrowser.storage.local.get.mockResolvedValue({
      csrf_token: 'test-csrf-token',
    });
  });

  describe('checkAuthStatus', () => {
    it('should return user data on successful auth check', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        isEmailVerified: true,
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
        headers: new Headers(),
      } as Response);

      const result = await checkAuthStatus();

      expect(result).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-api.com/api/account',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should throw AuthenticationError on 401', async () => {
      // Mock both the initial request and the retry (GET doesn't fetch CSRF token)
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' }),
          headers: new Headers(),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' }),
          headers: new Headers(),
        } as Response);

      await expect(checkAuthStatus()).rejects.toThrow(AuthenticationError);
    });

    it('should timeout after 30 seconds', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';

      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        abortError
      );

      await expect(checkAuthStatus()).rejects.toThrow(NetworkError);
    });
  });

  describe('getProjects', () => {
    it('should fetch and return projects', async () => {
      const mockProjects = [
        { id: 1, name: 'Project 1', description: 'Test 1' },
        { id: 2, name: 'Project 2', description: 'Test 2' },
      ];

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects,
        headers: new Headers(),
      } as Response);

      const result = await getProjects();

      expect(result).toEqual(mockProjects);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-api.com/api/projects',
        expect.any(Object)
      );
    });

    it('should include auth cookie in request', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: new Headers(),
      } as Response);

      await getProjects();

      const fetchCall = (global.fetch as jest.MockedFunction<typeof fetch>).mock
        .calls[0];
      const headers = fetchCall[1]?.headers as Record<string, string>;

      expect(headers.Cookie).toContain('access_token_cookie=test-token');
    });
  });

  describe('createProject', () => {
    it('should create project with name and description', async () => {
      const mockProject = {
        id: 1,
        name: 'New Project',
        description: 'Test Description',
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject,
        headers: new Headers(),
      } as Response);

      const result = await createProject('New Project', 'Test Description');

      expect(result).toEqual(mockProject);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-api.com/api/projects',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'New Project',
            description: 'Test Description',
          }),
        })
      );
    });

    it('should include CSRF token for POST requests', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        headers: new Headers(),
      } as Response);

      await createProject('Test', 'Desc');

      const fetchCall = (global.fetch as jest.MockedFunction<typeof fetch>).mock
        .calls[0];
      const headers = fetchCall[1]?.headers as Record<string, string>;

      expect(headers['X-CSRF-Token']).toBe('test-csrf-token');
    });
  });

  describe('addReference', () => {
    it('should add reference to project', async () => {
      const mockResponse = {
        id: 1,
        reference_id: 123,
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers(),
      } as Response);

      const referenceData = {
        bibtex_raw: '@article{test, title={Test}}',
        category_id: 1,
        notes: 'Test notes',
        rating: 5,
      };

      const result = await addReference(1, referenceData);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-api.com/api/projects/1/references',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(referenceData),
        })
      );
    });
  });

  describe('updateReference', () => {
    it('should update reference', async () => {
      const mockReference = {
        id: 1,
        notes: 'Updated notes',
        rating: 4,
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockReference,
        headers: new Headers(),
      } as Response);

      const result = await updateReference(1, { notes: 'Updated notes' });

      expect(result).toEqual(mockReference);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-api.com/api/references/1',
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });
  });

  describe('deleteReference', () => {
    it('should delete reference', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        headers: new Headers(),
      } as Response);

      await deleteReference(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-api.com/api/references/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('getCategories', () => {
    it('should fetch categories for project', async () => {
      const mockCategories = [
        { id: 1, name: 'Category 1' },
        { id: 2, name: 'Category 2' },
      ];

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
        headers: new Headers(),
      } as Response);

      const result = await getCategories(1);

      expect(result).toEqual(mockCategories);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-api.com/api/projects/1/categories',
        expect.any(Object)
      );
    });
  });

  describe('getBackendVersion', () => {
    it('should return backend version info', async () => {
      const mockVersion = {
        version: '1.0.0',
        apiVersion: '1',
        minExtensionVersion: '1.0.0',
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersion,
        headers: new Headers(),
      } as Response);

      const result = await getBackendVersion();

      expect(result).toEqual(mockVersion);
    });

    it('should return default version on error', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await getBackendVersion();

      expect(result.version).toBe('1.0.0');
      expect(result.apiVersion).toBe('1');
    });
  });

  describe('fetchBibtexFromDoi', () => {
    it('should fetch BibTeX from DOI API', async () => {
      const mockBibtex = '@article{test, title={Test Article}}';

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        text: async () => mockBibtex,
        headers: new Headers(),
      } as Response);

      const result = await fetchBibtexFromDoi('10.1234/test');

      expect(result).toBe(mockBibtex);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://doi.org/10.1234/test',
        expect.objectContaining({
          headers: { Accept: 'application/x-bibtex' },
        })
      );
    });

    it('should return null on fetch failure', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await fetchBibtexFromDoi('10.1234/invalid');

      expect(result).toBeNull();
    });

    it('should timeout after 15 seconds', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';

      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        abortError
      );

      const result = await fetchBibtexFromDoi('10.1234/test');

      expect(result).toBeNull();
    });
  });

  describe('fetchBibtexFromArxiv', () => {
    it('should fetch BibTeX from ArXiv API', async () => {
      const mockBibtex = '@article{arxiv, title={ArXiv Paper}}';

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        text: async () => mockBibtex,
        headers: new Headers(),
      } as Response);

      const result = await fetchBibtexFromArxiv('2103.00020');

      expect(result).toBe(mockBibtex);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://arxiv.org/bibtex/2103.00020',
        expect.any(Object)
      );
    });

    it('should return null on fetch failure', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await fetchBibtexFromArxiv('invalid');

      expect(result).toBeNull();
    });
  });

  describe('Rate Limit Handling', () => {
    it('should parse rate limit headers', async () => {
      const headers = new Headers();
      headers.set('X-RateLimit-Limit', '100');
      headers.set('X-RateLimit-Remaining', '50');
      headers.set('X-RateLimit-Reset', '1234567890');

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers,
      } as Response);

      await getProjects();

      // Rate limit info should be stored
      expect(mockBrowser.storage.local.set).toHaveBeenCalled();
    });

    it('should throw error on 429 Too Many Requests', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded' }),
        headers: new Headers(),
      } as Response);

      await expect(getProjects()).rejects.toThrow(/too quickly|rate limit/i);
    });
  });

  describe('CSRF Token Refresh', () => {
    it('should retry request with new CSRF token on 401', async () => {
      // Mock storage to return CSRF token initially, then empty after cleared
      let csrfCleared = false;
      mockBrowser.storage.local.get.mockImplementation(async (key) => {
        if (key === 'csrf_token') {
          return csrfCleared ? {} : { csrf_token: 'test-csrf-token' };
        }
        return { api_base_url: 'https://test-api.com' };
      });

      // When CSRF token is removed, set the flag
      mockBrowser.storage.local.remove.mockImplementation(async (key) => {
        if (key === 'csrf_token') {
          csrfCleared = true;
        }
      });

      // First call fails with 401
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Invalid CSRF token' }),
          headers: new Headers(),
        } as Response)
        // Second call to get new CSRF token
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'X-CSRF-Token': 'new-csrf-token' }),
          statusText: 'OK',
        } as Response)
        // Third call with new token succeeds
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ id: 1, name: 'Project' }),
          headers: new Headers(),
          statusText: 'OK',
        } as Response);

      const result = await createProject('Test', 'Description');

      expect(result).toHaveProperty('id', 1);
      expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith('csrf_token');
    });
  });
});
