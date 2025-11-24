import { jest } from '@jest/globals';

// Mock utilities
jest.mock('../../../src/shared/utils', () => ({
  extractArxivIdFromUrl: jest.fn(),
}));

jest.mock('../../../src/content/bibtex-generator', () => ({
  generateBibtex: jest.fn(),
  generateBibtexKey: jest.fn(),
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    hostname: 'arxiv.org',
    href: 'https://arxiv.org/abs/2401.12345',
  },
});

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

import { detectArxiv } from '../../../src/content/detectors/arxiv';
import { extractArxivIdFromUrl } from '../../../src/shared/utils';
import { generateBibtex, generateBibtexKey } from '../../../src/content/bibtex-generator';

describe('ArXiv Detector', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset DOM
    document.body.innerHTML = '';

    // Reset window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        hostname: 'arxiv.org',
        href: 'https://arxiv.org/abs/2401.12345',
      },
    });
  });

  describe('Domain Detection', () => {
    it('should return null for non-arxiv domains', async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          hostname: 'example.com',
          href: 'https://example.com',
        },
      });

      const result = await detectArxiv();

      expect(result).toBeNull();
    });

    it('should detect arxiv.org domain', async () => {
      (extractArxivIdFromUrl as jest.MockedFunction<typeof extractArxivIdFromUrl>)
        .mockReturnValue('2401.12345');

      // Setup minimal DOM
      document.body.innerHTML = `
        <h1 class="title">Title: Test Paper</h1>
        <div class="authors"><a>Author 1</a></div>
        <blockquote class="abstract">Abstract: Test abstract</blockquote>
      `;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        text: async () => '@article{test2024, title={Test}}',
      } as Response);

      const result = await detectArxiv();

      expect(result).not.toBeNull();
      expect(result?.source).toBe('arxiv');
    });
  });

  describe('ArXiv ID Extraction', () => {
    it('should return null when no ArXiv ID found', async () => {
      (extractArxivIdFromUrl as jest.MockedFunction<typeof extractArxivIdFromUrl>)
        .mockReturnValue(null);

      const result = await detectArxiv();

      expect(result).toBeNull();
    });

    it('should extract ArXiv ID from URL', async () => {
      (extractArxivIdFromUrl as jest.MockedFunction<typeof extractArxivIdFromUrl>)
        .mockReturnValue('2401.12345');

      document.body.innerHTML = `
        <h1 class="title">Title: Test Paper</h1>
        <div class="authors"><a>Author 1</a></div>
      `;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
      } as Response);

      (generateBibtexKey as jest.MockedFunction<typeof generateBibtexKey>)
        .mockReturnValue('test2024');
      (generateBibtex as jest.MockedFunction<typeof generateBibtex>)
        .mockReturnValue('@article{test2024, title={Test}}');

      const result = await detectArxiv();

      expect(result).not.toBeNull();
      expect(extractArxivIdFromUrl).toHaveBeenCalledWith(window.location.href);
    });
  });

  describe('Metadata Scraping', () => {
    beforeEach(() => {
      (extractArxivIdFromUrl as jest.MockedFunction<typeof extractArxivIdFromUrl>)
        .mockReturnValue('2401.12345');
    });

    it('should extract title from page', async () => {
      document.body.innerHTML = `
        <h1 class="title">Title: Machine Learning for Everyone</h1>
        <div class="authors"><a>Author 1</a></div>
      `;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        text: async () => '@article{test2024, title={Test}}',
      } as Response);

      const result = await detectArxiv();

      expect(result?.title).toBe('Machine Learning for Everyone');
    });

    it('should extract authors from page', async () => {
      document.body.innerHTML = `
        <h1 class="title">Title: Test Paper</h1>
        <div class="authors">
          <a>John Doe</a>
          <a>Jane Smith</a>
          <a>Bob Johnson</a>
        </div>
      `;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        text: async () => '@article{test2024, title={Test}}',
      } as Response);

      const result = await detectArxiv();

      expect(result?.authors).toEqual(['John Doe', 'Jane Smith', 'Bob Johnson']);
    });

    it('should extract abstract from page', async () => {
      document.body.innerHTML = `
        <h1 class="title">Title: Test Paper</h1>
        <div class="authors"><a>Author 1</a></div>
        <blockquote class="abstract">
          Abstract: This is a comprehensive study of machine learning algorithms.
        </blockquote>
      `;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        text: async () => '@article{test2024, title={Test}}',
      } as Response);

      const result = await detectArxiv();

      expect(result?.abstract).toContain('comprehensive study');
      expect(result?.abstract).not.toContain('Abstract:');
    });

    it('should extract DOI from link', async () => {
      document.body.innerHTML = `
        <h1 class="title">Title: Test Paper</h1>
        <div class="authors"><a>Author 1</a></div>
        <a href="https://doi.org/10.1234/test.doi">DOI Link</a>
      `;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        text: async () => '@article{test2024, title={Test}}',
      } as Response);

      const result = await detectArxiv();

      expect(result?.doi).toBe('10.1234/test.doi');
    });

    it('should extract DOI from meta tag if no link', async () => {
      document.head.innerHTML = `
        <meta name="citation_doi" content="10.5678/meta.doi">
      `;

      document.body.innerHTML = `
        <h1 class="title">Title: Test Paper</h1>
        <div class="authors"><a>Author 1</a></div>
      `;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        text: async () => '@article{test2024, title={Test}}',
      } as Response);

      const result = await detectArxiv();

      expect(result?.doi).toBe('10.5678/meta.doi');
    });
  });

  describe('Year Extraction', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <h1 class="title">Title: Test Paper</h1>
        <div class="authors"><a>Author 1</a></div>
      `;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        text: async () => '@article{test2024, title={Test}}',
      } as Response);
    });

    it('should extract year from 21st century ArXiv ID', async () => {
      (extractArxivIdFromUrl as jest.MockedFunction<typeof extractArxivIdFromUrl>)
        .mockReturnValue('2401.12345');

      const result = await detectArxiv();

      expect(result?.year).toBe('2024');
    });

    it('should extract year from 20th century ArXiv ID', async () => {
      (extractArxivIdFromUrl as jest.MockedFunction<typeof extractArxivIdFromUrl>)
        .mockReturnValue('9812.12345');

      const result = await detectArxiv();

      expect(result?.year).toBe('1998');
    });

    it('should handle old format ArXiv IDs', async () => {
      (extractArxivIdFromUrl as jest.MockedFunction<typeof extractArxivIdFromUrl>)
        .mockReturnValue('1512.03385');

      const result = await detectArxiv();

      expect(result?.year).toBe('2015');
    });
  });

  describe('BibTeX Fetching', () => {
    beforeEach(() => {
      (extractArxivIdFromUrl as jest.MockedFunction<typeof extractArxivIdFromUrl>)
        .mockReturnValue('2401.12345');

      document.body.innerHTML = `
        <h1 class="title">Title: Test Paper</h1>
        <div class="authors"><a>Author 1</a></div>
      `;
    });

    it('should fetch BibTeX from ArXiv API', async () => {
      const mockBibtex = '@article{test2024,\n  title={Test Paper},\n  author={Author 1}\n}';

      // Clear any meta tags to ensure DOI isn't added
      document.head.innerHTML = '';

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        text: async () => mockBibtex,
      } as Response);

      const result = await detectArxiv();

      expect(result?.bibtexRaw).toBe(mockBibtex);
      expect(global.fetch).toHaveBeenCalledWith('https://arxiv.org/bibtex/2401.12345');
    });

    it('should add DOI to fetched BibTeX if missing', async () => {
      const mockBibtex = '@article{test2024,\n  title={Test Paper}\n}';

      document.body.innerHTML = `
        <h1 class="title">Title: Test Paper</h1>
        <div class="authors"><a>Author 1</a></div>
        <a href="https://doi.org/10.1234/test.doi">DOI</a>
      `;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        text: async () => mockBibtex,
      } as Response);

      const result = await detectArxiv();

      expect(result?.bibtexRaw).toContain('doi={10.1234/test.doi}');
    });

    it('should not add DOI if already in BibTeX', async () => {
      const mockBibtex = '@article{test2024,\n  title={Test},\n  doi={10.9999/existing}\n}';

      document.body.innerHTML = `
        <h1 class="title">Title: Test Paper</h1>
        <div class="authors"><a>Author 1</a></div>
        <a href="https://doi.org/10.1234/test.doi">DOI</a>
      `;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        text: async () => mockBibtex,
      } as Response);

      const result = await detectArxiv();

      // Should not add duplicate DOI
      expect(result?.bibtexRaw).toBe(mockBibtex);
      expect(result?.bibtexRaw).not.toContain('10.1234/test.doi');
    });

    it('should generate BibTeX locally if fetch fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
      } as Response);

      (generateBibtexKey as jest.MockedFunction<typeof generateBibtexKey>)
        .mockReturnValue('test2024');

      const mockGeneratedBibtex = '@article{test2024, title={Test Paper}}';
      (generateBibtex as jest.MockedFunction<typeof generateBibtex>)
        .mockReturnValue(mockGeneratedBibtex);

      const result = await detectArxiv();

      expect(result?.bibtexRaw).toBe(mockGeneratedBibtex);
      expect(generateBibtex).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'article',
          key: 'test2024',
          title: 'Test Paper',
          eprint: '2401.12345',
          archivePrefix: 'arXiv',
        })
      );
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
        new Error('Network error')
      );

      (generateBibtexKey as jest.MockedFunction<typeof generateBibtexKey>)
        .mockReturnValue('test2024');
      (generateBibtex as jest.MockedFunction<typeof generateBibtex>)
        .mockReturnValue('@article{test2024, title={Test}}');

      const result = await detectArxiv();

      // Should fallback to generated BibTeX
      expect(result).not.toBeNull();
      expect(generateBibtex).toHaveBeenCalled();
    });
  });

  describe('Complete Paper Metadata', () => {
    it('should return complete paper metadata', async () => {
      (extractArxivIdFromUrl as jest.MockedFunction<typeof extractArxivIdFromUrl>)
        .mockReturnValue('2401.12345');

      document.body.innerHTML = `
        <h1 class="title">Title: Complete Test Paper</h1>
        <div class="authors">
          <a>John Doe</a>
          <a>Jane Smith</a>
        </div>
        <blockquote class="abstract">
          Abstract: This is the abstract of the paper.
        </blockquote>
        <a href="https://doi.org/10.1234/complete">DOI</a>
      `;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        text: async () => '@article{test2024, title={Complete Test Paper}}',
      } as Response);

      const result = await detectArxiv();

      expect(result).toEqual({
        title: 'Complete Test Paper',
        authors: ['John Doe', 'Jane Smith'],
        year: '2024',
        doi: '10.1234/complete',
        url: window.location.href,
        abstract: 'This is the abstract of the paper.',
        bibtexRaw: expect.stringContaining('doi={10.1234/complete}'),
        source: 'arxiv',
      });
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      (extractArxivIdFromUrl as jest.MockedFunction<typeof extractArxivIdFromUrl>)
        .mockReturnValue('2401.12345');
    });

    it('should handle missing title', async () => {
      document.body.innerHTML = `
        <div class="authors"><a>Author 1</a></div>
      `;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        text: async () => '@article{test2024, title={Test}}',
      } as Response);

      const result = await detectArxiv();

      expect(result?.title).toBeUndefined();
    });

    it('should handle empty authors list', async () => {
      document.body.innerHTML = `
        <h1 class="title">Title: Test Paper</h1>
        <div class="authors"></div>
      `;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        text: async () => '@article{test2024, title={Test}}',
      } as Response);

      const result = await detectArxiv();

      expect(result?.authors).toEqual([]);
    });

    it('should handle missing abstract', async () => {
      document.body.innerHTML = `
        <h1 class="title">Title: Test Paper</h1>
        <div class="authors"><a>Author 1</a></div>
      `;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        text: async () => '@article{test2024, title={Test}}',
      } as Response);

      const result = await detectArxiv();

      expect(result?.abstract).toBeUndefined();
    });

    it('should not generate BibTeX if title or authors are missing', async () => {
      document.body.innerHTML = `
        <h1 class="title">Title: Test Paper</h1>
      `;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
      } as Response);

      const result = await detectArxiv();

      expect(generateBibtex).not.toHaveBeenCalled();
      expect(result?.bibtexRaw).toBeUndefined();
    });
  });
});
