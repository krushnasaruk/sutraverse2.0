process.env.NO_GCE_CHECK = 'true';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            try {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
            } catch (e) {
                console.error('Failed to initialize Firebase Admin with FIREBASE_SERVICE_ACCOUNT env var:', e);
            }
        }

        if (!admin.apps.length && process.env.NODE_ENV !== 'production') {
            const files = fs.readdirSync(process.cwd());
            const keyFile = files.find(f => f.startsWith('sutraverse2-firebase-adminsdk-') && f.endsWith('.json'));
            if (keyFile) {
                const keyPath = path.join(process.cwd(), keyFile);
                console.warn(`WARNING: Loading Firebase Service Account credential file: ${keyFile} from disk. This is only safe in development.`);
                const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
            }
        }

        if (!admin.apps.length) {
            // Fallback for default initialization or environment variables setup
            admin.initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sutraverse2",
            });
        }
    } catch (e) {
        console.error('Firebase Admin init failed:', e);
    }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default admin;
