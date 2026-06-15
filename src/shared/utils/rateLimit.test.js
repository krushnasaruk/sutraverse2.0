import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimiter } from './rateLimit';

describe('Rate Limiter Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should allow requests within the limit', () => {
    const ip = '1.2.3.4';
    const result = rateLimiter(ip, 2, 1000);
    expect(result.success).toBe(true);

    const result2 = rateLimiter(ip, 2, 1000);
    expect(result2.success).toBe(true);
  });

  it('should block requests exceeding the limit', () => {
    const ip = '1.2.3.5';
    rateLimiter(ip, 1, 1000);
    rateLimiter(ip, 1, 1000);
    const result = rateLimiter(ip, 1, 1000);
    expect(result.success).toBe(false);
    expect(result.banned).toBe(false);
  });

  it('should reset after the window expires', () => {
    const ip = '1.2.3.6';
    rateLimiter(ip, 1, 1000);
    rateLimiter(ip, 1, 1000); // blocked

    vi.advanceTimersByTime(1001);

    const result = rateLimiter(ip, 1, 1000);
    expect(result.success).toBe(true);
  });

  it('should ban IP if threshold is exceeded', () => {
    const ip = '1.2.3.7';
    // limit 2, ban threshold 3
    rateLimiter(ip, 2, 1000, 3); // count 1
    rateLimiter(ip, 2, 1000, 3); // count 2
    rateLimiter(ip, 2, 1000, 3); // count 3
    const result = rateLimiter(ip, 2, 1000, 3); // count 4 -> ban

    expect(result.success).toBe(false);
    expect(result.banned).toBe(true);
    expect(result.remainingMinutes).toBe(60);
  });
});
