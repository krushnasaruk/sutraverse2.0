import { NextResponse } from 'next/server';

// In-memory store for rate limiting
const rateLimitCache = new Map();

// Configuration
const RATE_LIMIT_MAX_REQUESTS = 50; // Strict limit: 50 requests
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Only rate limit API routes and sensitive POST requests to prevent white screens from blocked internal Next.js requests
    const isApi = pathname.startsWith('/api');
    
    if (!isApi) {
        return NextResponse.next();
    }

    // Extract headers to build a fingerprint to catch rotating IPs
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown-ip';
    const userAgent = request.headers.get('user-agent') || 'unknown-ua';
    const acceptLanguage = request.headers.get('accept-language') || 'unknown-lang';
    
    // Fingerprint blocks the exact same script signature from hitting the same path
    const fingerprint = `${pathname}|${ip}|${userAgent}|${acceptLanguage}`;

    const now = Date.now();
    
    // Clean up memory occasionally
    if (Math.random() < 0.05) {
        for (const [key, value] of rateLimitCache.entries()) {
            if (now > value.resetTime) {
                rateLimitCache.delete(key);
            }
        }
    }
    
    if (!rateLimitCache.has(fingerprint)) {
        rateLimitCache.set(fingerprint, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    } else {
        const data = rateLimitCache.get(fingerprint);
        
        if (now > data.resetTime) {
            // Window expired, reset
            rateLimitCache.set(fingerprint, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        } else {
            // Increment count
            data.count += 1;
            
            if (data.count > RATE_LIMIT_MAX_REQUESTS) {
                console.warn(`Rate limit exceeded for pattern: ${fingerprint}`);
                return new NextResponse('Too Many Requests. Please try again later.', { 
                    status: 429,
                    headers: {
                        'Retry-After': Math.ceil((data.resetTime - now) / 1000).toString()
                    }
                });
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
