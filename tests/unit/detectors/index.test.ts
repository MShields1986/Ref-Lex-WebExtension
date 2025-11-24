import { jest } from '@jest/globals';

// Mock all detector functions
const mockDetectArxiv = jest.fn();
const mockDetectScholar = jest.fn();
const mockDetectPubmed = jest.fn();
const mockDetectIeee = jest.fn();
const mockDetectAcm = jest.fn();
const mockDetectSpringer = jest.fn();
const mockDetectScienceDirect = jest.fn();
const mockDetectJstor = jest.fn();
const mockDetectGeneric = jest.fn();

jest.mock('../../../src/content/detectors/arxiv', () => ({
  detectArxiv: mockDetectArxiv,
}));

jest.mock('../../../src/content/detectors/scholar', () => ({
  detectScholar: mockDetectScholar,
}));

jest.mock('../../../src/content/detectors/pubmed', () => ({
  detectPubmed: mockDetectPubmed,
}));

jest.mock('../../../src/content/detectors/ieee', () => ({
  detectIeee: mockDetectIeee,
}));

jest.mock('../../../src/content/detectors/acm', () => ({
  detectAcm: mockDetectAcm,
}));

jest.mock('../../../src/content/detectors/springer', () => ({
  detectSpringer: mockDetectSpringer,
}));

jest.mock('../../../src/content/detectors/sciencedirect', () => ({
  detectScienceDirect: mockDetectScienceDirect,
}));

jest.mock('../../../src/content/detectors/jstor', () => ({
  detectJstor: mockDetectJstor,
}));

