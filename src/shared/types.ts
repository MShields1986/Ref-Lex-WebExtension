// Shared TypeScript types and interfaces for Ref-Lex Extension

// ============================================================================
// API Response Types (matching backend)
// ============================================================================

export interface User {
  id: number;
  username: string;
  email: string;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  last_active?: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  created_at: string;
  is_owner?: boolean;
  owner?: {
    username: string;
    email: string;
  };
}

export interface Category {
  id: number;
  project_id: number;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Reference {
  id: number;
  project_id: number;
  bibtex_key: string;
  entry_type: string;
  title: string;
  author?: string;
  year?: string;
  journal?: string;
  booktitle?: string;
  publisher?: string;
  volume?: string;
  number?: string;
  pages?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  bibtex_raw: string;
  comment?: string;
  rating?: number;
  methods?: string;
  focus?: string;
  key_findings?: string;
  category?: string;
  category_id?: number;
  display_order: number;
  added_by?: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// API Request Types
// ============================================================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AddReferenceRequest {
  bibtex_raw: string;
  comment?: string;
  category?: string;
  rating?: number;
  methods?: string;
  focus?: string;
  key_findings?: string;
}

export interface UpdateReferenceRequest {
  bibtex_raw?: string;
  comment?: string;
  category?: string;
  rating?: number;
  methods?: string;
  focus?: string;
  key_findings?: string;
}

// ============================================================================
// Paper Detection Types
// ============================================================================

export interface PaperMetadata {
  title?: string;
  authors?: string[];
  year?: string;
  doi?: string;
  url: string;
  abstract?: string;
  journal?: string;
  volume?: string;
  pages?: string;
  bibtexRaw?: string; // Full BibTeX if available
  source: string; // 'arxiv', 'scholar', 'pubmed', 'doi', 'generic', etc.
}

export type Detector = () => Promise<PaperMetadata | null>;

// ============================================================================
// Extension State Types
// ============================================================================

export interface ExtensionState {
  isAuthenticated: boolean;
  currentUser?: User;
  selectedProjectId?: number;
  lastSync?: number;
}

export interface CachedProjects {
  projects: Project[];
  timestamp: number;
}

export interface CachedCategories {
  [projectId: number]: {
    categories: Category[];
    timestamp: number;
  };
}

// ============================================================================
// Message Types (for communication between extension components)
// ============================================================================

export type MessageType =
  | 'CHECK_AUTH'
  | 'LOGIN'
  | 'LOGOUT'
  | 'GET_PROJECTS'
  | 'GET_CATEGORIES'
  | 'ADD_REFERENCE'
  | 'DETECT_PAPER'
  | 'OPEN_OPTIONS'
  | 'PAPER_DETECTED'
  | 'GET_RATE_LIMIT';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Message<T = any> {
  type: MessageType;
  payload?: T;
}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  AUTH_STATE: 'auth_state',
  CACHED_PROJECTS: 'cached_projects',
  CACHED_CATEGORIES: 'cached_categories',
  API_BASE_URL: 'api_base_url',
  DEFAULT_PROJECT_ID: 'default_project_id',
  LAST_DETECTED_PAPER: 'last_detected_paper',
} as const;

// ============================================================================
// Configuration
// ============================================================================

export interface ExtensionConfig {
  apiBaseUrl: string;
  cacheTimeout: number; // milliseconds
  defaultProjectId?: number;
}

// ============================================================================
// Error Types
// ============================================================================

export class ExtensionError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ExtensionError';
  }
}

export class AuthenticationError extends ExtensionError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class NetworkError extends ExtensionError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class ValidationError extends ExtensionError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// Rate Limit Info
// ============================================================================

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // timestamp
}

// ============================================================================
// API Response Wrappers
// ============================================================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface AddReferenceResponse {
  success: boolean;
  added: Reference[];
  errors: Array<{
    entry: string;
    error: string;
  }>;
  message?: string;
}
