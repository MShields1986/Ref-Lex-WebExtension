// Main background service worker for Ref-Lex Extension

import { browser } from '../shared/browser';
import { logger } from '../shared/logger';
import { Message, MessageResponse, PaperMetadata } from '../shared/types';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../shared/constants';
import {
  isLoggedIn,
  logout,
  openLoginPage,
  startAuthCheck,
  updateCurrentUser,
  clearAuthState,
} from './auth';
import {
  checkAuthStatus,
  addReference,
  getBackendVersion,
} from './api';
import {
  fetchAndCacheProjects,
  fetchAndCacheCategories,
  getLastDetectedPaper,
  setLastDetectedPaper,
  getRateLimitInfo,
} from './storage';
import { getErrorMessage } from '../shared/utils';

logger.debug('Ref-Lex Extension background service worker initialized');

// ============================================================================
// Action Click Handler (Open Sidebar)
// ============================================================================

browser.action.onClicked.addListener(async (tab) => {
  logger.debug('Extension icon clicked, opening sidebar');

  if (tab.id) {
    try {
      // Detect browser type and use appropriate API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const browserAny = browser as any;

      // Chrome/Edge - sidePanel API
      if (browserAny.sidePanel && browserAny.sidePanel.open) {
        await browserAny.sidePanel.open({ tabId: tab.id });
        return;
      }

      // Firefox - sidebarAction API (different behavior)
      if (browserAny.sidebarAction) {
        if (browserAny.sidebarAction.open) {
          // Firefox 57+
          await browserAny.sidebarAction.open();
        } else if (browserAny.sidebarAction.toggle) {
          // Fallback to toggle
          await browserAny.sidebarAction.toggle();
        }
        return;
      }

      // Fallback: Open as popup window (last resort)
      logger.warn('No sidebar API available, opening as popup');
      await browser.windows.create({
        url: browser.runtime.getURL('popup.html'),
        type: 'popup',
        width: 400,
        height: 600,
      });
    } catch (error) {
      logger.error('Failed to open sidebar:', error);

      // Final fallback: open as popup window
      try {
        await browser.windows.create({
          url: browser.runtime.getURL('popup.html'),
          type: 'popup',
          width: 400,
          height: 600,
        });
      } catch (fallbackError) {
        logger.error('Failed to open fallback popup:', fallbackError);
      }
    }
  }
});

// ============================================================================
// Extension Installation/Update
// ============================================================================

browser.runtime.onInstalled.addListener(async (details) => {
  logger.debug('Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // First installation
    logger.debug('First installation - opening welcome page');
    // Could open options page or welcome page here
  } else if (details.reason === 'update') {
    // Extension updated
    logger.debug('Extension updated to version:', browser.runtime.getManifest().version);
  }

  // Check backend version compatibility
  try {
    const version = await getBackendVersion();
    logger.debug('Backend version:', version);
    // Could add version compatibility check here
  } catch (error) {
    logger.warn('Could not check backend version:', error);
  }
});

// ============================================================================
// Start Periodic Auth Check
// ============================================================================

startAuthCheck();

// ============================================================================
// Message Handling
// ============================================================================

browser.runtime.onMessage.addListener(
  (
    message: Message,
    _sender: browser.Runtime.MessageSender
  ): Promise<MessageResponse> => {
    logger.debug('Received message:', message.type, message.payload);

    // Handle messages asynchronously and return the promise
    return handleMessage(message, _sender)
      .then((response) => {
        logger.debug('Message handled successfully:', message.type);
        return response;
      })
      .catch((error) => {
        logger.error('Error handling message:', message.type, error);
        return {
          success: false,
          error: getErrorMessage(error),
        };
      });
  }
);

