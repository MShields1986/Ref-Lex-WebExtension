// PubMed paper detector

import { PaperMetadata } from '../../shared/types';
import { logger } from '../../shared/logger';
import { extractDoi } from '../../shared/utils';
import { generateBibtexFromMetadata } from '../bibtex-generator';

export async function detectPubmed(): Promise<PaperMetadata | null> {
  if (!window.location.hostname.includes('pubmed.ncbi.nlm.nih.gov')) {
    return null;
  }

  logger.debug('Detecting paper on PubMed');

  // Helper to get meta tag content
  function getMeta(name: string): string | null {
    const selectors = [
      `meta[name="${name}"]`,
      `meta[property="${name}"]`,
      `meta[name="citation_${name}"]`,
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const content = el?.getAttribute('content');
      if (content) return content;
    }
    return null;
  }

  // PubMed uses citation meta tags
  const title = getMeta('citation_title');

  if (!title) {
    logger.debug('No title found');
    return null;
  }

  // Extract authors from citation_author tags
  const authorElements = document.querySelectorAll('meta[name="citation_author"]');
  const authors = Array.from(authorElements)
    .map((el) => el.getAttribute('content'))
    .filter(Boolean) as string[];

  // Extract publication date
  const dateMeta = getMeta('citation_publication_date');
  const year = dateMeta?.substring(0, 4);

  // Extract DOI
  const doi = getMeta('citation_doi') || extractDoi(document.body.textContent || '');

  // Extract journal
  const journal = getMeta('citation_journal_title');

  // Extract volume and issue
  const volume = getMeta('citation_volume');

  // Extract pages
  const firstPage = getMeta('citation_firstpage');
  const lastPage = getMeta('citation_lastpage');
  const pages = firstPage && lastPage ? `${firstPage}--${lastPage}` : null;

  // Extract PMID (PubMed ID)
  const pmid = getMeta('citation_pmid');

  // Extract abstract from page
  const abstractEl = document.querySelector('.abstract-content');
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

    // Add PMID as a note field
    if (pmid) {
      metadata.note = `PMID: ${pmid}`;
    }

    bibtexRaw = generateBibtexFromMetadata(metadata);
    logger.debug('Generated BibTeX from metadata');
  }

  logger.debug('Paper detected:', { title, authors, year, doi, pmid });

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
    source: 'pubmed',
  };
}
