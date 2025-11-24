// Storage and caching utilities for background service worker

import { browser } from '../shared/browser';
import { logger } from '../shared/logger';
import { STORAGE_KEYS, CACHE_CONFIG } from '../shared/constants';
import {
  Project,
  Category,
  CachedProjects,
  CachedCategories,
  PaperMetadata,
  RateLimitInfo,
} from '../shared/types';
import { isExpired } from '../shared/utils';
import { getProjects, getCategories } from './api';

// ============================================================================
// Projects Caching
// ============================================================================

export async function getCachedProjects(): Promise<Project[] | null> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.CACHED_PROJECTS);
    const cached = result[STORAGE_KEYS.CACHED_PROJECTS] as CachedProjects | undefined;

    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (isExpired(cached.timestamp, CACHE_CONFIG.PROJECTS_CACHE_TIMEOUT)) {
      return null;
    }

    return cached.projects;
  } catch (error) {
    logger.error('Error getting cached projects:', error);
    return null;
  }
}

export async function setCachedProjects(projects: Project[]): Promise<void> {
  try {
    const cached: CachedProjects = {
      projects,
      timestamp: Date.now(),
    };

    await browser.storage.local.set({
      [STORAGE_KEYS.CACHED_PROJECTS]: cached,
    });
  } catch (error) {
    logger.error('Error setting cached projects:', error);
    throw error;
  }
}

export async function fetchAndCacheProjects(forceRefresh: boolean = false): Promise<Project[]> {
  // Try to get from cache first
  if (!forceRefresh) {
    const cached = await getCachedProjects();
    if (cached) {
      return cached;
    }
  }

  // Fetch from API
  const projects = await getProjects();

  // Cache the result
  await setCachedProjects(projects);

  return projects;
}

// ============================================================================
// Categories Caching
// ============================================================================

export async function getCachedCategories(projectId: number): Promise<Category[] | null> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.CACHED_CATEGORIES);
    const allCached = result[STORAGE_KEYS.CACHED_CATEGORIES] as CachedCategories | undefined;

    if (!allCached || !allCached[projectId]) {
      return null;
    }

    const cached = allCached[projectId];

    // Check if cache is expired
    if (isExpired(cached.timestamp, CACHE_CONFIG.CATEGORIES_CACHE_TIMEOUT)) {
      return null;
    }

    return cached.categories;
  } catch (error) {
    logger.error('Error getting cached categories:', error);
    return null;
  }
}

export async function setCachedCategories(projectId: number, categories: Category[]): Promise<void> {
  try {
    // Get existing cache
    const result = await browser.storage.local.get(STORAGE_KEYS.CACHED_CATEGORIES);
    const allCached = (result[STORAGE_KEYS.CACHED_CATEGORIES] as CachedCategories) || {};

    // Update cache for this project
    allCached[projectId] = {
      categories,
      timestamp: Date.now(),
    };

    await browser.storage.local.set({
      [STORAGE_KEYS.CACHED_CATEGORIES]: allCached,
    });
  } catch (error) {
    logger.error('Error setting cached categories:', error);
    throw error;
  }
}

export async function fetchAndCacheCategories(
  projectId: number,
  forceRefresh: boolean = false
): Promise<Category[]> {
  // Try to get from cache first
  if (!forceRefresh) {
    const cached = await getCachedCategories(projectId);
    if (cached) {
      return cached;
    }
  }

  // Fetch from API
  const categories = await getCategories(projectId);

  // Cache the result
  await setCachedCategories(projectId, categories);

  return categories;
}

export async function clearCachedCategories(projectId?: number): Promise<void> {
  try {
    if (projectId) {
      // Clear specific project's categories
      const result = await browser.storage.local.get(STORAGE_KEYS.CACHED_CATEGORIES);
      const allCached = (result[STORAGE_KEYS.CACHED_CATEGORIES] as CachedCategories) || {};

      delete allCached[projectId];

      await browser.storage.local.set({
        [STORAGE_KEYS.CACHED_CATEGORIES]: allCached,
      });
    } else {
      // Clear all categories
      await browser.storage.local.remove(STORAGE_KEYS.CACHED_CATEGORIES);
    }
  } catch (error) {
    logger.error('Error clearing cached categories:', error);
    throw error;
  }
}

