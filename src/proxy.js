import { NextResponse } from 'next/server';

// In-memory store for rate limiting (per edge isolate)
const rateLimit = new Map();

// Configuration
const RATE_LIMIT_MAX = 60; // Max requests
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

export function proxy(request) {
    // 1. IP Ban check (Placeholder for future database integration)
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    
    // 2. Rate Limiting Logic
    const now = Date.now();
    
    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    } else {
        const data = rateLimit.get(ip);
        
        if (now > data.resetTime) {
            // Window expired, reset
            rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        } else {
            // Increment count
            data.count += 1;
            
            if (data.count > RATE_LIMIT_MAX) {
                return new NextResponse('Too Many Requests. Please try again later.', { 
                    status: 429,
                    headers: {
                        'Retry-After': Math.ceil((data.resetTime - now) / 1000).toString()
                    }
                });
            }
            rateLimit.set(ip, data);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes) -> We might want to rate limit APIs actually, so let's include them.
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
