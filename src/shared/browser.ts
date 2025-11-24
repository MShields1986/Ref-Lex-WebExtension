// Browser API wrapper using webextension-polyfill for cross-browser compatibility
import browser from 'webextension-polyfill';

export { browser };

// Re-export commonly used types for convenience
export type Browser = typeof browser;
export type Tabs = typeof browser.tabs;
export type Storage = typeof browser.storage;
export type Runtime = typeof browser.runtime;
export type Cookies = typeof browser.cookies;

// Helper function to check if we're in a browser extension context
export function isExtensionContext(): boolean {
  try {
    return typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined';
  } catch {
    return false;
  }
}

// Helper to get extension ID safely
export function getExtensionId(): string {
  if (!isExtensionContext()) {
    throw new Error('Not in extension context');
  }
  return browser.runtime.id;
}

// Helper to get extension URL
export function getExtensionURL(path: string = ''): string {
  if (!isExtensionContext()) {
    throw new Error('Not in extension context');
  }
  return browser.runtime.getURL(path);
}
