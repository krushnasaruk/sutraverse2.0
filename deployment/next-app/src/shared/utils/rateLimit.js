const rateLimitMap = new Map();

/**
 * Basic, lightweight in-memory rate limiter with temporary IP banning.
 * 
 * @param {string} ip - IP address of the client
 * @param {number} limit - Maximum number of requests allowed in the window
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} banThreshold - Requests threshold to trigger a long-term ban
 * @param {number} banDurationMs - Duration of the ban in milliseconds (default 1 hour)
 * @returns {object} - { success: boolean, banned: boolean, remainingMinutes: number }
 */
export function rateLimiter(ip, limit = 60, windowMs = 60000, banThreshold = 30, banDurationMs = 3600000) {
  const now = Date.now();
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs, bannedUntil: 0 });
    return { success: true, banned: false, remainingMinutes: 0 };
  }

  const rateData = rateLimitMap.get(ip);

  // If currently banned, check if the ban has expired
  if (rateData.bannedUntil && now < rateData.bannedUntil) {
    const remainingMinutes = Math.ceil((rateData.bannedUntil - now) / 60000);
    return { success: false, banned: true, remainingMinutes };
  }

  // If the window has expired, reset the counter and clear expired bans
  if (now > rateData.resetTime) {
    rateData.count = 1;
    rateData.resetTime = now + windowMs;
    rateData.bannedUntil = 0;
    return { success: true, banned: false, remainingMinutes: 0 };
  }

  rateData.count++;

  // Trigger temporary ban if requests exceed extreme spam threshold
  if (rateData.count > banThreshold) {
    rateData.bannedUntil = now + banDurationMs;
    const remainingMinutes = Math.ceil(banDurationMs / 60000);
    return { success: false, banned: true, remainingMinutes };
  }

  if (rateData.count > limit) {
    return { success: false, banned: false, remainingMinutes: 0 };
  }

  return { success: true, banned: false, remainingMinutes: 0 };
}
