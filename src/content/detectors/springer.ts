// SpringerLink paper detector

import { PaperMetadata } from '../../shared/types';
import { logger } from '../../shared/logger';
import { extractDoi } from '../../shared/utils';
import { generateBibtexFromMetadata } from '../bibtex-generator';

export async function detectSpringer(): Promise<PaperMetadata | null> {
  if (!window.location.hostname.includes('link.springer.com')) {
    return null;
  }

  logger.debug('Detecting paper on SpringerLink');

  // Helper to get meta tag content
  function getMeta(name: string): string | null {
    const selectors = [
      `meta[name="${name}"]`,
      `meta[property="${name}"]`,
      `meta[name="citation_${name}"]`,
      `meta[name="dc.${name}"]`,
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const content = el?.getAttribute('content');
      if (content) return content;
    }
    return null;
  }

  // SpringerLink uses citation meta tags
  const title = getMeta('citation_title') || getMeta('dc.title');

  if (!title) {
    logger.debug('No title found');
    return null;
  }

  // Extract authors from citation_author tags
  const authorElements = document.querySelectorAll('meta[name="citation_author"]');
  const authors = Array.from(authorElements)
    .map((el) => el.getAttribute('content'))
    .filter(Boolean) as string[];

  // Fallback to dc.creator if no citation_author
  if (authors.length === 0) {
    const dcCreator = getMeta('dc.creator');
    if (dcCreator) {
      authors.push(...dcCreator.split(';').map(a => a.trim()).filter(Boolean));
    }
  }

  // Extract publication date
  const dateMeta = getMeta('citation_publication_date') ||
                   getMeta('citation_online_date') ||
                   getMeta('dc.date');
  const year = dateMeta?.substring(0, 4);

  // Extract DOI
  const doi = getMeta('citation_doi') ||
              getMeta('dc.identifier') ||
              extractDoi(document.body.textContent || '');

  // Extract journal or book title
  const journal =
    getMeta('citation_journal_title') ||
    getMeta('citation_book_title') ||
    getMeta('dc.source');

  // Extract publisher
  const publisher = getMeta('citation_publisher') || getMeta('dc.publisher');

  // Extract volume and issue
  const volume = getMeta('citation_volume');

  // Extract pages
  const firstPage = getMeta('citation_firstpage');
  const lastPage = getMeta('citation_lastpage');
  const pages = firstPage && lastPage ? `${firstPage}--${lastPage}` : null;

  // Extract abstract from page
  const abstractEl = document.querySelector('#Abs1-content') ||
                     document.querySelector('.c-article-section__content') ||
                     document.querySelector('section[data-title="Abstract"] p');
  const abstract = abstractEl?.textContent?.trim();

  // PDF URL
  const pdfUrl = getMeta('citation_pdf_url');

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
    const metadata: Record<string, unknown> = {
      title,
      authors,
      year: year || undefined,
      journal: journal || undefined,
      volume: volume || undefined,
      pages: pages || undefined,
      doi: doi || undefined,
      url: pdfUrl || url,
      abstract: abstract || undefined,
    };

    // Add publisher if available
    if (publisher) {
      metadata.publisher = publisher;
    }

    bibtexRaw = generateBibtexFromMetadata(metadata);
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
    source: 'springer',
  };
}
