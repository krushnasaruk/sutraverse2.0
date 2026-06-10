import { initializeApp, getApps } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCKWoYmyjRcdmqnaHerEHCr9ScNmXNBets",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sutraverse2.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sutraverse2",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sutraverse2.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "666020084296",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:666020084296:web:0dd52b77ce6a245253b67d",
};

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
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });

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
