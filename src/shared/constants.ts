// Constants for Ref-Lex Extension

// ============================================================================
// API Configuration
// ============================================================================

export const DEFAULT_API_BASE_URL = 'https://ref-lex.site';

// Extension version
export const EXTENSION_VERSION = '1.0.0';
export const MIN_BACKEND_VERSION = '1.0.0';
export const API_VERSION = '1';

// ============================================================================
// API Endpoints
// ============================================================================

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/login',
  LOGOUT: '/api/logout',
  CSRF_TOKEN: '/api/csrf-token',
  ACCOUNT: '/api/account',

  // Version (to be added to backend)
  VERSION: '/api/version',

  // Projects
  PROJECTS: '/api/projects',
  PROJECT_DETAIL: (id: number) => `/api/projects/${id}`,
  PROJECT_COLLABORATORS: (id: number) => `/api/projects/${id}/collaborators`,

  // References
  PROJECT_REFERENCES: (id: number) => `/api/projects/${id}/references`,
  REFERENCE_DETAIL: (id: number) => `/api/references/${id}`,

  // Categories
  PROJECT_CATEGORIES: (id: number) => `/api/projects/${id}/categories`,
} as const;

// ============================================================================
// API Request Configuration
// ============================================================================

export const API_CONFIG = {
  REQUEST_TIMEOUT_MS: 30000, // 30 seconds
  CSRF_TIMEOUT_MS: 10000,    // 10 seconds (faster for auth)
  BIBTEX_TIMEOUT_MS: 15000,  // 15 seconds (external APIs)
} as const;

// ============================================================================
// Cache Configuration
// ============================================================================

export const CACHE_CONFIG = {
  // Cache timeout in milliseconds
  PROJECTS_CACHE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  CATEGORIES_CACHE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  AUTH_CHECK_INTERVAL: 60 * 1000, // 1 minute
} as const;

// ============================================================================
// Extension Settings
// ============================================================================

export const EXTENSION_SETTINGS = {
  POPUP_WIDTH: 400,
  POPUP_HEIGHT: 600,
  MAX_BIBTEX_SIZE: 1024 * 1024, // 1MB
  MAX_TEXT_LENGTH: 10000,
} as const;

// ============================================================================
// Paper Detection Sources
// ============================================================================

export const PAPER_SOURCES = {
  ARXIV: 'arxiv',
  SCHOLAR: 'scholar',
  PUBMED: 'pubmed',
  DOI: 'doi',
  IEEE: 'ieee',
  ACM: 'acm',
  SPRINGER: 'springer',
  SCIENCEDIRECT: 'sciencedirect',
  JSTOR: 'jstor',
  GENERIC: 'generic',
} as const;

// ============================================================================
// Supported Academic Sites
// ============================================================================

export const SUPPORTED_SITES = [
  {
    name: 'ArXiv',
    pattern: 'arxiv.org',
    detector: PAPER_SOURCES.ARXIV,
  },
  {
    name: 'Google Scholar',
    pattern: 'scholar.google.com',
    detector: PAPER_SOURCES.SCHOLAR,
  },
  {
    name: 'PubMed',
    pattern: 'pubmed.ncbi.nlm.nih.gov',
    detector: PAPER_SOURCES.PUBMED,
  },
  {
    name: 'IEEE Xplore',
    pattern: 'ieeexplore.ieee.org',
    detector: PAPER_SOURCES.IEEE,
  },
  {
    name: 'ACM Digital Library',
    pattern: 'dl.acm.org',
    detector: PAPER_SOURCES.ACM,
  },
  {
    name: 'SpringerLink',
    pattern: 'link.springer.com',
    detector: PAPER_SOURCES.SPRINGER,
  },
  {
    name: 'ScienceDirect',
    pattern: 'sciencedirect.com',
    detector: PAPER_SOURCES.SCIENCEDIRECT,
  },
  {
    name: 'JSTOR',
    pattern: 'jstor.org',
    detector: PAPER_SOURCES.JSTOR,
  },
] as const;

