import { describe, it, expect, vi } from 'vitest';
import { filterAvailableFiles } from './verifyFiles';

global.fetch = vi.fn();

describe('File Verification Utility', () => {
  it('should return empty array if input is empty', async () => {
    const result = await filterAvailableFiles([]);
    expect(result).toEqual([]);
  });

  it('should always include firebase storage files', async () => {
    const files = [
      { fileURL: 'https://firebasestorage.googleapis.com/v0/b/test.appspot.com/o/file1.pdf' },
      { fileURL: '/api/downloads/local1.pdf' }
    ];

    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ available: [] })
    });

    const result = await filterAvailableFiles(files);
    expect(result).toHaveLength(1);
    expect(result[0].fileURL).toContain('firebasestorage');
  });

  it('should filter local files based on API response', async () => {
    const files = [
      { fileURL: '/api/downloads/exists.pdf' },
      { fileURL: '/api/downloads/missing.pdf' }
    ];

    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ available: ['/api/downloads/exists.pdf'] })
    });

    const result = await filterAvailableFiles(files);
    expect(result).toHaveLength(1);
    expect(result[0].fileURL).toBe('/api/downloads/exists.pdf');
  });

  it('should return all files if API fails', async () => {
    const files = [{ fileURL: '/api/downloads/file.pdf' }];
    fetch.mockResolvedValue({ ok: false });

    const result = await filterAvailableFiles(files);
    expect(result).toHaveLength(1);
  });
});
