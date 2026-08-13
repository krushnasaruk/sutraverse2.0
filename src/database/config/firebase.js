import { initializeApp, getApps } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { initializeFirestore, getFirestore, persistentLocalCache, setLogLevel } from 'firebase/firestore';
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

// Suppress internal Firestore primary tab lease warnings across multiple browser tabs / HMR
if (typeof window !== 'undefined') {
  const origConsoleError = console.error;
  console.error = function (...args) {
    const str = args.map(a => (a && typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    if (
      str.includes('Failed to obtain primary lease') ||
      str.includes('Backfill Indexes')
    ) {
      return; // Filter internal Firebase multi-tab index backfill lease noise
    }
    origConsoleError.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason &&
      (
        (typeof event.reason === 'string' && (event.reason.includes('Failed to obtain primary lease') || event.reason.includes('Backfill Indexes'))) ||
        (typeof event.reason.message === 'string' && (event.reason.message.includes('Failed to obtain primary lease') || event.reason.message.includes('Backfill Indexes')))
      )
    ) {
      event.preventDefault();
    }
  });
}

let app;
let auth;
let googleProvider;
let db;
let storage;

try {
  const isExistingApp = getApps().length > 0;
  app = isExistingApp ? getApps()[0] : initializeApp(firebaseConfig);

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

  // Initialize Firestore with standard single-tab persistent local cache
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
    // Prevent SSR memory leaks by using a clean Firestore instance on the server
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
  // Fall back to getFirestore on initialization conflict
  try {
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (fallbackErr) {
    console.warn('Firebase initialization failed:', error.message);
  }
}

export { auth, googleProvider, db, storage };
export default app;