// ============================================================================
// HTTP Status Codes
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  // Authentication errors
  AUTH_REQUIRED: 'Please log in to use this feature',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before using the extension. Check your inbox for a verification email.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',

  // Network errors
  NETWORK_ERROR: 'Unable to connect to Ref-Lex. Please check your internet connection and ensure the backend server is running.',
  SERVER_ERROR: 'The Ref-Lex server encountered an error. Please try again in a few moments.',
  REQUEST_TIMEOUT: 'The request took too long to complete. Please check your connection and try again.',

  // Paper detection errors
  INVALID_BIBTEX: 'Could not generate valid BibTeX for this paper. Please try a different paper or add it manually.',
  NO_PAPER_DETECTED: 'No academic paper detected on this page. Navigate to a paper page on ArXiv, Google Scholar, PubMed, or other supported sites.',
  PAPER_METADATA_INCOMPLETE: 'Paper detected but some metadata is missing. The reference may be incomplete.',

  // Project/Reference errors
  PROJECT_NOT_SELECTED: 'Please select a project before adding this reference.',
  PROJECT_NOT_FOUND: 'The selected project could not be found. It may have been deleted.',
  REFERENCE_ALREADY_EXISTS: 'This reference already exists in the selected project.',
  REFERENCE_ADD_FAILED: 'Failed to add reference. Please check your project permissions and try again.',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'You are making requests too quickly. Please wait a moment and try again.',
  RATE_LIMIT_WARNING: 'You are approaching the rate limit. Please slow down to avoid being temporarily blocked.',

  // Version compatibility
  BACKEND_INCOMPATIBLE: 'Your Ref-Lex backend version is incompatible with this extension. Please update your backend to the latest version.',
  EXTENSION_OUTDATED: 'Your extension is outdated. Please update to the latest version.',

  // Storage errors
  STORAGE_ERROR: 'Failed to access local storage. Please check browser permissions.',
  CACHE_ERROR: 'Failed to cache data. Your preferences may not persist.',

  // General errors
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
} as const;

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  REFERENCE_ADDED: 'Reference added successfully',
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
} as const;

// ============================================================================
// External APIs
// ============================================================================

export const EXTERNAL_APIS = {
  CROSSREF_DOI: 'https://doi.org',
  ARXIV_BIBTEX: (arxivId: string) => `https://arxiv.org/bibtex/${arxivId}`,
} as const;

// ============================================================================
// Regular Expressions
// ============================================================================

export const REGEX_PATTERNS = {
  DOI: /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i,
  ARXIV_ID: /(\d{4}\.\d{4,5})(v\d+)?/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  CATEGORY: /^[a-zA-Z0-9 _\-.]+$/,
} as const;

// ============================================================================
// UI Theme Colors (Catppuccin Mocha)
// ============================================================================

export const THEME_COLORS = {
  base: '#1e1e2e',
  mantle: '#181825',
  crust: '#11111b',
  text: '#cdd6f4',
  subtext0: '#a6adc8',
  subtext1: '#bac2de',
  surface0: '#313244',
  surface1: '#45475a',
  surface2: '#585b70',
  overlay0: '#6c7086',
  overlay1: '#7f849c',
  overlay2: '#9399b2',
  blue: '#89b4fa',
  lavender: '#b4befe',
  sapphire: '#74c7ec',
  sky: '#89dceb',
  teal: '#94e2d5',
  green: '#a6e3a1',
  yellow: '#f9e2af',
  peach: '#fab387',
  maroon: '#eba0ac',
  red: '#f38ba8',
  mauve: '#cba6f7',
  pink: '#f5c2e7',
  flamingo: '#f2cdcd',
  rosewater: '#f5e0dc',
} as const;

// ============================================================================
// Local Storage Keys (for browser.storage.local)
// ============================================================================

export const STORAGE_KEYS = {
  AUTH_STATE: 'auth_state',
  CACHED_PROJECTS: 'cached_projects',
  CACHED_CATEGORIES: 'cached_categories',
  API_BASE_URL: 'api_base_url',
  DEFAULT_PROJECT_ID: 'default_project_id',
  LAST_DETECTED_PAPER: 'last_detected_paper',
  CSRF_TOKEN: 'csrf_token',
  LAST_AUTH_CHECK: 'last_auth_check',
  RATE_LIMIT_INFO: 'rate_limit_info',
} as const;
