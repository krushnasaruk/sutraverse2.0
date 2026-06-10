import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

if (!admin.apps.length) {
    try {
        const keyPath = path.join(process.cwd(), 'sutraverse2-firebase-adminsdk-fbsvc-de34e6d305.json');
        if (fs.existsSync(keyPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            // Check fallback path (for different server structures or subdirectories)
            const fallbackKeyPath = path.join(process.cwd(), '..', 'sutraverse2-firebase-adminsdk-fbsvc-de34e6d305.json');
            if (fs.existsSync(fallbackKeyPath)) {
                const serviceAccount = JSON.parse(fs.readFileSync(fallbackKeyPath, 'utf8'));
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
            } else {
                // Fallback for environment variables setup
                admin.initializeApp({
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sutraverse2",
                });
            }
        }
    } catch (e) {
        console.error('Firebase Admin init failed:', e);
    }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default admin;
