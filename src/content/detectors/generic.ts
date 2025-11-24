// Generic fallback detector using common meta tags

import { PaperMetadata } from '../../shared/types';
import { logger } from '../../shared/logger';
import { extractDoi } from '../../shared/utils';
import { generateBibtexFromMetadata } from '../bibtex-generator';

export async function detectGeneric(): Promise<PaperMetadata | null> {
  logger.debug('Attempting generic detection');

  // Helper to get meta tag content
  function getMeta(name: string): string | null {
    const selectors = [
      `meta[name="${name}"]`,
      `meta[property="${name}"]`,
      `meta[property="og:${name}"]`,
      `meta[name="citation_${name}"]`,
      `meta[name="dc.${name}"]`,
      `meta[name="DC.${name}"]`,
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const content = el?.getAttribute('content');
      if (content) return content;
    }
    return null;
  }

  // Try to extract title
  const title =
    getMeta('title') ||
    getMeta('citation_title') ||
    document.querySelector('h1')?.textContent?.trim() ||
    document.title;

  // Must have at least a title
  if (!title) {
    logger.debug('No title found');
    return null;
  }

  // Extract authors
  const authorMeta =
    getMeta('author') || getMeta('citation_author') || getMeta('DC.creator');
  const authors = authorMeta
    ? authorMeta
        .split(/[,;]/)
        .map((a) => a.trim())
        .filter(Boolean)
    : [];

  // Extract year
  const dateMeta =
    getMeta('publication_date') ||
    getMeta('citation_publication_date') ||
    getMeta('date') ||
    getMeta('DC.date');
  const year = dateMeta?.substring(0, 4);

  // Extract DOI
  const doiMeta = getMeta('doi') || getMeta('citation_doi') || getMeta('DC.identifier');
  const doi = doiMeta || extractDoi(document.body.textContent || '');

  // Extract journal
  const journal =
    getMeta('citation_journal_title') ||
    getMeta('citation_conference_title') ||
    getMeta('DC.source');

  // Extract volume
  const volume = getMeta('citation_volume');

  // Extract pages
  const firstPage = getMeta('citation_firstpage');
  const lastPage = getMeta('citation_lastpage');
  const pages =
    firstPage && lastPage
      ? `${firstPage}--${lastPage}`
      : getMeta('citation_pages');

  // Extract abstract
  const abstract =
    getMeta('description') ||
    getMeta('citation_abstract') ||
    getMeta('DC.description') ||
    document.querySelector('abstract')?.textContent?.trim();

  // URL
  const url = window.location.href;

  // Try to fetch BibTeX from DOI if available
  let bibtexRaw: string | undefined;
  if (doi) {
    try {
      logger.debug('Attempting to fetch BibTeX from DOI:', doi);
      const response = await fetch(`https://doi.org/${doi}`, {
        headers: { Accept: 'application/x-bibtex' },
      });
      if (response.ok) {
        bibtexRaw = await response.text();
        logger.debug('Fetched BibTeX from DOI');
      }
    } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logger.warn('Failed to fetch BibTeX from DOI:', error);
    }
  }

  // Generate BibTeX from metadata if not fetched
  if (!bibtexRaw) {
    bibtexRaw = generateBibtexFromMetadata({
      title,
      authors,
      year: year || undefined,
      journal: journal || undefined,
      volume: volume || undefined,
      pages: pages || undefined,
      doi: doi || undefined,
      url,
      abstract: abstract || undefined,
    });
    logger.debug('Generated BibTeX from metadata');
  }

  logger.debug('Paper detected:', { title, authors, year, doi });

  return {
    title,
    authors,
    year: year || undefined,
    doi: doi || undefined,
    url,
    abstract: abstract || undefined,
    journal: journal || undefined,
    volume: volume || undefined,
    pages: pages || undefined,
    bibtexRaw,
    source: 'generic',
  };
}
