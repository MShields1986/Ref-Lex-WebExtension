import { jest } from '@jest/globals';

// Mock browser API BEFORE any imports
const mockBrowser = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    onInstalled: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn(),
    getURL: jest.fn((path: string) => `chrome-extension://test/${path}`),
  },
  action: {
    onClicked: {
      addListener: jest.fn(),
    },
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
  },
  sidePanel: {
    open: jest.fn(),
  },
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
  windows: {
    create: jest.fn(),
  },
  tabs: {
    create: jest.fn(),
    onUpdated: {
      addListener: jest.fn(),
    },
  },
};

// Mock auth functions
const mockIsLoggedIn = jest.fn();
const mockCheckAuthStatus = jest.fn();
const mockLogout = jest.fn();
const mockOpenLoginPage = jest.fn();
const mockStartAuthCheck = jest.fn();
const mockUpdateCurrentUser = jest.fn();
const mockClearAuthState = jest.fn();

// Mock API functions
const mockGetProjects = jest.fn();
const mockGetCategories = jest.fn();
const mockAddReference = jest.fn();
const mockApiCheckAuthStatus = jest.fn();

// Mock storage functions
const mockGetCachedProjects = jest.fn();
const mockSetCachedProjects = jest.fn();
const mockGetCachedCategories = jest.fn();
const mockSetCachedCategories = jest.fn();
const mockGetLastDetectedPaper = jest.fn();
const mockSetLastDetectedPaper = jest.fn();
const mockFetchAndCacheProjects = jest.fn();
const mockFetchAndCacheCategories = jest.fn();
const mockGetRateLimitInfo = jest.fn();

// Mock modules
jest.mock('../../src/shared/browser', () => ({
  browser: mockBrowser,
}));

jest.mock('../../src/background/auth', () => ({
  isLoggedIn: mockIsLoggedIn,
  checkAuthStatus: mockCheckAuthStatus,
  logout: mockLogout,
  openLoginPage: mockOpenLoginPage,
  startAuthCheck: mockStartAuthCheck,
  updateCurrentUser: mockUpdateCurrentUser,
  clearAuthState: mockClearAuthState,
}));

jest.mock('../../src/background/api', () => ({
  getProjects: mockGetProjects,
  getCategories: mockGetCategories,
  addReference: mockAddReference,
  checkAuthStatus: mockApiCheckAuthStatus,
}));

jest.mock('../../src/background/storage', () => ({
  getCachedProjects: mockGetCachedProjects,
  setCachedProjects: mockSetCachedProjects,
  getCachedCategories: mockGetCachedCategories,
  setCachedCategories: mockSetCachedCategories,
  getLastDetectedPaper: mockGetLastDetectedPaper,
  setLastDetectedPaper: mockSetLastDetectedPaper,
  fetchAndCacheProjects: mockFetchAndCacheProjects,
  fetchAndCacheCategories: mockFetchAndCacheCategories,
  getRateLimitInfo: mockGetRateLimitInfo,
}));

// Capture handlers when they're registered
let messageHandler: any;
let actionClickHandler: any;

mockBrowser.runtime.onMessage.addListener.mockImplementation((handler: any) => {
  messageHandler = handler;
});

mockBrowser.action.onClicked.addListener.mockImplementation((handler: any) => {
  actionClickHandler = handler;
});

// Import service worker AFTER mocks are set up
// This will trigger the side effects (registering listeners) with mocked browser API
import '../../src/background/service-worker';

