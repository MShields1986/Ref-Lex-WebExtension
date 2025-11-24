// Debug logging wrapper that only logs in development mode
// Prevents sensitive data exposure in production

/**
 * Detects if we're in development mode
 * In webpack production build, this will be optimized away
 */
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Logger utility that conditionally logs based on environment
 * - debug/info: Only in development mode
 * - warn/error: Always shown (important for users and debugging)
 */
export const logger = {
  /**
   * Debug logging - only in development
   * Use for detailed information about application flow
   */
  debug(...args: unknown[]) {
    if (IS_DEV) {
      console.log('[Ref-Lex DEBUG]', ...args);
    }
  },

  /**
   * Info logging - only in development
   * Use for general informational messages
   */
  info(...args: unknown[]) {
    if (IS_DEV) {
      console.info('[Ref-Lex INFO]', ...args);
    }
  },

  /**
   * Warning logging - always shown
   * Use for recoverable issues that users should be aware of
   */
  warn(...args: unknown[]) {
    console.warn('[Ref-Lex WARN]', ...args);
  },

  /**
   * Error logging - always shown
   * Use for errors that need to be debugged
   */
  error(...args: unknown[]) {
    console.error('[Ref-Lex ERROR]', ...args);
  },
};

/**
 * Export for conditional logging in special cases
 */
export const isDebugMode = IS_DEV;
