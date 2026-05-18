'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';


const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        try {
            const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
                if (firebaseUser) {
                    // INSTANTLY set user from Firebase Auth (no async delay)
                    const quickUser = {
                        uid: firebaseUser.uid,
                        name: firebaseUser.displayName || '',
                        email: firebaseUser.email || '',
                        photoURL: firebaseUser.photoURL || '',
                        uploads: 0,
                        points: 0,
                    };
                    setUser(quickUser);
                    setLoading(false);

                    // Then enrich from Firestore in BACKGROUND with a live listener
                    const unsubUserDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), async (userDoc) => {
                        let userData = {};
                        if (userDoc.exists()) {
                            userData = userDoc.data();
                        } else {
                            userData = {
                                name: firebaseUser.displayName || '',
                                email: firebaseUser.email || '',
                                photoURL: firebaseUser.photoURL || '',
                                uploads: 0,
                                points: 0,
                                savedNotes: [],
                                profileComplete: false, // Force onboarding
                                createdAt: new Date().toISOString(),
                            };
                            await setDoc(doc(db, 'users', firebaseUser.uid), userData, { merge: true });
                        }

                        // Set the enriched + live-updated user
                        setUser(prev => ({ ...prev, uid: firebaseUser.uid, ...userData }));
                        
                        // Handle onboarding redirect
                        if (userData && userData.profileComplete === false && window.location.pathname !== '/onboarding' && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
                            window.location.href = '/onboarding';
                        }
                    }, (e) => {
                        console.warn('Firestore live listener failed:', e.message);
                    });

                    // Cleanup the snapshot listener when Auth state changes or unmounts
                    return () => {
                        unsubUserDoc();
                    };
                } else {
                    setUser(null);
                    setLoading(false);
                }
            });

            return () => unsubscribe();
        } catch (error) {
            console.warn('Auth listener failed:', error.message);
            setLoading(false);
        }
    }, []);


    const loginWithGoogle = async () => {
        if (!auth) throw new Error("Firebase not configured");
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const loginWithEmail = async (email, password) => {
        if (!auth) throw new Error("Firebase not configured");
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Email Login failed:', error);
            throw error;
        }
    };

    const signUpWithEmail = async (email, password, name, profile = {}) => {
        if (!auth) throw new Error("Firebase not configured");
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            let userData = {
                name: name,
                email: firebaseUser.email || email,
                photoURL: '',
                uploads: 0,
                points: 0,
                savedNotes: [],
                college: profile.college || '',
                branch: profile.branch || '',
                year: profile.year || '',
                semester: profile.semester || '',
                subjects: profile.subjects || [],
                profileComplete: !!(profile.branch && profile.year && profile.semester),
                createdAt: new Date().toISOString(),
            };

            // --- ROSTER AUTO-ASSIGNMENT ---
            try {
                if (userData.email) {
                    const rosterDoc = await getDoc(doc(db, 'roster', userData.email.toLowerCase()));
                    if (rosterDoc.exists()) {
                        const rosterData = rosterDoc.data();
                        userData.role = rosterData.role || 'student';
                        if (rosterData.classId) userData.classId = rosterData.classId;
                        if (rosterData.assignments) userData.assignments = rosterData.assignments;
                    }
                }
            } catch (err) {
                console.warn('Roster fetch error during signup:', err.message);
            }
            // ------------------------------

            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
            setUser({ uid: firebaseUser.uid, ...userData });
        } catch (error) {
            console.error('Signup failed:', error);
            throw error;
        }
    };

    const updateUserProfile = async (profileData) => {
        if (!auth || !user) throw new Error("Not authenticated");
        try {
            await setDoc(doc(db, 'users', user.uid), profileData, { merge: true });
            setUser(prev => ({ ...prev, ...profileData }));
        } catch (error) {
            console.error('Profile update failed:', error);
            throw error;
        }
    };

    const logout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);

        } catch (error) {
            console.error('Logout failed:', error.message);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signUpWithEmail, updateUserProfile, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
