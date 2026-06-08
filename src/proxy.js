import { NextResponse } from 'next/server';

// In-memory store for rate limiting (per edge isolate)
const rateLimit = new Map();

// Configuration
const RATE_LIMIT_MAX = 500; // 500 requests per minute
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

export function proxy(request) {
    const { pathname } = request.nextUrl;
    
    // Only rate limit API routes and sensitive paths (like login/signup)
    // Do not rate limit static assets, images, or general page navigation
    const isApi = pathname.startsWith('/api');
    const isSensitive = pathname.startsWith('/login') || pathname.startsWith('/signup');
    
    if (!isApi && !isSensitive) {
        return NextResponse.next();
    }

    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
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
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
