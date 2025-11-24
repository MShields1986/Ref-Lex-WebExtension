// ArXiv paper detector

import { PaperMetadata } from '../../shared/types';
import { extractArxivIdFromUrl } from '../../shared/utils';
import { generateBibtex, generateBibtexKey } from '../bibtex-generator';
import { logger } from '../../shared/logger';

export async function detectArxiv(): Promise<PaperMetadata | null> {
  if (!window.location.hostname.includes('arxiv.org')) {
    return null;
  }

  // Extract ArXiv ID from URL
  const arxivId = extractArxivIdFromUrl(window.location.href);
  if (!arxivId) {
    return null;
  }

  logger.debug('ArXiv: Detected ArXiv ID:', arxivId);

  // Scrape metadata from page
  const titleEl = document.querySelector('h1.title');
  const title = titleEl?.textContent?.replace('Title:', '').trim();

  const authorsEls = document.querySelectorAll('.authors a');
  const authors = Array.from(authorsEls)
    .map((a) => a.textContent?.trim())
    .filter(Boolean) as string[];

  const abstractEl = document.querySelector('.abstract');
  const abstract = abstractEl?.textContent?.replace('Abstract:', '').trim();

  // Extract DOI if present (arXiv shows DOI in the metadata table)
  let doi: string | undefined;
  const doiLink = document.querySelector('a[href*="doi.org"]');
  if (doiLink) {
    const doiMatch = doiLink.getAttribute('href')?.match(/doi\.org\/(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
    doi = doiMatch ? doiMatch[1] : undefined;
  }
  // Also try to find DOI in the page metadata or text
  if (!doi) {
    const metaDoiEl = document.querySelector('meta[name="citation_doi"]');
    doi = metaDoiEl?.getAttribute('content') || undefined;
  }

  // Extract year from ArXiv ID (format: YYMM.##### or YYYYMM.#####)
  let year: string | undefined;
  if (arxivId.length >= 4) {
    const yearPrefix = arxivId.substring(0, 2);
    // If it starts with 20+ years (like 24 for 2024), assume 20YY format
    year = parseInt(yearPrefix) >= 90 ? `19${yearPrefix}` : `20${yearPrefix}`;
  }

  // Try to fetch BibTeX from ArXiv
  let bibtexRaw: string | undefined;
  try {
    const response = await fetch(`https://arxiv.org/bibtex/${arxivId}`);
    if (response.ok) {
      bibtexRaw = await response.text();
      logger.debug('ArXiv: Fetched BibTeX from ArXiv API');

      // If we have a DOI and the fetched BibTeX doesn't include it, add it
      if (doi && bibtexRaw && !bibtexRaw.toLowerCase().includes('doi')) {
        // Insert DOI field before the closing brace
        const lastBraceIndex = bibtexRaw.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
          const beforeBrace = bibtexRaw.substring(0, lastBraceIndex);
          const afterBrace = bibtexRaw.substring(lastBraceIndex);
          // Add comma after last field if not present
          const needsComma = beforeBrace.trim().endsWith(',') ? '' : ',';
          bibtexRaw = `${beforeBrace}${needsComma}\n      doi={${doi}}${afterBrace}`;
          logger.debug('ArXiv: Added DOI to fetched BibTeX');
        }
      }
    }
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger.warn('ArXiv: Failed to fetch BibTeX:', error);
  }

  // Generate BibTeX if fetch failed
  if (!bibtexRaw && title && authors.length > 0) {
    const key = generateBibtexKey({ authors, year, title });
    bibtexRaw = generateBibtex({
      type: 'article',
      key,
      title,
      author: authors.join(' and '),
      year,
      eprint: arxivId,
      archivePrefix: 'arXiv',
      doi,
      url: window.location.href,
      abstract,
    });
    logger.debug('ArXiv: Generated BibTeX locally');
  }

  return {
    title,
    authors,
    year,
    doi,
    url: window.location.href,
    abstract,
    bibtexRaw,
    source: 'arxiv',
  };
}
