import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Initialize when DOM is ready
function initialize() {
  // Get root element
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  console.log('Initializing Ref-Lex popup...');

  // Create React root and render app
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );

  console.log('Ref-Lex popup initialized');
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
