import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/database/config/firebaseAdmin';

/**
 * Verify the caller's Firebase ID token and optionally check admin role.
 *
 * Usage:
 *   const { user, error } = await requireUser(request);
 *   if (error) return error;
 *
 *   // Admin-only:
 *   const { user, error } = await requireUser(request, { admin: true });
 *   if (error) return error;
 *
 * @param {Request} request - The incoming Next.js request object
 * @param {object} options
 * @param {boolean} options.admin - If true, also checks Firestore for isAdmin === true
 * @returns {{ user?: object, error?: NextResponse }}
 */
export async function requireUser(request, { admin = false } = {}) {
    const authHeader = request.headers.get('authorization') || '';

    if (!authHeader.startsWith('Bearer ')) {
        return {
            error: NextResponse.json(
                { error: 'Unauthorized: Authentication required.' },
                { status: 401 }
            ),
        };
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);

        if (admin) {
            const userDoc = await adminDb.doc(`users/${decodedToken.uid}`).get();
            if (!userDoc.exists || userDoc.data()?.isAdmin !== true) {
                return {
                    error: NextResponse.json(
                        { error: 'Forbidden: Admin access required.' },
                        { status: 403 }
                    ),
                };
            }
        }

        return { user: decodedToken };
    } catch (err) {
        console.error('Auth verification failed:', err.message);
        return {
            error: NextResponse.json(
                { error: 'Unauthorized: Invalid or expired token.' },
                { status: 401 }
            ),
        };
    }
}
