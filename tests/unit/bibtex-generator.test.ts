import {
  generateBibtex,
  generateBibtexKey,
  generateBibtexFromMetadata,
  escapeBibtexValue,
  escapeMultilineValue,
  BibtexFields,
} from '../../src/content/bibtex-generator';

describe('BibTeX Generator', () => {
  describe('generateBibtex', () => {
    it('should generate valid BibTeX entry', () => {
      const fields: BibtexFields = {
        type: 'article',
        key: 'smith2023test',
        title: 'Test Article',
        author: 'John Smith',
        year: '2023',
      };

      const result = generateBibtex(fields);

      expect(result).toContain('@article{smith2023test,');
      expect(result).toContain('title = {Test Article}');
      expect(result).toContain('author = {John Smith}');
      expect(result).toContain('year = {2023}');
    });

    it('should omit empty fields', () => {
      const fields: BibtexFields = {
        type: 'article',
        key: 'test2023',
        title: 'Test',
        author: '',
        journal: '  ',
      };

      const result = generateBibtex(fields);

      expect(result).toContain('title = {Test}');
      expect(result).not.toContain('author');
      expect(result).not.toContain('journal');
    });

    it('should handle different entry types', () => {
      const bookFields: BibtexFields = {
        type: 'book',
        key: 'doe2020',
        title: 'My Book',
        publisher: 'Test Publisher',
      };

      const result = generateBibtex(bookFields);

      expect(result).toContain('@book{doe2020,');
      expect(result).toContain('publisher = {Test Publisher}');
    });

    it('should format fields correctly', () => {
      const fields: BibtexFields = {
        type: 'inproceedings',
        key: 'conference2021',
        title: 'Conference Paper',
        booktitle: 'Proceedings of Test Conference',
        pages: '123--456',
      };

      const result = generateBibtex(fields);

      expect(result).toContain('@inproceedings{conference2021,');
      expect(result).toContain('booktitle = {Proceedings of Test Conference}');
      expect(result).toContain('pages = {123--456}');
    });
  });

  describe('generateBibtexKey', () => {
    it('should generate key from author, year, and title', () => {
      const paper = {
        authors: ['John Smith', 'Jane Doe'],
        year: '2023',
        title: 'Machine Learning Advances',
      };

      const key = generateBibtexKey(paper);

      expect(key).toBe('smith2023machine');
    });

    it('should handle single-word author names', () => {
      const paper = {
        authors: ['Einstein'],
        year: '1905',
        title: 'Relativity',
      };

      const key = generateBibtexKey(paper);

      expect(key).toBe('einstein1905relativity');
    });

    it('should handle special characters in author names', () => {
      const paper = {
        authors: ['René Müller-Schmidt'],
        year: '2020',
        title: 'Test',
      };

      const key = generateBibtexKey(paper);

      expect(key).toMatch(/schmidt2020test/i);
    });

    it('should use defaults for missing fields', () => {
      const paper = {};

      const key = generateBibtexKey(paper);
      const currentYear = new Date().getFullYear().toString();

      expect(key).toContain('unknown');
      expect(key).toContain(currentYear);
      expect(key).toContain('paper');
    });

    it('should handle multi-word author names', () => {
      const paper = {
        authors: ['John William Smith Jr.'],
        year: '2022',
        title: 'Research',
      };

      const key = generateBibtexKey(paper);

      expect(key).toBe('jr2022research');
    });

    it('should sanitize special characters', () => {
      const paper = {
        authors: ['O\'Brien'],
        year: '2021',
        title: 'Test-Paper: An Analysis!',
      };

      const key = generateBibtexKey(paper);

      expect(key).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('generateBibtexFromMetadata', () => {
    it('should generate complete BibTeX from metadata', () => {
      const metadata = {
        title: 'Deep Learning for Computer Vision',
        authors: ['John Smith', 'Jane Doe', 'Bob Johnson'],
        year: '2023',
        journal: 'Journal of AI Research',
        volume: '42',
        pages: '123-456',
        doi: '10.1234/test.2023.001',
        url: 'https://example.com/paper',
        abstract: 'This is a test abstract about deep learning.',
      };

      const bibtex = generateBibtexFromMetadata(metadata);

      expect(bibtex).toContain('@article{');
      expect(bibtex).toContain('title = {Deep Learning for Computer Vision}');
      expect(bibtex).toContain('author = {John Smith and Jane Doe and Bob Johnson}');
      expect(bibtex).toContain('year = {2023}');
      expect(bibtex).toContain('journal = {Journal of AI Research}');
      expect(bibtex).toContain('volume = {42}');
      expect(bibtex).toContain('pages = {123-456}');
      expect(bibtex).toContain('doi = {10.1234/test.2023.001}');
      expect(bibtex).toContain('url = {https://example.com/paper}');
      expect(bibtex).toContain('abstract = {This is a test abstract about deep learning.}');
    });

    it('should handle minimal metadata', () => {
      const metadata = {
        title: 'Minimal Paper',
      };

      const bibtex = generateBibtexFromMetadata(metadata);

      expect(bibtex).toContain('@article{');
      expect(bibtex).toContain('title = {Minimal Paper}');
    });

    it('should join multiple authors with "and"', () => {
      const metadata = {
        title: 'Multi-Author Paper',
        authors: ['Alice', 'Bob', 'Charlie'],
      };

      const bibtex = generateBibtexFromMetadata(metadata);

      expect(bibtex).toContain('author = {Alice and Bob and Charlie}');
    });

    it('should handle empty authors array', () => {
      const metadata = {
        title: 'No Authors',
        authors: [],
      };

      const bibtex = generateBibtexFromMetadata(metadata);

      expect(bibtex).not.toContain('author = {');
    });

    it('should use current year when year is missing', () => {
      const metadata = {
        title: 'Recent Paper',
        authors: ['Test Author'],
      };

      const bibtex = generateBibtexFromMetadata(metadata);
      const currentYear = new Date().getFullYear().toString();

      expect(bibtex).toContain(currentYear);
    });

    it('should generate valid BibTeX key', () => {
      const metadata = {
        title: 'Test Paper',
        authors: ['Smith'],
        year: '2020',
      };

      const bibtex = generateBibtexFromMetadata(metadata);

      expect(bibtex).toMatch(/@article\{[a-z0-9]+,/);
    });

    it('should handle metadata with only some fields', () => {
      const metadata = {
        title: 'Partial Metadata',
        authors: ['Author Name'],
        doi: '10.1234/example',
      };

      const bibtex = generateBibtexFromMetadata(metadata);

      expect(bibtex).toContain('title = {Partial Metadata}');
      expect(bibtex).toContain('doi = {10.1234/example}');
      expect(bibtex).not.toContain('journal');
      expect(bibtex).not.toContain('volume');
    });
  });

  describe('BibTeX Format Validation', () => {
    it('should produce parseable BibTeX', () => {
      const metadata = {
        title: 'Format Test',
        authors: ['Test Author'],
        year: '2023',
      };

      const bibtex = generateBibtexFromMetadata(metadata);

      // Basic format validation
      expect(bibtex).toMatch(/^@\w+\{.+,\n/);
      expect(bibtex).toMatch(/\}$/);
      expect(bibtex.split('{').length).toBe(bibtex.split('}').length);
    });

    it('should properly escape special characters in values', () => {
      const fields: BibtexFields = {
        type: 'article',
        key: 'test',
        title: 'Title with {braces} and % special chars',
      };

      const bibtex = generateBibtex(fields);

      expect(bibtex).toContain('\\{braces\\}');
      expect(bibtex).toContain('\\%');
    });
  });

  describe('BibTeX Escaping', () => {
    describe('escapeBibtexValue', () => {
      it('should escape braces', () => {
        const value = 'Text with {braces} here';
        const escaped = escapeBibtexValue(value);
        expect(escaped).toBe('Text with \\{braces\\} here');
      });

      it('should escape percent signs', () => {
        const value = 'About 100% complete';
        const escaped = escapeBibtexValue(value);
        expect(escaped).toBe('About 100\\% complete');
      });

      it('should escape ampersands', () => {
        const value = 'Johnson & Smith';
        const escaped = escapeBibtexValue(value);
        expect(escaped).toBe('Johnson \\& Smith');
      });

      it('should escape dollar signs', () => {
        const value = 'Cost: $100';
        const escaped = escapeBibtexValue(value);
        expect(escaped).toBe('Cost: \\$100');
      });

      it('should escape backslashes', () => {
        const value = 'Path\\to\\file';
        const escaped = escapeBibtexValue(value);
        expect(escaped).toBe('Path\\textbackslash{}to\\textbackslash{}file');
      });

      it('should escape hash signs', () => {
        const value = 'Tag #important';
        const escaped = escapeBibtexValue(value);
        expect(escaped).toBe('Tag \\#important');
      });

      it('should escape underscores', () => {
        const value = 'variable_name';
        const escaped = escapeBibtexValue(value);
        expect(escaped).toBe('variable\\_name');
      });

      it('should escape carets', () => {
        const value = 'x^2 + y^2';
        const escaped = escapeBibtexValue(value);
        expect(escaped).toBe('x\\^{}2 + y\\^{}2');
      });

      it('should escape tildes', () => {
        const value = 'Approx ~100';
        const escaped = escapeBibtexValue(value);
        expect(escaped).toBe('Approx \\textasciitilde{}100');
      });

      it('should handle multiple special characters', () => {
        const value = 'Test {100%} & $50 #tag';
        const escaped = escapeBibtexValue(value);
        expect(escaped).toContain('\\{100\\%\\}');
        expect(escaped).toContain('\\&');
        expect(escaped).toContain('\\$50');
        expect(escaped).toContain('\\#tag');
      });

      it('should handle empty string', () => {
        const escaped = escapeBibtexValue('');
        expect(escaped).toBe('');
      });

      it('should handle string without special characters', () => {
        const value = 'Normal text';
        const escaped = escapeBibtexValue(value);
        expect(escaped).toBe('Normal text');
      });
    });

    describe('escapeMultilineValue', () => {
      it('should handle multi-line abstracts', () => {
        const abstract = 'Line 1 with % symbol\nLine 2 with {braces}\nLine 3';
        const escaped = escapeMultilineValue(abstract);
        expect(escaped).toContain('\\%');
        expect(escaped).toContain('\\{braces\\}');
        expect(escaped).not.toContain('\n'); // Should be single line
      });

      it('should join lines with spaces', () => {
        const multiline = 'First line\nSecond line\nThird line';
        const escaped = escapeMultilineValue(multiline);
        expect(escaped).toBe('First line Second line Third line');
      });

      it('should trim whitespace from lines', () => {
        const multiline = '  Line 1  \n  Line 2  \n  Line 3  ';
        const escaped = escapeMultilineValue(multiline);
        expect(escaped).toBe('Line 1 Line 2 Line 3');
      });

      it('should filter out empty lines', () => {
        const multiline = 'Line 1\n\n\nLine 2\n\nLine 3';
        const escaped = escapeMultilineValue(multiline);
        expect(escaped).toBe('Line 1 Line 2 Line 3');
      });

      it('should escape special characters in each line', () => {
        const multiline = 'First {bracket}\nSecond %percent\nThird &ampersand';
        const escaped = escapeMultilineValue(multiline);
        expect(escaped).toContain('\\{bracket\\}');
        expect(escaped).toContain('\\%percent');
        expect(escaped).toContain('\\&ampersand');
      });

      it('should handle empty string', () => {
        const escaped = escapeMultilineValue('');
        expect(escaped).toBe('');
      });
    });

    describe('generateBibtex with escaping', () => {
      it('should escape special characters in title', () => {
        const fields: BibtexFields = {
          type: 'article',
          key: 'test2024',
          title: 'Testing {Braces} & 100% Coverage',
        };

        const bibtex = generateBibtex(fields);

        expect(bibtex).toContain('\\{Braces\\}');
        expect(bibtex).toContain('\\&');
        expect(bibtex).toContain('100\\%');
      });

      it('should escape special characters in author', () => {
        const fields: BibtexFields = {
          type: 'article',
          key: 'test2024',
          author: 'O\'Brien & Smith',
          title: 'Test',
        };

        const bibtex = generateBibtex(fields);

        expect(bibtex).toContain('\\&');
      });

      it('should use multi-line escaping for abstracts', () => {
        const fields: BibtexFields = {
          type: 'article',
          key: 'test2024',
          title: 'Test',
          abstract: 'Line 1 with {special} chars\nLine 2 with % percent',
        };

        const bibtex = generateBibtex(fields);

        expect(bibtex).toContain('\\{special\\}');
        expect(bibtex).toContain('\\%');
        // The abstract value should be joined into a single line (no embedded newlines)
        const abstractMatch = bibtex.match(/abstract = \{([^}]+)\}/);
        expect(abstractMatch).toBeTruthy();
        const abstractValue = abstractMatch![1];
        expect(abstractValue).not.toContain('\n');
      });

      it('should handle URL with special characters', () => {
        const fields: BibtexFields = {
          type: 'article',
          key: 'test2024',
          title: 'Test',
          url: 'https://example.com/path?param=value&other=123',
        };

        const bibtex = generateBibtex(fields);

        expect(bibtex).toContain('\\&');
      });
    });
  });
});
