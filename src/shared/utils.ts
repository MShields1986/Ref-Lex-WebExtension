// Utility functions for Ref-Lex Extension

import { REGEX_PATTERNS, EXTENSION_SETTINGS } from './constants';
import { RateLimitInfo } from './types';

// ============================================================================
// Version Comparison
// ============================================================================

export function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aNum = aParts[i] || 0;
    const bNum = bParts[i] || 0;
    if (aNum > bNum) return 1;
    if (aNum < bNum) return -1;
  }

  return 0;
}

// ============================================================================
// Validation Functions
// ============================================================================

export function validateBibtex(bibtex: string): boolean {
  if (!bibtex || bibtex.length === 0) return false;
  if (bibtex.length > EXTENSION_SETTINGS.MAX_BIBTEX_SIZE) return false;
  if (!bibtex.trim().startsWith('@')) return false;
  return true;
}

export function validateEmail(email: string): boolean {
  return REGEX_PATTERNS.EMAIL.test(email);
}

export function validateCategoryName(name: string): boolean {
  if (!name || name.length === 0) return false;
  if (name.length > 255) return false;
  return REGEX_PATTERNS.CATEGORY.test(name);
}

export function validateRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

// ============================================================================
// Text Processing
// ============================================================================

export function sanitizeInput(text: string, maxLength: number = EXTENSION_SETTINGS.MAX_TEXT_LENGTH): string {
  return text
    .trim()
    .substring(0, maxLength)
    .replace(/\0/g, ''); // Remove null bytes
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// DOI Extraction
// ============================================================================

export function extractDoi(text: string): string | null {
  const match = text.match(REGEX_PATTERNS.DOI);
  return match ? match[0] : null;
}

export function extractDoiFromUrl(url: string): string | null {
  // Try to extract DOI from URL like https://doi.org/10.1234/example
  const urlMatch = url.match(/doi\.org\/(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
  if (urlMatch) return urlMatch[1];

  // Try to extract from query parameters or path
  return extractDoi(url);
}

// ============================================================================
// ArXiv ID Extraction
// ============================================================================

export function extractArxivId(text: string): string | null {
  const match = text.match(REGEX_PATTERNS.ARXIV_ID);
  return match ? match[0] : null;
}

export function extractArxivIdFromUrl(url: string): string | null {
  // Match URLs like https://arxiv.org/abs/2103.00020
  const match = url.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5}(?:v\d+)?)/);
  return match ? match[1] : null;
}

// ============================================================================
// Rate Limit Parsing
// ============================================================================

export function parseRateLimitHeaders(headers: Headers): RateLimitInfo | null {
  const limit = headers.get('X-RateLimit-Limit');
  const remaining = headers.get('X-RateLimit-Remaining');
  const reset = headers.get('X-RateLimit-Reset');

  if (!limit || !remaining || !reset) return null;

  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    reset: parseInt(reset, 10),
  };
}

export function isRateLimitLow(rateLimit: RateLimitInfo | null, threshold: number = 5): boolean {
  if (!rateLimit) return false;
  return rateLimit.remaining < threshold;
}

// ============================================================================
// Time Utilities
// ============================================================================

export function isExpired(timestamp: number, timeoutMs: number): boolean {
  return Date.now() - timestamp > timeoutMs;
}

export function formatTimeAgo(timestamp: string | number): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

  return date.toLocaleDateString();
}

// ============================================================================
// URL Utilities
// ============================================================================

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function matchesPattern(url: string, pattern: string): boolean {
  const hostname = getHostname(url);
  if (!hostname) return false;
  return hostname.includes(pattern);
}

// ============================================================================
// Array Utilities
// ============================================================================

export function uniqueByKey<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// ============================================================================
// Object Utilities
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================================
// Error Handling
// ============================================================================

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.toLowerCase().includes('network') ||
           error.message.toLowerCase().includes('fetch');
  }
  return false;
}

// ============================================================================
// Debounce
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitMs);
  };
}

// ============================================================================
// Sleep/Delay
// ============================================================================

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Retry Logic
// ============================================================================

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await sleep(delayMs * attempt); // Exponential backoff
      }
    }
  }

  throw lastError;
}

// ============================================================================
// Fetch with Timeout
// ============================================================================

/**
 * Creates a fetch request with timeout support using AbortController
 * @param url The URL to fetch
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds (default 30000 = 30s)
 * @returns Promise with fetch response
 * @throws Error if request times out
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error: unknown) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out after ' + timeoutMs + 'ms');
    }
    throw error;
  }
}

// ============================================================================
// Async Debounce Utility
// ============================================================================

/**
 * Creates a debounced async function that returns a promise
 *
 * @param func The async function to debounce
 * @param wait The number of milliseconds to delay
 * @returns The debounced async function
 */
export function debounceAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingPromise: Promise<ReturnType<T>> | null = null;

  return function (this: unknown, ...args: Parameters<T>): Promise<ReturnType<T>> {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    if (!pendingPromise) {
      pendingPromise = new Promise<ReturnType<T>>((resolve) => {
        timeoutId = setTimeout(() => {
          const result = func.apply(this, args) as Promise<ReturnType<T>>;
          resolve(result);
          timeoutId = null;
          pendingPromise = null;
        }, wait);
      });
    }

    return pendingPromise;
  };
}