// ============================================================================
// Default Project
// ============================================================================

export async function getDefaultProjectId(): Promise<number | null> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.DEFAULT_PROJECT_ID);
    return result[STORAGE_KEYS.DEFAULT_PROJECT_ID] || null;
  } catch (error) {
    logger.error('Error getting default project ID:', error);
    return null;
  }
}

export async function setDefaultProjectId(projectId: number): Promise<void> {
  try {
    await browser.storage.local.set({
      [STORAGE_KEYS.DEFAULT_PROJECT_ID]: projectId,
    });
  } catch (error) {
    logger.error('Error setting default project ID:', error);
    throw error;
  }
}

// ============================================================================
// Last Detected Paper
// ============================================================================

export async function getLastDetectedPaper(): Promise<PaperMetadata | null> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.LAST_DETECTED_PAPER);
    return result[STORAGE_KEYS.LAST_DETECTED_PAPER] || null;
  } catch (error) {
    logger.error('Error getting last detected paper:', error);
    return null;
  }
}

export async function setLastDetectedPaper(paper: PaperMetadata): Promise<void> {
  try {
    await browser.storage.local.set({
      [STORAGE_KEYS.LAST_DETECTED_PAPER]: paper,
    });
  } catch (error) {
    logger.error('Error setting last detected paper:', error);
    throw error;
  }
}

export async function clearLastDetectedPaper(): Promise<void> {
  try {
    await browser.storage.local.remove(STORAGE_KEYS.LAST_DETECTED_PAPER);
  } catch (error) {
    logger.error('Error clearing last detected paper:', error);
    throw error;
  }
}

// ============================================================================
// Cache Invalidation
// ============================================================================

export async function clearAllCaches(): Promise<void> {
  try {
    await browser.storage.local.remove([
      STORAGE_KEYS.CACHED_PROJECTS,
      STORAGE_KEYS.CACHED_CATEGORIES,
      STORAGE_KEYS.LAST_DETECTED_PAPER,
    ]);
  } catch (error) {
    logger.error('Error clearing all caches:', error);
    throw error;
  }
}

// ============================================================================
// Storage Size Management
// ============================================================================

export async function getStorageUsage(): Promise<{ bytes: number; quota: number }> {
  try {
    // Get all stored data
    const data = await browser.storage.local.get(null);
    const bytes = new Blob([JSON.stringify(data)]).size;

    // Get quota (5MB for local storage typically)
    const quota = browser.storage.local.QUOTA_BYTES || 5242880; // 5MB default

    return { bytes, quota };
  } catch (error) {
    logger.error('Error getting storage usage:', error);
    return { bytes: 0, quota: 0 };
  }
}

export async function isStorageNearQuota(threshold: number = 0.8): Promise<boolean> {
  try {
    const { bytes, quota } = await getStorageUsage();
    return bytes / quota > threshold;
  } catch (error) {
    logger.error('Error checking storage quota:', error);
    return false;
  }
}

// ============================================================================
// Rate Limit Info
// ============================================================================

export async function getRateLimitInfo(): Promise<RateLimitInfo | null> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.RATE_LIMIT_INFO);
    return result[STORAGE_KEYS.RATE_LIMIT_INFO] || null;
  } catch (error) {
    logger.error('Error getting rate limit info:', error);
    return null;
  }
}

export async function setRateLimitInfo(rateLimitInfo: RateLimitInfo): Promise<void> {
  try {
    await browser.storage.local.set({
      [STORAGE_KEYS.RATE_LIMIT_INFO]: rateLimitInfo,
    });
  } catch (error) {
    logger.error('Error setting rate limit info:', error);
    throw error;
  }
}