jest.mock('../../../src/content/detectors/generic', () => ({
  detectGeneric: mockDetectGeneric,
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: { href: 'https://example.com' },
});

import { detectPaper } from '../../../src/content/detectors';
import { PaperMetadata } from '../../../src/shared/types';

describe('Detector Registry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default all detectors to return null
    mockDetectArxiv.mockResolvedValue(null);
    mockDetectScholar.mockResolvedValue(null);
    mockDetectPubmed.mockResolvedValue(null);
    mockDetectIeee.mockResolvedValue(null);
    mockDetectAcm.mockResolvedValue(null);
    mockDetectSpringer.mockResolvedValue(null);
    mockDetectScienceDirect.mockResolvedValue(null);
    mockDetectJstor.mockResolvedValue(null);
    mockDetectGeneric.mockResolvedValue(null);
  });

  describe('detectPaper', () => {
    it('should return paper from first matching detector', async () => {
      const mockPaper: PaperMetadata = {
        title: 'ArXiv Paper',
        authors: ['Author 1'],
        year: '2024',
        source: 'arxiv',
      };

      mockDetectArxiv.mockResolvedValue(mockPaper);

      const result = await detectPaper();

      expect(result).toEqual(mockPaper);
      expect(mockDetectArxiv).toHaveBeenCalled();
      // Should not call other detectors after first match
      expect(mockDetectScholar).not.toHaveBeenCalled();
      expect(mockDetectGeneric).not.toHaveBeenCalled();
    });

    it('should try detectors in order until one succeeds', async () => {
      const mockPaper: PaperMetadata = {
        title: 'IEEE Paper',
        authors: ['Author 1'],
        year: '2024',
        source: 'ieee',
      };

      // First few return null, IEEE returns paper
      mockDetectArxiv.mockResolvedValue(null);
      mockDetectScholar.mockResolvedValue(null);
      mockDetectPubmed.mockResolvedValue(null);
      mockDetectIeee.mockResolvedValue(mockPaper);

      const result = await detectPaper();

      expect(result).toEqual(mockPaper);
      expect(mockDetectArxiv).toHaveBeenCalled();
      expect(mockDetectScholar).toHaveBeenCalled();
      expect(mockDetectPubmed).toHaveBeenCalled();
      expect(mockDetectIeee).toHaveBeenCalled();
      // Should not call detectors after match
      expect(mockDetectAcm).not.toHaveBeenCalled();
      expect(mockDetectGeneric).not.toHaveBeenCalled();
    });

    it('should fallback to generic detector when no specialized detector matches', async () => {
      const mockPaper: PaperMetadata = {
        title: 'Generic Paper',
        authors: ['Author 1'],
        year: '2024',
        source: 'generic',
      };

      // All specialized detectors return null
      mockDetectGeneric.mockResolvedValue(mockPaper);

      const result = await detectPaper();

      expect(result).toEqual(mockPaper);
      // All specialized detectors should be tried
      expect(mockDetectArxiv).toHaveBeenCalled();
      expect(mockDetectScholar).toHaveBeenCalled();
      expect(mockDetectPubmed).toHaveBeenCalled();
      expect(mockDetectIeee).toHaveBeenCalled();
      expect(mockDetectAcm).toHaveBeenCalled();
      expect(mockDetectSpringer).toHaveBeenCalled();
      expect(mockDetectScienceDirect).toHaveBeenCalled();
      expect(mockDetectJstor).toHaveBeenCalled();
      // Generic should be called last
      expect(mockDetectGeneric).toHaveBeenCalled();
    });

    it('should return null when no detector matches', async () => {
      // All detectors return null
      mockDetectGeneric.mockResolvedValue(null);

      const result = await detectPaper();

      expect(result).toBeNull();
      expect(mockDetectGeneric).toHaveBeenCalled();
    });

    it('should continue to next detector if one throws error', async () => {
      const mockPaper: PaperMetadata = {
        title: 'Scholar Paper',
        authors: ['Author 1'],
        year: '2024',
        source: 'scholar',
      };

      // First detector throws error, second succeeds
      mockDetectArxiv.mockRejectedValue(new Error('ArXiv detector failed'));
      mockDetectScholar.mockResolvedValue(mockPaper);

      const result = await detectPaper();

      expect(result).toEqual(mockPaper);
      expect(mockDetectArxiv).toHaveBeenCalled();
      expect(mockDetectScholar).toHaveBeenCalled();
    });

    it('should handle multiple detector failures gracefully', async () => {
      const mockPaper: PaperMetadata = {
        title: 'Generic Paper',
        authors: ['Author 1'],
        year: '2024',
        source: 'generic',
      };

      // Multiple detectors throw errors
      mockDetectArxiv.mockRejectedValue(new Error('ArXiv failed'));
      mockDetectScholar.mockRejectedValue(new Error('Scholar failed'));
      mockDetectPubmed.mockRejectedValue(new Error('PubMed failed'));
      mockDetectGeneric.mockResolvedValue(mockPaper);

      const result = await detectPaper();

      expect(result).toEqual(mockPaper);
      expect(mockDetectGeneric).toHaveBeenCalled();
    });

    it('should handle generic detector failure', async () => {
      mockDetectGeneric.mockResolvedValue(null);

      const result = await detectPaper();

      // Should return null when generic detector returns null
      expect(result).toBeNull();
    });
  });

  describe('Detector Priority', () => {
    it('should prioritize ArXiv over generic for arxiv.org pages', async () => {
      const arxivPaper: PaperMetadata = {
        title: 'ArXiv Paper',
        authors: ['Author 1'],
        year: '2024',
        source: 'arxiv',
      };

      const genericPaper: PaperMetadata = {
        title: 'Generic Paper',
        authors: ['Author 1'],
        year: '2024',
        source: 'generic',
      };

      mockDetectArxiv.mockResolvedValue(arxivPaper);
      mockDetectGeneric.mockResolvedValue(genericPaper);

      const result = await detectPaper();

      expect(result).toEqual(arxivPaper);
      expect(mockDetectGeneric).not.toHaveBeenCalled();
    });

    it('should prioritize Springer over generic for springer.com pages', async () => {
      const springerPaper: PaperMetadata = {
        title: 'Springer Paper',
        authors: ['Author 1'],
        year: '2024',
        source: 'springer',
      };

      const genericPaper: PaperMetadata = {
        title: 'Generic Paper',
        authors: ['Author 1'],
        year: '2024',
        source: 'generic',
      };

      mockDetectSpringer.mockResolvedValue(springerPaper);
      mockDetectGeneric.mockResolvedValue(genericPaper);

      const result = await detectPaper();

      expect(result).toEqual(springerPaper);
      expect(mockDetectGeneric).not.toHaveBeenCalled();
    });
  });

  describe('Paper Metadata', () => {
    it('should preserve all paper metadata fields', async () => {
      const mockPaper: PaperMetadata = {
        title: 'Complete Paper',
        authors: ['Author 1', 'Author 2', 'Author 3'],
        year: '2024',
        doi: '10.1234/test',
        url: 'https://arxiv.org/abs/2024.12345',
        abstract: 'This is a test abstract with special characters: {braces} and % signs',
        journal: 'Test Journal',
        volume: '42',
        pages: '1--10',
        bibtexRaw: '@article{test2024, title={Complete Paper}}',
        source: 'arxiv',
      };

      mockDetectArxiv.mockResolvedValue(mockPaper);

      const result = await detectPaper();

      expect(result).toEqual(mockPaper);
      expect(result?.title).toBe('Complete Paper');
      expect(result?.authors).toHaveLength(3);
      expect(result?.abstract).toContain('special characters');
      expect(result?.bibtexRaw).toContain('@article');
    });
  });
});