describe('Service Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Message Handling', () => {
    it('should handle CHECK_AUTH message', async () => {
      mockIsLoggedIn.mockResolvedValue(true);
      mockCheckAuthStatus.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        isEmailVerified: true,
      });

      // Import service worker to register handlers

      const response = await messageHandler(
        { type: 'CHECK_AUTH' },
        {},
        jest.fn()
      );

      expect(response.success).toBe(true);
      expect(response.data.isAuthenticated).toBe(true);
      expect(mockUpdateCurrentUser).toHaveBeenCalled();
    });

    it('should handle CHECK_AUTH with no auth', async () => {
      mockIsLoggedIn.mockResolvedValue(false);


      const response = await messageHandler(
        { type: 'CHECK_AUTH' },
        {},
        jest.fn()
      );

      expect(response.success).toBe(true);
      expect(response.data.isAuthenticated).toBe(false);
    });

    it('should handle LOGOUT message', async () => {
      mockLogout.mockResolvedValue(undefined);


      const response = await messageHandler({ type: 'LOGOUT' }, {}, jest.fn());

      expect(response.success).toBe(true);
      expect(mockLogout).toHaveBeenCalled();
    });

    it('should handle GET_PROJECTS message', async () => {
      const mockProjects = [
        { id: 1, name: 'Project 1', description: 'Test' },
      ];

      mockFetchAndCacheProjects.mockResolvedValue(mockProjects);


      const response = await messageHandler(
        { type: 'GET_PROJECTS' },
        {},
        jest.fn()
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockProjects);
    });

    it('should return cached projects when available', async () => {
      const mockProjects = [
        { id: 1, name: 'Cached Project', description: 'Test' },
      ];

      mockFetchAndCacheProjects.mockResolvedValue(mockProjects);


      const response = await messageHandler(
        { type: 'GET_PROJECTS' },
        {},
        jest.fn()
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockProjects);
    });

    it('should handle ADD_REFERENCE message', async () => {
      const mockResponse = { id: 1, reference_id: 123 };
      mockAddReference.mockResolvedValue(mockResponse);
      mockFetchAndCacheCategories.mockResolvedValue([]);


      const payload = {
        projectId: 1,
        bibtex_raw: '@article{test, title={Test}}',
        category: 'Test Category',
        comment: 'Test notes',
        rating: 5,
      };

      const response = await messageHandler(
        { type: 'ADD_REFERENCE', payload },
        {},
        jest.fn()
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResponse);
      expect(mockAddReference).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should handle PAPER_DETECTED message', async () => {
      const paperData = {
        title: 'Test Paper',
        authors: ['Author 1'],
        year: '2023',
      };

      const response = await messageHandler(
        { type: 'PAPER_DETECTED', payload: paperData },
        {},
        jest.fn()
      );

      expect(response.success).toBe(true);
      expect(mockSetLastDetectedPaper).toHaveBeenCalledWith(paperData);
    });

    it.skip('should handle UPDATE_BADGE message', async () => {
      // TODO: Implement UPDATE_BADGE handler in service-worker
      const response = await messageHandler(
        { type: 'UPDATE_BADGE', payload: { text: '1', color: '#ff0000' } },
        {},
        jest.fn()
      );

      expect(response.success).toBe(true);
      expect(mockBrowser.action.setBadgeText).toHaveBeenCalledWith({ text: '1' });
      expect(mockBrowser.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        color: '#ff0000',
      });
    });

    it('should handle unknown message type', async () => {

      const response = await messageHandler(
        { type: 'UNKNOWN_TYPE' },
        {},
        jest.fn()
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should handle errors in message processing', async () => {
      mockFetchAndCacheProjects.mockRejectedValue(new Error('API Error'));


      const response = await messageHandler(
        { type: 'GET_PROJECTS' },
        {},
        jest.fn()
      );

      expect(response.success).toBe(false);
      expect(response.error).toContain('API Error');
    });
  });

  describe('Action Click Handler', () => {
    it('should open side panel on Chrome', async () => {

      await actionClickHandler({ id: 1 });

      expect(mockBrowser.sidePanel.open).toHaveBeenCalledWith({ tabId: 1 });
    });

    it('should fallback to popup window on error', async () => {
      mockBrowser.sidePanel.open.mockRejectedValue(new Error('Not supported'));


      await actionClickHandler({ id: 1 });

      expect(mockBrowser.windows.create).toHaveBeenCalledWith({
        url: 'chrome-extension://test/popup.html',
        type: 'popup',
        width: 400,
        height: 600,
      });
    });
  });
});
