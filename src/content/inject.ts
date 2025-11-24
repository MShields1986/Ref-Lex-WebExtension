// Main content script - runs on all pages to detect academic papers

import { browser } from '../shared/browser';
import { PaperMetadata } from '../shared/types';
import { detectPaper } from './detectors';
import { logger } from '../shared/logger';
import { debounceAsync } from '../shared/utils';

logger.debug('Content script loaded on:', window.location.href);

// Detect paper when page loads
let detectedPaper: PaperMetadata | null = null;

// Run detection on page load
async function initialize() {
  try {
    detectedPaper = await detectPaper();

    if (detectedPaper) {
      logger.debug('Paper detected:', detectedPaper);

      // Store detected paper in background for popup to access
      await browser.runtime.sendMessage({
        type: 'PAPER_DETECTED',
        payload: detectedPaper,
      });

      // Update extension icon badge to indicate paper detected
      try {
        await browser.runtime.sendMessage({
          type: 'UPDATE_BADGE',
          payload: { text: '1', color: '#89b4fa' },
        });
      } catch (error) {
        // Badge update might fail in some browsers, ignore
        logger.warn('Could not update badge:', error);
      }
    } else {
      logger.debug('No paper detected on this page');
    }
  } catch (error) {
    logger.error('Error detecting paper:', error);
  }
}

// Create debounced version for re-detection (e.g., on SPA navigation)
const debouncedInitialize = debounceAsync(initialize, 500);

// Initialize when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // DOM is already loaded
  initialize();
}

// Listen for URL changes (for single-page applications)
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    logger.debug('URL changed, redetecting paper:', currentUrl);
    // Use debounced version for SPA navigation
    debouncedInitialize().catch((error) => {
      logger.error('Error redetecting paper:', error);
    });
  }
}).observe(document, { subtree: true, childList: true });

// Listen for messages from popup or background
browser.runtime.onMessage.addListener((message, _sender) => {
  if (message.type === 'GET_DETECTED_PAPER') {
    return Promise.resolve({
      success: true,
      data: detectedPaper,
    });
  }

  if (message.type === 'REDETECT_PAPER') {
    return initialize().then(() => ({
      success: true,
      data: detectedPaper,
    }));
  }

  return Promise.resolve({ success: false });
});

// Export for testing
export { detectedPaper, initialize };
