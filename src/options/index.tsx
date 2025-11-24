// Options page entry point - using vanilla JS for simplicity

import { browser } from '../shared/browser';
import { STORAGE_KEYS, DEFAULT_API_BASE_URL } from '../shared/constants';

// Load settings when page loads
document.addEventListener('DOMContentLoaded', async () => {
  const apiUrlInput = document.getElementById('api-url') as HTMLInputElement;
  const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
  const messageDiv = document.getElementById('message') as HTMLDivElement;

  if (!apiUrlInput || !saveBtn || !messageDiv) {
    console.error('Required elements not found');
    return;
  }

  // Load saved settings
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.API_BASE_URL);
    apiUrlInput.value = result[STORAGE_KEYS.API_BASE_URL] || DEFAULT_API_BASE_URL;
  } catch (error) {
    console.error('Failed to load settings:', error);
  }

  // Save settings
  saveBtn.addEventListener('click', async () => {
    const apiUrl = apiUrlInput.value.trim();

    if (!apiUrl) {
      showMessage('Please enter a valid URL', 'error');
      return;
    }

    try {
      await browser.storage.local.set({
        [STORAGE_KEYS.API_BASE_URL]: apiUrl,
      });

      showMessage('Settings saved successfully!', 'success');
    } catch (error) {
      showMessage('Failed to save settings', 'error');
      console.error('Save error:', error);
    }
  });

  function showMessage(text: string, type: 'success' | 'error') {
    messageDiv.textContent = text;
    messageDiv.className = `message message-${type}`;

    setTimeout(() => {
      messageDiv.textContent = '';
      messageDiv.className = '';
    }, 3000);
  }
});
