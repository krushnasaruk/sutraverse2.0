process.env.NO_GCE_CHECK = 'true';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

if (!admin.apps.length) {
    try {
        const files = fs.readdirSync(process.cwd());
        const keyFile = files.find(f => f.startsWith('sutraverse2-firebase-adminsdk-') && f.endsWith('.json'));
        if (keyFile) {
            const keyPath = path.join(process.cwd(), keyFile);
            const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            // Check fallback path (for different server structures or subdirectories)
            let fallbackKeyFile = null;
            try {
                const parentFiles = fs.readdirSync(path.join(process.cwd(), '..'));
                fallbackKeyFile = parentFiles.find(f => f.startsWith('sutraverse2-firebase-adminsdk-') && f.endsWith('.json'));
            } catch (err) {}

            if (fallbackKeyFile) {
                const fallbackKeyPath = path.join(process.cwd(), '..', fallbackKeyFile);
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
