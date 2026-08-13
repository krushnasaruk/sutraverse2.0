import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { initializeFirestore, getFirestore, persistentLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCKWoYmyjRcdmqnaHerEHCr9ScNmXNBets",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sutraverse2.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sutraverse2",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sutraverse2.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "666020084296",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:666020084296:web:0dd52b77ce6a245253b67d",
};

// Suppress internal Firestore primary tab lease warnings across multiple browser tabs / HMR
if (typeof window !== 'undefined') {
  const origConsoleError = console.error;
  console.error = function (...args) {
    const str = args.map(a => (a && typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    if (
      str.includes('Failed to obtain primary lease') ||
      str.includes('Backfill Indexes')
    ) {
      return;
    }
    origConsoleError.apply(console, args);
  };
}

let app;
let auth;
let googleProvider;
let db;
let storage;

try {
  const isExistingApp = getApps().length > 0;
  app = isExistingApp ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Ensure auth state persists across page refreshes
  if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence).catch(console.warn);
  }
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  // Initialize Firestore with single-tab local cache
  if (typeof window !== 'undefined') {
    if (isExistingApp) {
      db = getFirestore(app);
    } else {
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache()
        });
      } catch (e) {
        db = getFirestore(app);
      }
    }
  } else {
    db = getFirestore(app);
  }

  storage = getStorage(app);
} catch (error) {
  try {
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (fallbackErr) {
    console.warn('Firebase initialization failed:', error.message);
  }
}

export { auth, googleProvider, db, storage };
export default app;
