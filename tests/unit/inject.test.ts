import { jest } from '@jest/globals';

// Mock browser API
const mockBrowser = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
  },
};

// Mock detectPaper function
const mockDetectPaper = jest.fn();

jest.mock('../../src/shared/browser', () => ({
  browser: mockBrowser,
}));

jest.mock('../../src/content/detectors', () => ({
  detectPaper: mockDetectPaper,
}));

import { PaperMetadata } from '../../src/shared/types';

describe('Content Script (inject.ts)', () => {
  let messageListener: (message: unknown, sender: unknown) => Promise<unknown>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Capture the message listener when module loads
    mockBrowser.runtime.onMessage.addListener.mockImplementation((handler) => {
      messageListener = handler;
    });
  });

  describe('initialize', () => {
    it('should detect paper and send PAPER_DETECTED message', async () => {
      const mockPaper: PaperMetadata = {
        title: 'Test Paper',
        authors: ['Author 1', 'Author 2'],
        year: '2024',
        doi: '10.1234/test',
        url: 'https://example.com/paper',
        source: 'arxiv',
      };

      mockDetectPaper.mockResolvedValue(mockPaper);
      mockBrowser.runtime.sendMessage.mockResolvedValue({ success: true });

      // Import after mocks are set up
      const { initialize } = await import('../../src/content/inject');

      await initialize();

      expect(mockDetectPaper).toHaveBeenCalled();
      expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'PAPER_DETECTED',
        payload: mockPaper,
      });
      expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'UPDATE_BADGE',
        payload: { text: '1', color: '#89b4fa' },
      });
    });

    it('should handle no paper detected', async () => {
      mockDetectPaper.mockResolvedValue(null);

      const { initialize } = await import('../../src/content/inject');

      await initialize();

      expect(mockDetectPaper).toHaveBeenCalled();
      expect(mockBrowser.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle detection errors gracefully', async () => {
      mockDetectPaper.mockRejectedValue(new Error('Detection failed'));

      const { initialize } = await import('../../src/content/inject');

      await expect(initialize()).resolves.not.toThrow();
      expect(mockDetectPaper).toHaveBeenCalled();
    });

    it('should continue if badge update fails', async () => {
      const mockPaper: PaperMetadata = {
        title: 'Test Paper',
        authors: ['Author 1'],
        year: '2024',
        source: 'generic',
      };

      mockDetectPaper.mockResolvedValue(mockPaper);
      mockBrowser.runtime.sendMessage
        .mockResolvedValueOnce({ success: true }) // PAPER_DETECTED succeeds
        .mockRejectedValueOnce(new Error('Badge update failed')); // UPDATE_BADGE fails

      const { initialize } = await import('../../src/content/inject');

      await expect(initialize()).resolves.not.toThrow();
      expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('Message Listener', () => {
    it('should respond to GET_DETECTED_PAPER message', async () => {
      const mockPaper: PaperMetadata = {
        title: 'Test Paper',
        authors: ['Author 1'],
        year: '2024',
        source: 'generic',
      };

      mockDetectPaper.mockResolvedValue(mockPaper);
      mockBrowser.runtime.sendMessage.mockResolvedValue({ success: true });

      // Import module to set up listener
      await import('../../src/content/inject');

      // Initialize to detect paper
      const { initialize } = await import('../../src/content/inject');
      await initialize();

      // Send GET_DETECTED_PAPER message
      const response = await messageListener(
        { type: 'GET_DETECTED_PAPER' },
        {}
      );

      expect(response).toEqual({
        success: true,
        data: mockPaper,
      });
    });

    it('should respond to REDETECT_PAPER message', async () => {
      const mockPaper: PaperMetadata = {
        title: 'Redetected Paper',
        authors: ['Author 1'],
        year: '2024',
        source: 'generic',
      };

      mockDetectPaper.mockResolvedValue(mockPaper);
      mockBrowser.runtime.sendMessage.mockResolvedValue({ success: true });

      // Import module to set up listener
      await import('../../src/content/inject');

      // Send REDETECT_PAPER message
      const response = await messageListener({ type: 'REDETECT_PAPER' }, {});

      expect(response).toEqual({
        success: true,
        data: mockPaper,
      });
      expect(mockDetectPaper).toHaveBeenCalled();
    });

    it('should return failure for unknown message type', async () => {
      // Import module to set up listener
      await import('../../src/content/inject');

      const response = await messageListener({ type: 'UNKNOWN_TYPE' }, {});

      expect(response).toEqual({ success: false });
    });
  });

  describe('Paper Detection', () => {
    it('should store detected paper for later retrieval', async () => {
      const mockPaper: PaperMetadata = {
        title: 'Stored Paper',
        authors: ['Author 1', 'Author 2'],
        year: '2024',
        doi: '10.1234/stored',
        url: 'https://example.com',
        abstract: 'Test abstract',
        source: 'arxiv',
      };

      mockDetectPaper.mockResolvedValue(mockPaper);
      mockBrowser.runtime.sendMessage.mockResolvedValue({ success: true });

      const { initialize } = await import('../../src/content/inject');
      await initialize();

      // Import module to set up listener
      await import('../../src/content/inject');

      // Retrieve the stored paper
      const response = await messageListener(
        { type: 'GET_DETECTED_PAPER' },
        {}
      );

      expect(response).toEqual({
        success: true,
        data: mockPaper,
      });
    });

    it('should update stored paper when redetecting', async () => {
      const firstPaper: PaperMetadata = {
        title: 'First Paper',
        authors: ['Author 1'],
        year: '2024',
        source: 'generic',
      };

      const secondPaper: PaperMetadata = {
        title: 'Second Paper',
        authors: ['Author 2'],
        year: '2024',
        source: 'arxiv',
      };

      mockDetectPaper
        .mockResolvedValueOnce(firstPaper)
        .mockResolvedValueOnce(secondPaper);
      mockBrowser.runtime.sendMessage.mockResolvedValue({ success: true });

      const { initialize } = await import('../../src/content/inject');

      // First detection
      await initialize();

      // Import module to set up listener
      await import('../../src/content/inject');

      // Redetect
      const response = await messageListener({ type: 'REDETECT_PAPER' }, {});

      expect(response).toEqual({
        success: true,
        data: secondPaper,
      });
      expect(mockDetectPaper).toHaveBeenCalledTimes(2);
    });
  });

  describe('Badge Updates', () => {
    it('should update badge with correct color and text', async () => {
      const mockPaper: PaperMetadata = {
        title: 'Test Paper',
        authors: ['Author 1'],
        year: '2024',
        source: 'generic',
      };

      mockDetectPaper.mockResolvedValue(mockPaper);
      mockBrowser.runtime.sendMessage.mockResolvedValue({ success: true });

      const { initialize } = await import('../../src/content/inject');
      await initialize();

      expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'UPDATE_BADGE',
        payload: { text: '1', color: '#89b4fa' },
      });
    });

    it('should not update badge when no paper detected', async () => {
      mockDetectPaper.mockResolvedValue(null);

      const { initialize } = await import('../../src/content/inject');
      await initialize();

      expect(mockBrowser.runtime.sendMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UPDATE_BADGE',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle sendMessage failure gracefully', async () => {
      const mockPaper: PaperMetadata = {
        title: 'Test Paper',
        authors: ['Author 1'],
        year: '2024',
        source: 'generic',
      };

      mockDetectPaper.mockResolvedValue(mockPaper);
      mockBrowser.runtime.sendMessage.mockRejectedValue(
        new Error('Message send failed')
      );

      const { initialize } = await import('../../src/content/inject');

      await expect(initialize()).resolves.not.toThrow();
    });

    it('should handle null paper gracefully', async () => {
      mockDetectPaper.mockResolvedValue(null);

      const { initialize } = await import('../../src/content/inject');

      await expect(initialize()).resolves.not.toThrow();

      // Import module to set up listener
      await import('../../src/content/inject');

      const response = await messageListener(
        { type: 'GET_DETECTED_PAPER' },
        {}
      );

      expect(response).toEqual({
        success: true,
        data: null,
      });
    });
  });
});
