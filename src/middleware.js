import { NextResponse } from 'next/server';

// In-memory store for rate limiting, IP banning, and session tracking
const rateLimitCache = new Map();
const banCache = new Map();
const sessionIpMap = new Map(); // Track UID to IP history

// Configuration
const RATE_LIMIT_MAX_REQUESTS = 50;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const BAN_DURATION_MS = 30 * 60 * 1000; // 30 minutes ban for extreme offenders

export function middleware(request) {
    const { pathname, search } = request.nextUrl;

    // 1. Basic WAF-like protection against malicious patterns
    const suspiciousPatterns = [
        '../', 'etc/passwd', 'win.ini', '.env', 'select ', 'insert ', 'delete ', 'drop ', 'union ', 'sleep(', 'benchmark('
    ];
    const lowerPath = pathname.toLowerCase() + search.toLowerCase();
    if (suspiciousPatterns.some(p => lowerPath.includes(p))) {
        console.warn(`[SECURITY] Blocked suspicious request: ${pathname}${search}`);
        return new NextResponse('Blocked by security policy.', { status: 403 });
    }

    // Detect common VPN/Proxy headers
    const vpnHeaders = [
        'via', 'x-real-ip', 'proxy-connection', 'forwarded', 'x-forwarded-for'
    ];
    const hasVpnHeaders = vpnHeaders.some(h => request.headers.has(h));

    // Fingerprinting
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'ua';

    // Only rate limit API routes
    const isApi = pathname.startsWith('/api');
    if (!isApi) return NextResponse.next();

    // Determine path-specific rate limit
    let maxRequests = RATE_LIMIT_MAX_REQUESTS;
    if (pathname.includes('/assistant') || pathname.includes('/copilot')) maxRequests = 10;
    if (pathname.includes('/notifications/')) maxRequests = 5;
    if (pathname.includes('/auth/') || pathname.includes('/upload')) maxRequests = 20;

    // Pattern Recognition: Detect rapid IP shifting for the same "User-Agent Fingerprint"
    // This catches rotating VPNs/Proxies used for botting
    const now = Date.now();

    const fingerprint = `${pathname}|${ip}|${userAgent.substring(0, 50)}`;

    // Check for active ban
    if (banCache.has(ip) && now < banCache.get(ip)) {
        return new NextResponse('Access restricted due to excessive requests.', { status: 403 });
    }

    // Rate limiting logic
    if (!rateLimitCache.has(fingerprint)) {
        rateLimitCache.set(fingerprint, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    } else {
        const data = rateLimitCache.get(fingerprint);
        if (now > data.resetTime) {
            rateLimitCache.set(fingerprint, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        } else {
            data.count += 1;

            // Apply stricter limits if VPN headers are detected
            const actualLimit = hasVpnHeaders ? maxRequests / 2 : maxRequests;

            if (data.count > actualLimit * 5) { // Extreme abuse
                banCache.set(ip, now + BAN_DURATION_MS);
                console.error(`[SECURITY] IP BANNED: ${ip} for extreme flooding on ${pathname}`);
            }
            if (data.count > actualLimit) {
                return new NextResponse('Too Many Requests.', { status: 429 });
            }
            rateLimitCache.set(fingerprint, data);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
