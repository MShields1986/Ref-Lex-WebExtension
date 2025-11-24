import {
  compareVersions,
  validateBibtex,
  validateEmail,
  validateCategoryName,
  validateRating,
  sanitizeInput,
  truncateText,
  escapeHtml,
  extractDoi,
  extractDoiFromUrl,
  extractArxivId,
  extractArxivIdFromUrl,
  parseRateLimitHeaders,
  isRateLimitLow,
  isExpired,
  formatTimeAgo,
  isValidUrl,
  getHostname,
  matchesPattern,
  uniqueByKey,
  groupBy,
  removeUndefined,
  deepClone,
  getErrorMessage,
  isNetworkError,
  sleep,
  retry,
} from '../../src/shared/utils';

describe('Version Comparison', () => {
  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('2.5.3', '2.5.3')).toBe(0);
    });

    it('should return 1 when first version is greater', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
    });

    it('should return -1 when second version is greater', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
    });

    it('should handle versions with different lengths', () => {
      expect(compareVersions('1.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.1', '1.0.5')).toBe(1);
    });
  });
});

describe('Validation Functions', () => {
  describe('validateBibtex', () => {
    it('should return true for valid BibTeX', () => {
      expect(validateBibtex('@article{test, title={Test}}')).toBe(true);
      expect(validateBibtex('@book{key, author={Name}}')).toBe(true);
    });

    it('should return false for empty or invalid input', () => {
      expect(validateBibtex('')).toBe(false);
      expect(validateBibtex('not bibtex')).toBe(false);
      expect(validateBibtex('  no @ symbol')).toBe(false);
    });

    it('should return false for bibtex exceeding max size', () => {
      const largeBibtex = '@article{test, ' + 'a'.repeat(1024 * 1024 + 1) + '}';
      expect(validateBibtex(largeBibtex)).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should return true for valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
    });
  });

  describe('validateCategoryName', () => {
    it('should return true for valid category names', () => {
      expect(validateCategoryName('Machine Learning')).toBe(true);
      expect(validateCategoryName('AI-Research')).toBe(true);
    });

    it('should return false for empty or invalid names', () => {
      expect(validateCategoryName('')).toBe(false);
      expect(validateCategoryName('a'.repeat(256))).toBe(false);
    });
  });

  describe('validateRating', () => {
    it('should return true for valid ratings', () => {
      expect(validateRating(1)).toBe(true);
      expect(validateRating(3)).toBe(true);
      expect(validateRating(5)).toBe(true);
    });

    it('should return false for invalid ratings', () => {
      expect(validateRating(0)).toBe(false);
      expect(validateRating(6)).toBe(false);
      expect(validateRating(3.5)).toBe(false);
    });
  });
});

describe('Text Processing', () => {
  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should limit length', () => {
      expect(sanitizeInput('hello world', 5)).toBe('hello');
    });

    it('should remove null bytes', () => {
      expect(sanitizeInput('test\0null')).toBe('testnull');
    });
  });

  describe('truncateText', () => {
    it('should not truncate short text', () => {
      expect(truncateText('short', 10)).toBe('short');
    });

    it('should truncate long text with ellipsis', () => {
      expect(truncateText('this is a long text', 10)).toBe('this is...');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(escapeHtml("It's & <test>")).toBe("It&#039;s &amp; &lt;test&gt;");
    });
  });
});

describe('DOI Extraction', () => {
  describe('extractDoi', () => {
    it('should extract valid DOIs', () => {
      expect(extractDoi('DOI: 10.1234/example')).toBe('10.1234/example');
      expect(extractDoi('doi:10.5678/test')).toBe('10.5678/test');
    });

    it('should return null for text without DOI', () => {
      expect(extractDoi('no doi here')).toBeNull();
    });
  });

  describe('extractDoiFromUrl', () => {
    it('should extract DOI from doi.org URLs', () => {
      expect(extractDoiFromUrl('https://doi.org/10.1234/example'))
        .toBe('10.1234/example');
    });

    it('should return null for URLs without DOI', () => {
      expect(extractDoiFromUrl('https://example.com')).toBeNull();
    });
  });
});

describe('ArXiv ID Extraction', () => {
  describe('extractArxivId', () => {
    it('should extract valid ArXiv IDs', () => {
      expect(extractArxivId('arXiv:2103.00020')).toBe('2103.00020');
      expect(extractArxivId('2103.00020v1')).toBe('2103.00020v1');
    });

    it('should return null for text without ArXiv ID', () => {
      expect(extractArxivId('no arxiv id')).toBeNull();
    });
  });

  describe('extractArxivIdFromUrl', () => {
    it('should extract ArXiv ID from URLs', () => {
      expect(extractArxivIdFromUrl('https://arxiv.org/abs/2103.00020'))
        .toBe('2103.00020');
      expect(extractArxivIdFromUrl('https://arxiv.org/pdf/2103.00020v2'))
        .toBe('2103.00020v2');
    });

    it('should return null for non-ArXiv URLs', () => {
      expect(extractArxivIdFromUrl('https://example.com')).toBeNull();
    });
  });
});

