import { initializeApp, getApps } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Fail loudly if critical Firebase config is missing instead of silently using stale defaults
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    'FATAL: Missing critical Firebase environment variables (NEXT_PUBLIC_FIREBASE_API_KEY / NEXT_PUBLIC_FIREBASE_PROJECT_ID). ' +
    'Set them in your .env.local file.'
  );
}

let app;
let auth;
let googleProvider;
let db;
let storage;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

  // Initialize App Check (Only in browser)
  if (typeof window !== 'undefined') {
    try {
      const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (recaptchaKey) {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(recaptchaKey),
          isTokenAutoRefreshEnabled: true
        });
      }
    } catch (e) {
      console.warn("Failed to initialize App Check", e);
    }
  }
  auth = getAuth(app);
  // Ensure auth state persists across page refreshes
  if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence).catch(console.warn);
  }
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  // Initialize Firestore with offline persistence for fast cached reads
  if (typeof window !== 'undefined') {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } else {
    // Prevent SSR memory leaks by using a clean Firestore instance on the server
    const { getFirestore } = require('firebase/firestore');
    db = getFirestore(app);
  }

  // Suppress Firebase SDK internal connection warning logs (errors will still log)
  try {
    setLogLevel('error');
  } catch (e) {
    // Silently ignore if setLogLevel fails or is not available
  }

  storage = getStorage(app);
} catch (error) {
  // If Firestore was already initialized (HMR), fall back to getFirestore
  if (error.code === 'failed-precondition' || error.message?.includes('already been called')) {
    const { getFirestore } = require('firebase/firestore');
    db = getFirestore(app);
    storage = getStorage(app);
  } else {
    console.warn('Firebase initialization failed:', error.message);
  }
}

export { auth, googleProvider, db, storage };
export default app;
