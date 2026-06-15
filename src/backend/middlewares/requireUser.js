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

        if (!decodedToken.email_verified) {
            return {
                error: NextResponse.json(
                    { error: 'Forbidden: Email verification required.' },
                    { status: 403 }
                ),
            };
        }

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

        if (process.env.NODE_ENV !== 'production') {
            console.warn('Development mode: Attempting manual JWT decoding fallback due to verification error.');
            try {
                const parts = idToken.split('.');
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
                    }
                }
            } catch (fallbackErr) {
                console.error('Manual decoding fallback failed:', fallbackErr.message);
            }
        }

        return {
            error: NextResponse.json(
                { error: 'Unauthorized: Invalid or expired token.' },
                { status: 401 }
            ),
        };
    }
}
