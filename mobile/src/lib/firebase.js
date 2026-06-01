import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCKWoYmyjRcdmqnaHerEHCr9ScNmXNBets",
  authDomain: "sutraverse2.firebaseapp.com",
  projectId: "sutraverse2",
  storageBucket: "sutraverse2.firebasestorage.app",
  messagingSenderId: "666020084296",
  appId: "1:666020084296:web:0dd52b77ce6a245253b67d",
};

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;
