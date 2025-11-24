// Authentication management for background service worker

import { browser } from '../shared/browser';
import { logger } from '../shared/logger';
import { DEFAULT_API_BASE_URL, STORAGE_KEYS } from '../shared/constants';
import { User, ExtensionState } from '../shared/types';

// ============================================================================
// Authentication State Management
// ============================================================================

export async function isLoggedIn(): Promise<boolean> {
  try {
    const apiBaseUrl = await getApiBaseUrl();

    // Extensions CAN read HttpOnly cookies with the 'cookies' permission
    // Check if the JWT cookie exists
    const cookies = await browser.cookies.getAll({
      url: apiBaseUrl,
      name: 'access_token_cookie'
    });

    return cookies.length > 0;
  } catch (error) {
    logger.error('Error checking login status:', error);
    return false;
  }
}

export async function getAuthState(): Promise<ExtensionState> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.AUTH_STATE);
    const authState = result[STORAGE_KEYS.AUTH_STATE] as ExtensionState | undefined;

    if (!authState) {
      return {
        isAuthenticated: false,
      };
    }

    return authState;
  } catch (error) {
    logger.error('Error getting auth state:', error);
    return {
      isAuthenticated: false,
    };
  }
}

export async function setAuthState(state: ExtensionState): Promise<void> {
  try {
    await browser.storage.local.set({
      [STORAGE_KEYS.AUTH_STATE]: state,
    });
  } catch (error) {
    logger.error('Error setting auth state:', error);
    throw error;
  }
}

export async function clearAuthState(): Promise<void> {
  try {
    const apiBaseUrl = await getApiBaseUrl();

    // Clear local storage
    await browser.storage.local.remove([
      STORAGE_KEYS.AUTH_STATE,
      STORAGE_KEYS.CACHED_PROJECTS,
      STORAGE_KEYS.CACHED_CATEGORIES,
      STORAGE_KEYS.CSRF_TOKEN,
    ]);

    // Also remove the invalid cookie
    await browser.cookies.remove({
      url: apiBaseUrl,
      name: 'access_token_cookie'
    });
  } catch (error) {
    logger.error('Error clearing auth state:', error);
    throw error;
  }
}

// ============================================================================
// Login/Logout
// ============================================================================

export async function openLoginPage(): Promise<void> {
  try {
    const apiBaseUrl = await getApiBaseUrl();
    const extensionUrl = browser.runtime.getURL('popup.html?login=success');

    // Open backend login page with redirect back to extension
    // Note: Backend needs to be modified to handle this redirect parameter
    const loginUrl = `${apiBaseUrl}/login?extension_redirect=${encodeURIComponent(extensionUrl)}`;

    await browser.tabs.create({
      url: loginUrl,
      active: true,
    });
  } catch (error) {
    logger.error('Error opening login page:', error);
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    const apiBaseUrl = await getApiBaseUrl();

    // Call backend logout endpoint
    // The backend will clear the HttpOnly cookie
    await fetch(`${apiBaseUrl}/api/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    // Clear local storage
    await clearAuthState();
  } catch (error) {
    logger.error('Error during logout:', error);
    // Clear local state even if API call fails
    await clearAuthState();
    throw error;
  }
}

// ============================================================================
// User Info
// ============================================================================

export async function getCurrentUser(): Promise<User | null> {
  try {
    // First check if we have cached user info
    const authState = await getAuthState();
    if (authState.currentUser) {
      return authState.currentUser;
    }

    // If not, we'd need to fetch from API
    // This will be handled by the API client
    return null;
  } catch (error) {
    logger.error('Error getting current user:', error);
    return null;
  }
}

export async function updateCurrentUser(user: User): Promise<void> {
  try {
    const authState = await getAuthState();
    authState.currentUser = user;
    authState.isAuthenticated = true;
    await setAuthState(authState);
  } catch (error) {
    logger.error('Error updating current user:', error);
    throw error;
  }
}

// ============================================================================
// API Base URL Management
// ============================================================================

export async function getApiBaseUrl(): Promise<string> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.API_BASE_URL);
    return result[STORAGE_KEYS.API_BASE_URL] || DEFAULT_API_BASE_URL;
  } catch (error) {
    logger.error('Error getting API base URL:', error);
    return DEFAULT_API_BASE_URL;
  }
}

export async function setApiBaseUrl(url: string): Promise<void> {
  try {
    await browser.storage.local.set({
      [STORAGE_KEYS.API_BASE_URL]: url,
    });
  } catch (error) {
    logger.error('Error setting API base URL:', error);
    throw error;
  }
}

// ============================================================================
// Periodic Auth Check
// ============================================================================

let authCheckInterval: NodeJS.Timeout | null = null;

export function startAuthCheck(intervalMs: number = 60000): void {
  if (authCheckInterval) {
    clearInterval(authCheckInterval);
  }

  authCheckInterval = setInterval(async () => {
    try {
      const isAuthenticated = await isLoggedIn();
      const authState = await getAuthState();

      if (isAuthenticated !== authState.isAuthenticated) {
        authState.isAuthenticated = isAuthenticated;
        if (!isAuthenticated) {
          // User logged out elsewhere, clear state
          await clearAuthState();
        }
        await setAuthState(authState);
      }
    } catch (error) {
      logger.error('Error in auth check:', error);
    }
  }, intervalMs);
}

export function stopAuthCheck(): void {
  if (authCheckInterval) {
    clearInterval(authCheckInterval);
    authCheckInterval = null;
  }
}
