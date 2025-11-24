// API client with CSRF protection for Ref-Lex backend

import { getApiBaseUrl } from './auth';
import { logger } from '../shared/logger';
import { browser } from '../shared/browser';
import {
  API_ENDPOINTS,
  API_CONFIG,
  HTTP_STATUS,
  ERROR_MESSAGES,
  STORAGE_KEYS,
} from '../shared/constants';
import {
  Project,
  Category,
  Reference,
  AddReferenceRequest,
  AddReferenceResponse,
  User,
  AuthenticationError,
  NetworkError,
  ValidationError,
  ExtensionError,
} from '../shared/types';
import { parseRateLimitHeaders, fetchWithTimeout } from '../shared/utils';
import { globalDeduplicator } from '../shared/request-deduplicator';
import { globalRateLimiter } from '../shared/rate-limiter';

// ============================================================================
// CSRF Token Management
// ============================================================================

let csrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  // Check if we have a cached token
  if (csrfToken) {
    return csrfToken;
  }

  // Try to get from storage
  const result = await browser.storage.local.get(STORAGE_KEYS.CSRF_TOKEN);
  const stored = result[STORAGE_KEYS.CSRF_TOKEN] as string | undefined;
  if (stored) {
    csrfToken = stored;
    return csrfToken;
  }

  // Fetch new token
  return await fetchCsrfToken();
}

async function fetchCsrfToken(): Promise<string> {
  const apiBaseUrl = await getApiBaseUrl();

  try {
    const response = await fetchWithTimeout(
      `${apiBaseUrl}${API_ENDPOINTS.CSRF_TOKEN}`,
      {
        method: 'GET',
        credentials: 'include',
      },
      API_CONFIG.CSRF_TIMEOUT_MS
    );

    if (!response.ok) {
      throw new AuthenticationError('Failed to get CSRF token');
    }

    const token = response.headers.get('X-CSRF-Token');
    if (!token) {
      throw new AuthenticationError('CSRF token not found in response');
    }

    csrfToken = token;

    // Cache the token
    await browser.storage.local.set({
      [STORAGE_KEYS.CSRF_TOKEN]: token || '',
    });

    return token;
  } catch (error) {
    logger.error('Error fetching CSRF token:', error);
    throw error;
  }
}

async function clearCsrfToken(): Promise<void> {
  csrfToken = null;
  await browser.storage.local.remove(STORAGE_KEYS.CSRF_TOKEN);
}

// ============================================================================
// Base API Request
// ============================================================================

interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
  retryOn401?: boolean;
}

async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    skipAuth = false,
    retryOn401 = true,
    ...fetchOptions
  } = options;

  const apiBaseUrl = await getApiBaseUrl();
  const url = `${apiBaseUrl}${endpoint}`;

  // Set up headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Get JWT cookie and add it to headers manually
  // Extension service workers can't use credentials: 'include' properly,
  // so we need to manually get the cookie and send it
  if (!skipAuth) {
    try {
      const cookies = await browser.cookies.getAll({
        url: apiBaseUrl,
        name: 'access_token_cookie'
      });

      if (cookies.length > 0) {
        headers['Cookie'] = `access_token_cookie=${cookies[0].value}`;
      }
    } catch (error) {
      logger.warn('Failed to get auth cookie:', error);
    }
  }

  // Add CSRF token for non-GET requests
  if (!skipAuth && fetchOptions.method && fetchOptions.method !== 'GET') {
    try {
      const token = await getCsrfToken();
      headers['X-CSRF-Token'] = token;
    } catch (error) {
      logger.warn('Failed to get CSRF token, continuing without it:', error);
    }
  }

  try {
    const response = await fetchWithTimeout(
      url,
      {
        ...fetchOptions,
        headers,
        credentials: 'include',
      },
      API_CONFIG.REQUEST_TIMEOUT_MS
    );

    // Parse rate limit info
    const rateLimit = parseRateLimitHeaders(response.headers);
    if (rateLimit) {
      logger.debug('Rate limit info:', rateLimit);

      // Update global rate limiter with server info
      globalRateLimiter.updateFromHeaders(
        rateLimit.limit,
        rateLimit.remaining,
        rateLimit.reset
      );

      // Store rate limit info for UI to display
      try {
        const { setRateLimitInfo } = await import('./storage');
        await setRateLimitInfo(rateLimit);
      } catch (error) {
        logger.warn('Failed to store rate limit info:', error);
      }
    }

    // Handle 401 - try refreshing CSRF token once
    if (response.status === HTTP_STATUS.UNAUTHORIZED && retryOn401) {
      await clearCsrfToken();
      return apiRequest<T>(endpoint, { ...options, retryOn401: false });
    }

    // Handle other error statuses
    if (!response.ok) {
      await handleErrorResponse(response);
    }

    // Parse JSON response
    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof ExtensionError) {
      throw error;
    }

    // Check for timeout
    if (error instanceof Error && error.message.includes('timed out')) {
      throw new NetworkError(ERROR_MESSAGES.REQUEST_TIMEOUT);
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError(ERROR_MESSAGES.NETWORK_ERROR);
    }

    throw new ExtensionError(
      ERROR_MESSAGES.SERVER_ERROR,
      'UNKNOWN_ERROR'
    );
  }
}

