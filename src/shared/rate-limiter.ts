/**
 * Rate Limiter
 *
 * Implements client-side rate limiting to prevent hitting API rate limits.
 * Uses a token bucket algorithm with request queuing.
 *
 * Features:
 * - Token bucket algorithm for smooth rate limiting
 * - Request queuing when rate limit is reached
 * - Automatic rate adjustment based on server headers
 * - Priority queue support
 *
 * Example:
 * ```ts
 * const limiter = new RateLimiter({ requestsPerMinute: 60 });
 *
 * // This will be delayed if rate limit is reached
 * await limiter.throttle(async () => {
 *   return await fetchData();
 * });
 * ```
 */

import { logger } from './logger';

export interface RateLimiterConfig {
  /**
   * Maximum requests per minute (default: 60)
   */
  requestsPerMinute?: number;

  /**
   * Maximum requests in queue (default: 100)
   */
  maxQueueSize?: number;

  /**
   * Minimum delay between requests in ms (default: 0)
   */
  minRequestDelay?: number;
}

interface QueuedRequest<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  priority: number;
  timestamp: number;
}

export class RateLimiter {
  private readonly requestsPerMinute: number;
  private readonly maxQueueSize: number;
  private readonly minRequestDelay: number;

  // Token bucket for rate limiting
  private tokens: number;
  private readonly maxTokens: number;
  private lastRefill: number;

  // Request queue
  private queue: Array<QueuedRequest<unknown>> = [];
  private processing = false;

  // Statistics
  private totalRequests = 0;
  private delayedRequests = 0;
  private lastRequestTime = 0;

  constructor(config: RateLimiterConfig = {}) {
    this.requestsPerMinute = config.requestsPerMinute || 60;
    this.maxQueueSize = config.maxQueueSize || 100;
    this.minRequestDelay = config.minRequestDelay || 0;

    // Initialize token bucket
    this.maxTokens = this.requestsPerMinute;
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Throttle a request according to rate limit
   *
   * @param fn Function to execute
   * @param priority Priority level (higher = more important, default: 0)
   * @returns Promise that resolves with the function result
   */
  async throttle<T>(fn: () => Promise<T>, priority: number = 0): Promise<T> {
    // Check queue size
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error('Rate limiter queue is full. Please try again later.');
    }

    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<unknown> = {
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
        priority,
        timestamp: Date.now(),
      };

      this.queue.push(request);
      this.processQueue();
    });
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // Refill tokens based on time elapsed
      this.refillTokens();

      // Check if we have tokens available
      if (this.tokens < 1) {
        // Calculate wait time until next token
        const tokensPerMs = this.requestsPerMinute / 60000;
        const timeForNextToken = Math.ceil(1 / tokensPerMs);
        logger.debug(`[RateLimiter] Waiting ${timeForNextToken}ms for next token`);

        await this.sleep(timeForNextToken);
        continue;
      }

      // Enforce minimum delay between requests
      if (this.minRequestDelay > 0) {
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestDelay) {
          const delay = this.minRequestDelay - timeSinceLastRequest;
          await this.sleep(delay);
        }
      }

      // Sort queue by priority (highest first)
      this.queue.sort((a, b) => b.priority - a.priority);

      // Get next request
      const request = this.queue.shift();
      if (!request) {
        break;
      }

      // Consume a token
      this.tokens -= 1;
      this.lastRequestTime = Date.now();
      this.totalRequests += 1;

      const waitTime = Date.now() - request.timestamp;
      if (waitTime > 100) {
        this.delayedRequests += 1;
        logger.debug(`[RateLimiter] Request delayed ${waitTime}ms`);
      }

      // Execute request
      try {
        const result = await request.fn();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }

    this.processing = false;
  }

  /**
   * Refill tokens based on elapsed time (token bucket algorithm)
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;

    // Calculate tokens to add (requests per minute / 60000 ms = tokens per ms)
    const tokensToAdd = (elapsed * this.requestsPerMinute) / 60000;

    if (tokensToAdd >= 1) {
      this.tokens = Math.min(this.maxTokens, this.tokens + Math.floor(tokensToAdd));
      this.lastRefill = now;
    }
  }

  /**
   * Update rate limit based on server response headers
   *
   * @param limit Maximum requests allowed
   * @param remaining Remaining requests
   * @param reset Timestamp when limit resets
   */
  updateFromHeaders(limit: number, remaining: number, reset: number): void {
    logger.debug(
      `[RateLimiter] Server rate limit: ${remaining}/${limit} (resets at ${new Date(reset * 1000).toISOString()})`
    );

    // If we're close to the limit, be more conservative
    if (remaining < limit * 0.1) {
      // Less than 10% remaining
      logger.warn('[RateLimiter] Approaching rate limit, slowing down requests');
      this.tokens = Math.min(this.tokens, remaining);
    }
  }

  /**
   * Check if we're currently rate limited
   *
   * @returns True if queue has pending requests
   */
  isThrottled(): boolean {
    return this.queue.length > 0;
  }

  /**
   * Get current queue size
   *
   * @returns Number of requests in queue
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get rate limiter statistics
   *
   * @returns Object with statistics
   */
  getStats(): {
    totalRequests: number;
    delayedRequests: number;
    queueSize: number;
    tokens: number;
    maxTokens: number;
  } {
    return {
      totalRequests: this.totalRequests,
      delayedRequests: this.delayedRequests,
      queueSize: this.queue.length,
      tokens: Math.floor(this.tokens),
      maxTokens: this.maxTokens,
    };
  }

  /**
   * Clear the queue and reset tokens
   */
  reset(): void {
    this.queue = [];
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
    this.processing = false;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Global singleton instance for API rate limiting
 * Configured for typical API usage (60 requests per minute)
 */
export const globalRateLimiter = new RateLimiter({
  requestsPerMinute: 60,
  maxQueueSize: 100,
  minRequestDelay: 100, // Minimum 100ms between requests
});
