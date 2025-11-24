import { jest } from '@jest/globals';

// Mock browser API
const mockBrowser = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      QUOTA_BYTES: 5242880, // 5MB
    },
  },
};

jest.mock('../../src/shared/browser', () => ({
  browser: mockBrowser,
}));

jest.mock('../../src/background/api', () => ({
  getProjects: jest.fn(),
  getCategories: jest.fn(),
}));

import {
  getCachedProjects,
  setCachedProjects,
  fetchAndCacheProjects,
  getCachedCategories,
  setCachedCategories,
  fetchAndCacheCategories,
  clearCachedCategories,
  getDefaultProjectId,
  setDefaultProjectId,
  getLastDetectedPaper,
  setLastDetectedPaper,
  clearLastDetectedPaper,
  clearAllCaches,
  getStorageUsage,
  isStorageNearQuota,
  getRateLimitInfo,
  setRateLimitInfo,
} from '../../src/background/storage';
import { getProjects, getCategories } from '../../src/background/api';
import { Project, Category, PaperMetadata, RateLimitInfo } from '../../src/shared/types';

describe('Storage Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Projects Caching', () => {
    it('should return null when no cached projects exist', async () => {
      mockBrowser.storage.local.get.mockResolvedValue({});

      const result = await getCachedProjects();

      expect(result).toBeNull();
    });

    it('should return cached projects when cache is valid', async () => {
      const mockProjects: Project[] = [
        { id: 1, name: 'Project 1', description: 'Test 1' },
        { id: 2, name: 'Project 2', description: 'Test 2' },
      ];

      mockBrowser.storage.local.get.mockResolvedValue({
        cached_projects: {
          projects: mockProjects,
          timestamp: Date.now(), // Fresh timestamp
        },
      });

      const result = await getCachedProjects();

      expect(result).toEqual(mockProjects);
    });

    it('should return null when cache is expired', async () => {
      const mockProjects: Project[] = [
        { id: 1, name: 'Project 1', description: 'Test 1' },
      ];

      // Set timestamp to 1 hour ago (cache timeout is 5 minutes)
      const expiredTimestamp = Date.now() - 60 * 60 * 1000;

      mockBrowser.storage.local.get.mockResolvedValue({
        cached_projects: {
          projects: mockProjects,
          timestamp: expiredTimestamp,
        },
      });

      const result = await getCachedProjects();

      expect(result).toBeNull();
    });

    it('should cache projects with timestamp', async () => {
      const mockProjects: Project[] = [
        { id: 1, name: 'Project 1', description: 'Test 1' },
      ];

      await setCachedProjects(mockProjects);

      expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
        cached_projects: {
          projects: mockProjects,
          timestamp: expect.any(Number),
        },
      });
    });

    it('should fetch and cache projects when cache is empty', async () => {
      const mockProjects: Project[] = [
        { id: 1, name: 'Project 1', description: 'Test 1' },
      ];

      mockBrowser.storage.local.get.mockResolvedValue({});
      (getProjects as jest.MockedFunction<typeof getProjects>).mockResolvedValue(
        mockProjects
      );

      const result = await fetchAndCacheProjects();

      expect(result).toEqual(mockProjects);
      expect(getProjects).toHaveBeenCalled();
      expect(mockBrowser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          cached_projects: expect.objectContaining({
            projects: mockProjects,
          }),
        })
      );
    });

    it('should return cached projects without fetching when cache is valid', async () => {
      const mockProjects: Project[] = [
        { id: 1, name: 'Cached Project', description: 'Test' },
      ];

      mockBrowser.storage.local.get.mockResolvedValue({
        cached_projects: {
          projects: mockProjects,
          timestamp: Date.now(),
        },
      });

      const result = await fetchAndCacheProjects();

      expect(result).toEqual(mockProjects);
      expect(getProjects).not.toHaveBeenCalled();
    });

    it('should force refresh when forceRefresh is true', async () => {
      const cachedProjects: Project[] = [
        { id: 1, name: 'Cached', description: 'Old' },
      ];
      const freshProjects: Project[] = [
        { id: 1, name: 'Fresh', description: 'New' },
      ];

      mockBrowser.storage.local.get.mockResolvedValue({
        cached_projects: {
          projects: cachedProjects,
          timestamp: Date.now(),
        },
      });
      (getProjects as jest.MockedFunction<typeof getProjects>).mockResolvedValue(
        freshProjects
      );

      const result = await fetchAndCacheProjects(true);

      expect(result).toEqual(freshProjects);
      expect(getProjects).toHaveBeenCalled();
    });
  });

  describe('Categories Caching', () => {
    it('should return null when no cached categories exist', async () => {
      mockBrowser.storage.local.get.mockResolvedValue({});

      const result = await getCachedCategories(1);

      expect(result).toBeNull();
    });

    it('should return cached categories when cache is valid', async () => {
      const mockCategories: Category[] = [
        { id: 1, name: 'Category 1', project_id: 1 },
        { id: 2, name: 'Category 2', project_id: 1 },
      ];

      mockBrowser.storage.local.get.mockResolvedValue({
        cached_categories: {
          1: {
            categories: mockCategories,
            timestamp: Date.now(),
          },
        },
      });

      const result = await getCachedCategories(1);

      expect(result).toEqual(mockCategories);
    });

    it('should return null when cache is expired', async () => {
      const mockCategories: Category[] = [
        { id: 1, name: 'Category 1', project_id: 1 },
      ];

      const expiredTimestamp = Date.now() - 60 * 60 * 1000;

      mockBrowser.storage.local.get.mockResolvedValue({
        cached_categories: {
          1: {
            categories: mockCategories,
            timestamp: expiredTimestamp,
          },
        },
      });

      const result = await getCachedCategories(1);

      expect(result).toBeNull();
    });

    it('should cache categories for specific project', async () => {
      const mockCategories: Category[] = [
        { id: 1, name: 'Category 1', project_id: 1 },
      ];

      mockBrowser.storage.local.get.mockResolvedValue({});

      await setCachedCategories(1, mockCategories);

      expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
        cached_categories: {
          1: {
            categories: mockCategories,
            timestamp: expect.any(Number),
          },
        },
      });
    });

    it('should preserve existing project categories when caching new ones', async () => {
      const existingCategories: Category[] = [
        { id: 1, name: 'Existing', project_id: 1 },
      ];
      const newCategories: Category[] = [
        { id: 2, name: 'New', project_id: 2 },
      ];

      mockBrowser.storage.local.get.mockResolvedValue({
        cached_categories: {
          1: {
            categories: existingCategories,
            timestamp: Date.now(),
          },
        },
      });

      await setCachedCategories(2, newCategories);

      expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
        cached_categories: {
          1: expect.objectContaining({
            categories: existingCategories,
          }),
          2: {
            categories: newCategories,
            timestamp: expect.any(Number),
          },
        },
      });
    });

    it('should fetch and cache categories when cache is empty', async () => {
      const mockCategories: Category[] = [
        { id: 1, name: 'Category 1', project_id: 1 },
      ];

      mockBrowser.storage.local.get.mockResolvedValue({});
      (getCategories as jest.MockedFunction<typeof getCategories>).mockResolvedValue(
        mockCategories
      );

      const result = await fetchAndCacheCategories(1);

      expect(result).toEqual(mockCategories);
      expect(getCategories).toHaveBeenCalledWith(1);
      expect(mockBrowser.storage.local.set).toHaveBeenCalled();
    });

    it('should clear categories for specific project', async () => {
      const mockCache = {
        cached_categories: {
          1: {
            categories: [{ id: 1, name: 'Cat 1', project_id: 1 }],
            timestamp: Date.now(),
          },
          2: {
            categories: [{ id: 2, name: 'Cat 2', project_id: 2 }],
            timestamp: Date.now(),
          },
        },
      };

      mockBrowser.storage.local.get.mockResolvedValue(mockCache);

      await clearCachedCategories(1);

      expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
        cached_categories: {
          2: expect.objectContaining({
            categories: [{ id: 2, name: 'Cat 2', project_id: 2 }],
          }),
        },
      });
    });

    it('should clear all categories when no projectId specified', async () => {
      await clearCachedCategories();

      expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith(
        'cached_categories'
      );
    });
  });

  describe('Default Project', () => {
    it('should return null when no default project is set', async () => {
      mockBrowser.storage.local.get.mockResolvedValue({});

      const result = await getDefaultProjectId();

      expect(result).toBeNull();
    });

    it('should return stored default project ID', async () => {
      mockBrowser.storage.local.get.mockResolvedValue({
        default_project_id: 42,
      });

      const result = await getDefaultProjectId();

      expect(result).toBe(42);
    });

    it('should set default project ID', async () => {
      await setDefaultProjectId(42);

      expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
        default_project_id: 42,
      });
    });
  });

  describe('Last Detected Paper', () => {
    it('should return null when no paper is stored', async () => {
      mockBrowser.storage.local.get.mockResolvedValue({});

      const result = await getLastDetectedPaper();

      expect(result).toBeNull();
    });

    it('should return stored paper metadata', async () => {
      const mockPaper: PaperMetadata = {
        title: 'Test Paper',
        authors: ['Author 1', 'Author 2'],
        year: '2024',
        doi: '10.1234/test',
        url: 'https://example.com',
        source: 'arxiv',
      };

      mockBrowser.storage.local.get.mockResolvedValue({
        last_detected_paper: mockPaper,
      });

      const result = await getLastDetectedPaper();

      expect(result).toEqual(mockPaper);
    });

    it('should set last detected paper', async () => {
      const mockPaper: PaperMetadata = {
        title: 'Test Paper',
        authors: ['Author 1'],
        year: '2024',
        source: 'generic',
      };

      await setLastDetectedPaper(mockPaper);

      expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
        last_detected_paper: mockPaper,
      });
    });

    it('should clear last detected paper', async () => {
      await clearLastDetectedPaper();

      expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith(
        'last_detected_paper'
      );
    });
  });

  describe('Cache Invalidation', () => {
    it('should clear all caches', async () => {
      await clearAllCaches();

      expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith([
        'cached_projects',
        'cached_categories',
        'last_detected_paper',
      ]);
    });
  });

  describe('Storage Usage', () => {
    it('should calculate storage usage', async () => {
      const mockData = {
        cached_projects: { projects: [], timestamp: Date.now() },
        cached_categories: {},
      };

      mockBrowser.storage.local.get.mockResolvedValue(mockData);

      const result = await getStorageUsage();

      expect(result.bytes).toBeGreaterThan(0);
      expect(result.quota).toBe(5242880); // 5MB
    });

    it('should return false when storage is not near quota', async () => {
      const mockData = {
        small_data: 'test',
      };

      mockBrowser.storage.local.get.mockResolvedValue(mockData);

      const result = await isStorageNearQuota(0.8);

      expect(result).toBe(false);
    });

    it('should return true when storage is near quota', async () => {
      // Create large mock data (> 80% of 5MB quota)
      const largeData = {
        large_data: 'x'.repeat(4500000), // ~4.5MB
      };

      mockBrowser.storage.local.get.mockResolvedValue(largeData);

      const result = await isStorageNearQuota(0.8);

      expect(result).toBe(true);
    });

    it('should use custom threshold for quota check', async () => {
      const mockData = {
        medium_data: 'x'.repeat(3000000), // ~3MB (~60% of 5MB)
      };

      mockBrowser.storage.local.get.mockResolvedValue(mockData);

      const result = await isStorageNearQuota(0.5);

      expect(result).toBe(true);
    });
  });

  describe('Rate Limit Info', () => {
    it('should return null when no rate limit info exists', async () => {
      mockBrowser.storage.local.get.mockResolvedValue({});

      const result = await getRateLimitInfo();

      expect(result).toBeNull();
    });

    it('should return stored rate limit info', async () => {
      const mockRateLimit: RateLimitInfo = {
        limit: 100,
        remaining: 50,
        reset: Date.now() + 60000,
      };

      mockBrowser.storage.local.get.mockResolvedValue({
        rate_limit_info: mockRateLimit,
      });

      const result = await getRateLimitInfo();

      expect(result).toEqual(mockRateLimit);
    });

    it('should set rate limit info', async () => {
      const mockRateLimit: RateLimitInfo = {
        limit: 100,
        remaining: 50,
        reset: Date.now() + 60000,
      };

      await setRateLimitInfo(mockRateLimit);

      expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
        rate_limit_info: mockRateLimit,
      });
    });
  });

  describe('Error Handling', () => {
    it('should return null on cache read error', async () => {
      mockBrowser.storage.local.get.mockRejectedValue(
        new Error('Storage error')
      );

      const result = await getCachedProjects();

      expect(result).toBeNull();
    });

    it('should throw error on cache write error', async () => {
      mockBrowser.storage.local.set.mockRejectedValue(
        new Error('Storage full')
      );

      const mockProjects: Project[] = [
        { id: 1, name: 'Project', description: 'Test' },
      ];

      await expect(setCachedProjects(mockProjects)).rejects.toThrow(
        'Storage full'
      );
    });

    it('should handle errors when clearing caches', async () => {
      mockBrowser.storage.local.remove.mockRejectedValue(
        new Error('Remove failed')
      );

      await expect(clearAllCaches()).rejects.toThrow('Remove failed');
    });

    it('should return default values on storage usage error', async () => {
      mockBrowser.storage.local.get.mockRejectedValue(
        new Error('Storage error')
      );

      const result = await getStorageUsage();

      expect(result).toEqual({ bytes: 0, quota: 0 });
    });
  });
});
