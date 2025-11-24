// Detector registry for academic paper detection

import { PaperMetadata, Detector } from '../../shared/types';
import { logger } from '../../shared/logger';
import { detectArxiv } from './arxiv';
import { detectScholar } from './scholar';
import { detectPubmed } from './pubmed';
import { detectIeee } from './ieee';
import { detectAcm } from './acm';
import { detectSpringer } from './springer';
import { detectScienceDirect } from './sciencedirect';
import { detectJstor } from './jstor';
import { detectGeneric } from './generic';

// Registry of all detectors
// Order matters: specialized detectors first, generic last
const detectors: Detector[] = [
  detectArxiv,
  detectScholar,
  detectPubmed,
  detectIeee,
  detectAcm,
  detectSpringer,
  detectScienceDirect,
  detectJstor,
];

// Detect paper from current page
export async function detectPaper(): Promise<PaperMetadata | null> {
  logger.debug('Attempting to detect paper on:', window.location.href);

  // Try specialized detectors first
  for (const detector of detectors) {
    try {
      const result = await detector();
      if (result) {
        logger.debug('Paper detected by detector:', result.source);
        return result;
      }
    } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logger.warn('Detector failed:', error);
    }
  }

  // Fallback to generic detector
  logger.debug('Trying generic detector');
  return detectGeneric();
}