async function handleMessage(
  message: Message,
  _sender: browser.Runtime.MessageSender
): Promise<MessageResponse> {
  try {
    switch (message.type) {
      case 'CHECK_AUTH':
        return await handleCheckAuth();

      case 'LOGIN':
        return await handleLogin();

      case 'LOGOUT':
        return await handleLogout();

      case 'GET_PROJECTS':
        return await handleGetProjects(message.payload?.forceRefresh);

      case 'GET_CATEGORIES':
        return await handleGetCategories(message.payload?.projectId, message.payload?.forceRefresh);

      case 'ADD_REFERENCE':
        return await handleAddReference(message.payload);

      case 'DETECT_PAPER':
        return await handleDetectPaper();

      case 'OPEN_OPTIONS':
        return await handleOpenOptions();

      case 'PAPER_DETECTED':
        return await handlePaperDetected(message.payload);

      case 'GET_RATE_LIMIT':
        return await handleGetRateLimit();

      default:
        return {
          success: false,
          error: `Unknown message type: ${message.type}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

// ============================================================================
// Message Handlers
// ============================================================================

async function handleCheckAuth(): Promise<MessageResponse> {
  try {
    const authenticated = await isLoggedIn();

    if (authenticated) {
      // Try to get user info
      try {
        const user = await checkAuthStatus();
        await updateCurrentUser(user);

        return {
          success: true,
          data: {
            isAuthenticated: true,
            user,
          },
        };
      } catch (error) {
        // Cookie exists but API call failed - clear invalid session
        logger.warn('Auth cookie invalid, clearing session:', getErrorMessage(error));
        await clearAuthState();
        return {
          success: true,
          data: {
            isAuthenticated: false,
          },
        };
      }
    }

    return {
      success: true,
      data: {
        isAuthenticated: false,
      },
    };
  } catch (error) {
    throw new Error(`Auth check failed: ${getErrorMessage(error)}`);
  }
}

async function handleLogin(): Promise<MessageResponse> {
  try {
    await openLoginPage();
    return {
      success: true,
      data: { message: 'Login page opened' },
    };
  } catch (error) {
    throw new Error(`Login failed: ${getErrorMessage(error)}`);
  }
}

async function handleLogout(): Promise<MessageResponse> {
  try {
    await logout();
    return {
      success: true,
      data: { message: SUCCESS_MESSAGES.LOGOUT_SUCCESS },
    };
  } catch (error) {
    throw new Error(`Logout failed: ${getErrorMessage(error)}`);
  }
}

async function handleGetProjects(forceRefresh: boolean = false): Promise<MessageResponse> {
  try {
    const projects = await fetchAndCacheProjects(forceRefresh);
    return {
      success: true,
      data: projects,
    };
  } catch (error) {
    throw new Error(`Failed to get projects: ${getErrorMessage(error)}`);
  }
}

async function handleGetCategories(
  projectId: number,
  forceRefresh: boolean = false
): Promise<MessageResponse> {
  try {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    const categories = await fetchAndCacheCategories(projectId, forceRefresh);
    return {
      success: true,
      data: categories,
    };
  } catch (error) {
    throw new Error(`Failed to get categories: ${getErrorMessage(error)}`);
  }
}

async function handleAddReference(payload: {
  projectId: number;
  bibtex_raw: string;
  comment?: string;
  category?: string;
  rating?: number;
}): Promise<MessageResponse> {
  try {
    const { projectId, ...data } = payload;

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    if (!data.bibtex_raw) {
      throw new Error('BibTeX is required');
    }

    const result = await addReference(projectId, data);

    // Invalidate categories cache if a new category was created
    if (data.category) {
      await fetchAndCacheCategories(projectId, true);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    throw new Error(`Failed to add reference: ${getErrorMessage(error)}`);
  }
}

async function handleDetectPaper(): Promise<MessageResponse> {
  try {
    // Get the last detected paper from storage
    const paper = await getLastDetectedPaper();

    if (!paper) {
      return {
        success: false,
        error: ERROR_MESSAGES.NO_PAPER_DETECTED,
      };
    }

    return {
      success: true,
      data: paper,
    };
  } catch (error) {
    throw new Error(`Failed to detect paper: ${getErrorMessage(error)}`);
  }
}

async function handleOpenOptions(): Promise<MessageResponse> {
  try {
    await browser.runtime.openOptionsPage();
    return {
      success: true,
      data: { message: 'Options page opened' },
    };
  } catch (error) {
    throw new Error(`Failed to open options: ${getErrorMessage(error)}`);
  }
}

async function handlePaperDetected(paper: PaperMetadata): Promise<MessageResponse> {
  try {
    // Store the detected paper for popup to access
    await setLastDetectedPaper(paper);
    return {
      success: true,
      data: { message: 'Paper stored' },
    };
  } catch (error) {
    throw new Error(`Failed to store paper: ${getErrorMessage(error)}`);
  }
}

async function handleGetRateLimit(): Promise<MessageResponse> {
  try {
    const rateLimit = await getRateLimitInfo();
    return {
      success: true,
      data: rateLimit,
    };
  } catch (error) {
    throw new Error(`Failed to get rate limit info: ${getErrorMessage(error)}`);
  }
}

// ============================================================================
// Context Menu (Optional - for right-click functionality)
// ============================================================================

// Could add context menu items for quick actions
// browser.contextMenus.create({
//   id: 'add-to-reflex',
//   title: 'Add to Ref-Lex',
//   contexts: ['page', 'selection'],
// });

// ============================================================================
// Tab Updates (Optional - detect when user navigates to academic sites)
// ============================================================================

browser.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Could send message to content script to detect papers
    // Or update badge to show if paper is detected
  }
});

// ============================================================================
// Export for testing
// ============================================================================

export {
  handleCheckAuth,
  handleLogin,
  handleLogout,
  handleGetProjects,
  handleGetCategories,
  handleAddReference,
  handleDetectPaper,
};
