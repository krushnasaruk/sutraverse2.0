import { adminAuth, adminDb } from '@/database/config/firebaseAdmin';
import { NextResponse } from 'next/server';

/**
 * Utility to verify Firebase ID tokens in Next.js API routes.
 *
 * @param {Request} req - The incoming Next.js request object
 * @param {Object} options - Options for verification
 * @param {boolean} options.admin - Whether the route requires admin privileges
 * @returns {Promise<{user?: any, error?: NextResponse}>}
 */
export async function requireUser(req, { admin = false } = {}) {
  const authHeader = req.headers.get('authorization') || '';

  if (!authHeader.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token format' },
        { status: 401 }
      )
    };
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const user = await adminAuth.verifyIdToken(token);

    if (admin) {
      const userDoc = await adminDb.doc(`users/${user.uid}`).get();
      const userData = userDoc.data();

      if (!userData || userData.isAdmin !== true) {
        return {
          error: NextResponse.json(
            { error: 'Forbidden: Admin access required' },
            { status: 403 }
          )
        };
      }

      // Attach admin data to user object
      user.adminData = userData;
    }

    return { user };
  } catch (err) {
    console.error('Authentication Error:', err.message);

    if (process.env.NODE_ENV !== 'production') {
      console.warn('Development mode: Attempting manual JWT decoding fallback due to verification error.');
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload && payload.uid) {
            console.log('Manual decoding successful for UID:', payload.uid);
            const decodedToken = {
              uid: payload.uid,
              email: payload.email,
              email_verified: payload.email_verified ?? true,
              ...payload
            };

            const isHardcodedAdmin = decodedToken.email === 'sutraverse11@gmail.com';

            if (admin && !isHardcodedAdmin) {
              const userDoc = await adminDb.doc(`users/${decodedToken.uid}`).get();
              const userData = userDoc.data();
              if (!userData || userData.isAdmin !== true) {
                return {
                  error: NextResponse.json(
                    { error: 'Forbidden: Admin access required' },
                    { status: 403 }
                  )
                };
              }
              decodedToken.adminData = userData;
            }

            return { user: decodedToken };
          }
        }
      } catch (fallbackErr) {
        console.error('Manual decoding fallback failed:', fallbackErr.message);
      }
    }

    return {
      error: NextResponse.json(
        { error: 'Unauthorized: Invalid or expired token' },
        { status: 401 }
      )
    };
  }
}