async function handleErrorResponse(response: Response): Promise<never> {
  let errorMessage = '';

  try {
    const errorData = await response.json();
    errorMessage = errorData.error || errorData.message || response.statusText;
  } catch {
    errorMessage = response.statusText;
  }

  switch (response.status) {
    case HTTP_STATUS.UNAUTHORIZED:
      throw new AuthenticationError(errorMessage || ERROR_MESSAGES.AUTH_REQUIRED);

    case HTTP_STATUS.FORBIDDEN:
      if (errorMessage.includes('email')) {
        throw new AuthenticationError(ERROR_MESSAGES.EMAIL_NOT_VERIFIED);
      }
      throw new AuthenticationError(errorMessage);

    case HTTP_STATUS.BAD_REQUEST:
      throw new ValidationError(errorMessage);

    case HTTP_STATUS.TOO_MANY_REQUESTS:
      throw new ExtensionError(
        ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
        'RATE_LIMIT',
        HTTP_STATUS.TOO_MANY_REQUESTS
      );

    default:
      throw new ExtensionError(
        errorMessage || ERROR_MESSAGES.SERVER_ERROR,
        'API_ERROR',
        response.status
      );
  }
}

// ============================================================================
// Authentication Endpoints
// ============================================================================

export async function checkAuthStatus(): Promise<User> {
  return globalDeduplicator.dedupe(
    'auth:check',
    () => apiRequest<User>(API_ENDPOINTS.ACCOUNT, {
      method: 'GET',
    })
  );
}

// ============================================================================
// Project Endpoints
// ============================================================================

export async function getProjects(): Promise<Project[]> {
  return globalDeduplicator.dedupe(
    'projects:list',
    () => apiRequest<Project[]>(API_ENDPOINTS.PROJECTS, {
      method: 'GET',
    })
  );
}

export async function getProject(id: number): Promise<Project> {
  return globalDeduplicator.dedupe(
    `project:${id}`,
    () => apiRequest<Project>(API_ENDPOINTS.PROJECT_DETAIL(id), {
      method: 'GET',
    })
  );
}

export async function createProject(name: string, description?: string): Promise<Project> {
  return apiRequest<Project>(API_ENDPOINTS.PROJECTS, {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
}

// ============================================================================
// Category Endpoints
// ============================================================================

export async function getCategories(projectId: number): Promise<Category[]> {
  return globalDeduplicator.dedupe(
    `categories:${projectId}`,
    () => apiRequest<Category[]>(API_ENDPOINTS.PROJECT_CATEGORIES(projectId), {
      method: 'GET',
    })
  );
}

// ============================================================================
// Reference Endpoints
// ============================================================================

export async function getReferences(projectId: number): Promise<Reference[]> {
  return globalDeduplicator.dedupe(
    `references:${projectId}`,
    () => apiRequest<Reference[]>(API_ENDPOINTS.PROJECT_REFERENCES(projectId), {
      method: 'GET',
    })
  );
}

export async function addReference(
  projectId: number,
  data: AddReferenceRequest
): Promise<AddReferenceResponse> {
  return apiRequest<AddReferenceResponse>(
    API_ENDPOINTS.PROJECT_REFERENCES(projectId),
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function updateReference(
  referenceId: number,
  data: Partial<Reference>
): Promise<Reference> {
  return apiRequest<Reference>(API_ENDPOINTS.REFERENCE_DETAIL(referenceId), {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteReference(referenceId: number): Promise<void> {
  await apiRequest(API_ENDPOINTS.REFERENCE_DETAIL(referenceId), {
    method: 'DELETE',
  });
}

// ============================================================================
// Version Check
// ============================================================================

export interface BackendVersion {
  version: string;
  apiVersion: string;
  minExtensionVersion: string;
  commit?: string;
}

export async function getBackendVersion(): Promise<BackendVersion> {
  try {
    return await apiRequest<BackendVersion>(API_ENDPOINTS.VERSION, {
      method: 'GET',
      skipAuth: true,
    });
  } catch (error) {
    logger.error('Failed to fetch backend version:', error);
    // If the endpoint doesn't exist yet, return default
    return {
      version: '1.0.0',
      apiVersion: '1',
      minExtensionVersion: '1.0.0',
    };
  }
}

// ============================================================================
// External BibTeX Fetchers
// ============================================================================

export async function fetchBibtexFromDoi(doi: string): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(
      `https://doi.org/${doi}`,
      {
        headers: {
          'Accept': 'application/x-bibtex',
        },
      },
      API_CONFIG.BIBTEX_TIMEOUT_MS
    );

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch (error) {
    logger.error('Error fetching BibTeX from DOI:', error);
    return null;
  }
}

export async function fetchBibtexFromArxiv(arxivId: string): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(
      `https://arxiv.org/bibtex/${arxivId}`,
      {},
      API_CONFIG.BIBTEX_TIMEOUT_MS
    );

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch (error) {
    logger.error('Error fetching BibTeX from ArXiv:', error);
    return null;
  }
}
