/**
 * Request Deduplicator
 *
 * Prevents duplicate concurrent requests to the same resource.
 * If multiple calls are made to the same key while a request is pending,
 * all callers will receive the result of the single network request.
 *
 * Example:
 * ```ts
 * const dedup = new RequestDeduplicator();
 *
 * // These will all share the same underlying request
 * const promise1 = dedup.dedupe('projects', () => fetchProjects());
 * const promise2 = dedup.dedupe('projects', () => fetchProjects());
 * const promise3 = dedup.dedupe('projects', () => fetchProjects());
 * ```
 */

import { logger } from './logger';

export class RequestDeduplicator {
  // Map of request keys to pending promises
  private pending = new Map<string, Promise<unknown>>();

  // Map to track request counts for monitoring
  private requestCounts = new Map<string, number>();

  /**
   * Execute a request with deduplication
   *
   * @param key Unique identifier for this request
   * @param fn Function that performs the actual request
   * @returns Promise that resolves with the request result
   */
  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Check if this request is already pending
    if (this.pending.has(key)) {
      const count = (this.requestCounts.get(key) || 1) + 1;
      this.requestCounts.set(key, count);
      logger.debug(`[RequestDedup] Reusing pending request for: ${key} (count: ${count})`);

      return this.pending.get(key) as Promise<T>;
    }

    // Start a new request
    logger.debug(`[RequestDedup] Starting new request for: ${key}`);
    this.requestCounts.set(key, 1);

    const promise = fn()
      .finally(() => {
        // Clean up after request completes (success or failure)
        this.pending.delete(key);

        const count = this.requestCounts.get(key) || 1;
        if (count > 1) {
          logger.debug(`[RequestDedup] Request completed for: ${key} (served ${count} callers)`);
        }
        this.requestCounts.delete(key);
      });

    this.pending.set(key, promise);

    return promise as Promise<T>;
  }

  /**
   * Check if a request is currently pending
   *
   * @param key Request key to check
   * @returns True if request is pending
   */
  isPending(key: string): boolean {
    return this.pending.has(key);
  }

  /**
   * Get the number of pending requests
   *
   * @returns Count of pending requests
   */
  getPendingCount(): number {
    return this.pending.size;
  }

  /**
   * Clear all pending requests
   * Note: This doesn't cancel the requests, just removes them from tracking
   */
  clear(): void {
    this.pending.clear();
    this.requestCounts.clear();
  }

  /**
   * Get statistics about request deduplication
   *
   * @returns Object with deduplication stats
   */
  getStats(): { pending: number; keys: string[] } {
    return {
      pending: this.pending.size,
      keys: Array.from(this.pending.keys()),
    };
  }
}

/**
 * Global singleton instance for use across the application
 */
export const globalDeduplicator = new RequestDeduplicator();
