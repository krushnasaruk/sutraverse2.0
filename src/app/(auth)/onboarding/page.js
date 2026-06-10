'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/frontend/context/AuthContext';
import { db } from '@/database/config/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { BRANCHES, YEARS } from '@/shared/constants/subjectMap';
import styles from './page.module.css';

const DIVISIONS = ['A', 'B', 'C', 'D'];

export default function OnboardingPage() {
    const { user, updateUserProfile } = useAuth();
    const router = useRouter();

    const [branch, setBranch] = useState('');
    const [year, setYear] = useState('');
    const [division, setDivision] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already completed
    useEffect(() => {
        if (user && user.profileComplete) {
            router.push('/');
        }
    }, [user, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!branch || !year || !division || !rollNumber) {
            setError('Please fill out all fields.');
            return;
        }

        const classId = `${branch}-${year}-${division}`;
        const rollNumInt = parseInt(rollNumber, 10);

        setLoading(true);

        try {
            // 1. Verify Roll Number Uniqueness in the specific class
            const rosterRef = collection(db, 'roster');
            const q = query(
                rosterRef, 
                where('classId', '==', classId), 
                where('rollNumber', '==', rollNumInt),
                where('role', '==', 'student')
            );
            
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                // If the user already owns this record, it's fine. Otherwise reject.
                let takenBySomeoneElse = false;
                querySnapshot.forEach(doc => {
                    if (doc.id.toLowerCase() !== user.email.toLowerCase()) {
                        takenBySomeoneElse = true;
                    }
                });

                if (takenBySomeoneElse) {
                    setError(`Roll Number ${rollNumInt} is already claimed in ${classId}. Please contact your teacher if this is a mistake.`);
                    setLoading(false);
                    return;
                }
            }

            // 2. Add to Roster
            const userEmail = user.email.toLowerCase();
            const rosterData = {
                email: userEmail,
                name: user.name || userEmail.split('@')[0],
                classId: classId,
                role: 'student',
                rollNumber: rollNumInt,
                addedAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'roster', userEmail), rosterData, { merge: true });

            // 3. Update User Profile
            await updateUserProfile({
                branch,
                year,
                division,
                classId,
                rollNumber: rollNumInt,
                profileComplete: true
            });

            // Redirect to home
            window.location.href = '/';

        } catch (err) {
            console.error('Onboarding Error:', err);
            setError('Failed to save profile. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div className={styles.pageWrapper}><p>Loading...</p></div>;
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.onboardContainer}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Complete Your Profile</h1>
                    <p className={styles.subtitle}>Enter your academic details to join your class.</p>
                </div>

                {error && <div className={styles.errorAlert}>{error}</div>}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.rowGroup}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Branch</label>
                            <select className={styles.select} value={branch} onChange={(e) => setBranch(e.target.value)} required>
                                <option value="">Select Branch</option>
                                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Year</label>
                            <select className={styles.select} value={year} onChange={(e) => setYear(e.target.value)} required>
                                <option value="">Select Year</option>
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className={styles.rowGroup}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Division</label>
                            <select className={styles.select} value={division} onChange={(e) => setDivision(e.target.value)} required>
                                <option value="">Select Division</option>
                                {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Roll Number</label>
                            <input 
                                type="number" 
                                className={styles.input} 
                                value={rollNumber} 
                                onChange={(e) => setRollNumber(e.target.value)} 
                                min="1"
                                max="999"
                                placeholder="e.g. 42"
                                required 
                            />
                        </div>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Saving...' : 'Join Class'}
                    </button>
                </form>
            </div>
        </div>
    );
}
