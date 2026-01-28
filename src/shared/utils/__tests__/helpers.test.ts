import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractTextFromImage } from '../helpers';

// Mock Tesseract.js
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(() => ({
    recognize: vi.fn(() => Promise.resolve({ data: { text: 'Extracted text from image' } })),
    terminate: vi.fn(() => Promise.resolve()),
  })),
}));

describe('OCR Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractTextFromImage', () => {
    it('should extract text from a valid image file', async () => {
      const mockFile = new File(['fake image content'], 'test.png', { type: 'image/png' });

      const result = await extractTextFromImage(mockFile);

      expect(result).toBe('Extracted text from image');
    });

    it('should extract text from a valid image URL', async () => {
      const mockUrl = 'https://example.com/image.png';

      const result = await extractTextFromImage(mockUrl);

      expect(result).toBe('Extracted text from image');
    });

    it('should handle OCR processing errors', async () => {
      const { createWorker } = await import('tesseract.js');
      const mockWorker = {
        recognize: vi.fn(() => Promise.reject(new Error('OCR failed'))),
        terminate: vi.fn(() => Promise.resolve()),
      };
      (createWorker as any).mockResolvedValue(mockWorker);

      const mockFile = new File(['fake image content'], 'test.png', { type: 'image/png' });

      await expect(extractTextFromImage(mockFile)).rejects.toThrow('Failed to extract text from image');
    });

    it('should terminate the worker after processing', async () => {
      const { createWorker } = await import('tesseract.js');
      const mockTerminate = vi.fn(() => Promise.resolve());
      const mockWorker = {
        recognize: vi.fn(() => Promise.resolve({ data: { text: 'test' } })),
        terminate: mockTerminate,
      };
      (createWorker as any).mockResolvedValue(mockWorker);

      const mockFile = new File(['fake image content'], 'test.png', { type: 'image/png' });

      await extractTextFromImage(mockFile);

      expect(mockTerminate).toHaveBeenCalled();
    });
  });
});
