import { createContext, useContext, useEffect, useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { expoPushToken } = usePushNotifications();

  // ── Sync Push Token ──
  useEffect(() => {
    if (user && expoPushToken) {
      const userRef = doc(db, 'users', user.uid);
      updateDoc(userRef, { expoPushToken }).catch(e => console.warn('Failed to sync push token', e));
    }
  }, [user?.uid, expoPushToken]);

  // ── Listen for real Auth changes ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        if (!firebaseUser.emailVerified) {
          // Block unverified users from accessing the app
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          // Fetch the user's detailed profile from Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userSnap.data()
            });
          } else {
            // If they authenticated but don't have a firestore doc, initialize it
            const defaultProfile = {
              name: firebaseUser.displayName || 'Student',
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL || '',
              uploads: 0,
              points: 0,
              college: '',
              branch: '',
              year: 'FE',
              role: 'student',
              profileComplete: true,
            };
            await setDoc(userRef, defaultProfile);
            setUser({
              uid: firebaseUser.uid,
              ...defaultProfile
            });
          }
        } catch (err) {
          console.warn('Error fetching Firestore user profile:', err);
          // Fallback to basic auth info if firestore fails
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'Student',
            photoURL: firebaseUser.photoURL || '',
            role: 'student',
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ── Real Firebase Login ──
  const loginWithEmail = async (email, password) => {
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!res.user.emailVerified) {
        await signOut(auth);
        throw new Error("verify_email_required");
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // ── Real Firebase Signup ──
  const signUpWithEmail = async (email, password, name, profile = {}) => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const userRef = doc(db, 'users', res.user.uid);
      const initialProfile = {
        name: name || 'Student',
        email: email.trim(),
        photoURL: '',
        uploads: 0,
        points: 0,
        college: profile.college || '',
        branch: profile.branch || '',
        year: profile.year || 'FE',
        role: 'student',
        profileComplete: true,
      };
      await setDoc(userRef, initialProfile);

      // Send the verification email immediately
      await sendEmailVerification(res.user);
      
      // Sign out so they don't get stuck in an authenticated-but-unverified state
      await signOut(auth);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // ── Resend Verification Email ──
  const resendVerificationEmail = async (email, password) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), password);
      await sendEmailVerification(res.user);
      await signOut(auth);
    } catch (err) {
      throw err;
    }
  };

  // ── Real Firestore Profile Update ──
  const updateUserProfile = async (profileData) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, profileData);
      setUser(prev => prev ? { ...prev, ...profileData } : null);
    } catch (err) {
      console.warn('Error updating Firestore profile:', err);
      // Fallback local update
      setUser(prev => prev ? { ...prev, ...profileData } : null);
    }
  };

  // ── Dummy Google Login (Unused but kept to satisfy signature) ──
  const loginWithGoogle = async () => {
    throw new Error('Google Sign-In is managed securely through our Web platform.');
  };

  // ── Real Firebase Password Reset (Google sets password) ──
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      throw err;
    }
  };

  // ── Real Firebase Logout ──
  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Get ID Token ──
  const getToken = async () => {
    if (auth.currentUser) {
      try {
        return await auth.currentUser.getIdToken(true);
      } catch (err) {
        console.warn('Failed to get token', err);
        return null;
      }
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signUpWithEmail, updateUserProfile, logout, resetPassword, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
