import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUploadsDir } from './uploadsDir';
import path from 'path';
import fs from 'fs';

vi.mock('fs');
vi.mock('os', () => ({
  default: {
    homedir: () => '/home/user',
    userInfo: () => ({ homedir: '/home/user' })
  }
}));

describe('Uploads Directory Utility', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.UPLOADS_DIR = '';
  });

  it('should return UPLOADS_DIR if environment variable is set', () => {
    process.env.UPLOADS_DIR = '/custom/path';
    expect(getUploadsDir()).toBe('/custom/path');
  });

  it('should check multiple fallback locations', () => {
    const existsSpy = vi.spyOn(fs, 'existsSync');
    existsSpy.mockReturnValue(false);

    // It should check many paths then fallback to public/uploads
    getUploadsDir();
    expect(existsSpy).toHaveBeenCalled();
  });

  it('should return home directory path if it exists', () => {
    const existsSpy = vi.spyOn(fs, 'existsSync');
    existsSpy.mockImplementation((p) => p === path.join('/home/user', 'user-uploads'));

    expect(getUploadsDir()).toBe(path.join('/home/user', 'user-uploads'));
  });
});
