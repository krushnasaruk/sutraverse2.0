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

        // Try to load the Firebase Service Account credential file from disk
        if (!admin.apps.length) {
            try {
                const searchDirs = [process.cwd(), __dirname, path.join(__dirname, '..'), path.join(__dirname, '..', '..')];
                let keyPath = null;
                let keyFile = null;
                for (const dir of searchDirs) {
                    if (fs.existsSync(dir)) {
                        const files = fs.readdirSync(dir);
                        const found = files.find(f => f.startsWith('sutraverse2-firebase-adminsdk-') && f.endsWith('.json'));
                        if (found) {
                            keyFile = found;
                            keyPath = path.join(dir, found);
                            break;
                        }
                    }
                }

                if (keyPath) {
                    console.log(`Loading Firebase Service Account credential file: ${keyFile} from ${keyPath}`);
                    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount)
                    });
                }
            } catch (diskErr) {
                console.warn('Failed to load Firebase service account key from disk:', diskErr.message);
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
