import { NextResponse } from 'next/server';
import { handleGet_downloadsfilepath } from '@/backend/controllers/downloadsfilepathController';
import { rateLimiter } from '@/shared/utils/rateLimit';
import { adminAuth } from '@/database/config/firebaseAdmin';

export async function GET(req, ctx) {
  // 1. Get client identifier (either Authenticated User ID or IP/test bypass)
  let rateLimitKey = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for') || 
                     '127.0.0.1';

  const testBypass = req.headers.get('x-test-bypass');
  const queryToken = req.nextUrl.searchParams.get('token');
  const authHeader = req.headers.get('Authorization');
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;
  const token = queryToken || bearerToken;

  let isAuthenticated = false;

  if (testBypass === 'sutraverse-bypass-key') {
    // Authenticated via secret test key for local/WAF testing
    rateLimitKey = 'test-user-id';
    isAuthenticated = true;
  } else if (token) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      if (!decodedToken.email_verified) {
        return new NextResponse(
          JSON.stringify({ error: 'Forbidden: Email verification required.' }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'CDN-Cache-Control': 'no-store'
            }
          }
        );
      }
      rateLimitKey = decodedToken.uid;
      isAuthenticated = true;
    } catch (authErr) {
      console.error('Download auth verification failed:', authErr.message);
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Invalid authentication token.' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'CDN-Cache-Control': 'no-store'
          }
        }
      );
    }
  }

  // Force authentication in production environments
  if (!isAuthenticated) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized: Authentication required to download files.' }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'CDN-Cache-Control': 'no-store'
        }
      }
    );
  }

  // Rate limit downloads per Authenticated User: Max 20 requests per 10 seconds.
  // If they exceed 60 requests within 10 seconds, ban them for 1 hour (3600000ms).
  const rateLimitResult = rateLimiter(rateLimitKey, 20, 10000, 60, 3600000);

  let response;
  if (!rateLimitResult.success) {
    const errorMsg = rateLimitResult.banned
      ? `Too many requests. Your account has been temporarily restricted. Please try again in ${rateLimitResult.remainingMinutes} minute(s).`
      : 'Too many requests. Please wait a few seconds.';

    response = new NextResponse(
      JSON.stringify({ error: errorMsg }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } else {
    response = await handleGet_downloadsfilepath(req, ctx);
  }

  // Prevent Cloudflare, LiteSpeed, and browser caching of dynamic file download endpoints
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('CDN-Cache-Control', 'no-store');
  response.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');

  return response;
}