describe('Rate Limit Utilities', () => {
  describe('parseRateLimitHeaders', () => {
    it('should parse rate limit headers', () => {
      const headers = new Headers({
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '50',
        'X-RateLimit-Reset': '1640000000',
      });

      expect(parseRateLimitHeaders(headers)).toEqual({
        limit: 100,
        remaining: 50,
        reset: 1640000000,
      });
    });

    it('should return null for missing headers', () => {
      const headers = new Headers();
      expect(parseRateLimitHeaders(headers)).toBeNull();
    });
  });

  describe('isRateLimitLow', () => {
    it('should return true when remaining is below threshold', () => {
      expect(isRateLimitLow({ limit: 100, remaining: 3, reset: 0 }, 5)).toBe(true);
    });

    it('should return false when remaining is above threshold', () => {
      expect(isRateLimitLow({ limit: 100, remaining: 10, reset: 0 }, 5)).toBe(false);
    });

    it('should return false for null rate limit', () => {
      expect(isRateLimitLow(null)).toBe(false);
    });
  });
});

describe('Time Utilities', () => {
  describe('isExpired', () => {
    it('should return true for expired timestamps', () => {
      const oldTimestamp = Date.now() - 10000; // 10 seconds ago
      expect(isExpired(oldTimestamp, 5000)).toBe(true);
    });

    it('should return false for non-expired timestamps', () => {
      const recentTimestamp = Date.now() - 1000; // 1 second ago
      expect(isExpired(recentTimestamp, 5000)).toBe(false);
    });
  });

  describe('formatTimeAgo', () => {
    it('should format recent times', () => {
      const now = Date.now();
      expect(formatTimeAgo(now)).toBe('just now');
    });

    it('should format minutes ago', () => {
      const twoMinutesAgo = Date.now() - 120000;
      expect(formatTimeAgo(twoMinutesAgo)).toBe('2 minutes ago');
    });

    it('should format hours ago', () => {
      const twoHoursAgo = Date.now() - 7200000;
      expect(formatTimeAgo(twoHoursAgo)).toBe('2 hours ago');
    });
  });
});

describe('URL Utilities', () => {
  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://test.org/path')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('getHostname', () => {
    it('should extract hostname from URL', () => {
      expect(getHostname('https://example.com/path')).toBe('example.com');
      expect(getHostname('http://test.org:8080')).toBe('test.org');
    });

    it('should return null for invalid URLs', () => {
      expect(getHostname('invalid')).toBeNull();
    });
  });

  describe('matchesPattern', () => {
    it('should match URL patterns', () => {
      expect(matchesPattern('https://arxiv.org/abs/123', 'arxiv')).toBe(true);
      expect(matchesPattern('https://example.com', 'test')).toBe(false);
    });
  });
});

describe('Array Utilities', () => {
  describe('uniqueByKey', () => {
    it('should remove duplicates by key', () => {
      const items = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 1, name: 'C' },
      ];
      expect(uniqueByKey(items, 'id')).toEqual([
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ]);
    });
  });

  describe('groupBy', () => {
    it('should group items by key', () => {
      const items = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 },
      ];
      expect(groupBy(items, 'category')).toEqual({
        A: [{ category: 'A', value: 1 }, { category: 'A', value: 3 }],
        B: [{ category: 'B', value: 2 }],
      });
    });
  });
});

describe('Object Utilities', () => {
  describe('removeUndefined', () => {
    it('should remove undefined values', () => {
      expect(removeUndefined({ a: 1, b: undefined, c: 3 })).toEqual({ a: 1, c: 3 });
    });
  });

  describe('deepClone', () => {
    it('should create deep copy', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      cloned.b.c = 3;
      expect(original.b.c).toBe(2);
    });
  });
});

describe('Error Handling', () => {
  describe('getErrorMessage', () => {
    it('should extract message from Error object', () => {
      expect(getErrorMessage(new Error('test error'))).toBe('test error');
    });

    it('should return string errors as-is', () => {
      expect(getErrorMessage('string error')).toBe('string error');
    });

    it('should return default message for unknown errors', () => {
      expect(getErrorMessage({ unknown: true })).toBe('An unknown error occurred');
    });
  });

  describe('isNetworkError', () => {
    it('should identify network errors', () => {
      expect(isNetworkError(new Error('Network request failed'))).toBe(true);
      expect(isNetworkError(new Error('Fetch error'))).toBe(true);
    });

    it('should return false for non-network errors', () => {
      expect(isNetworkError(new Error('Other error'))).toBe(false);
    });
  });
});

describe('Async Utilities', () => {
  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await sleep(100);
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(90); // Allow some margin
    });
  });

  describe('retry', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        if (attempts < 3) throw new Error('fail');
        return 'success';
      });

      const result = await retry(fn, 3, 10);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const fn = jest.fn(async () => {
        throw new Error('always fails');
      });

      await expect(retry(fn, 2, 10)).rejects.toThrow('always fails');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
