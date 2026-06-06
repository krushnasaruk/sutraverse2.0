'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import styles from './page.module.css';

export default function VerifyEmailPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
                return;
            }
            
            // Check if already verified
            if (auth.currentUser?.emailVerified) {
                router.push('/dashboard');
            }
        }
    }, [user, loading, router]);

    const handleResend = async () => {
        if (!auth.currentUser) return;
        setSending(true);
        setError('');
        setMessage('');
        try {
            await sendEmailVerification(auth.currentUser);
            setMessage('Verification email sent! Please check your inbox.');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/too-many-requests') {
                setError('We just sent an email. Please wait a bit before requesting another one.');
            } else {
                setError('Failed to send verification email. Please try again later.');
            }
        } finally {
            setSending(false);
        }
    };

    const handleRefresh = async () => {
        if (!auth.currentUser) return;
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
            // Force AuthContext to catch the new state by reloading the page
            window.location.href = '/dashboard';
        } else {
            setError('Email not verified yet. Please check your inbox.');
        }
    };

    if (loading) return null;

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <div className={styles.iconWrapper}>
                    <span className={styles.icon}>✉️</span>
                </div>
                <h1 className={styles.title}>Verify your email</h1>
                <p className={styles.subtitle}>
                    We've sent an email to <span className={styles.emailText}>{user?.email}</span>. 
                    Please click the link in the email to verify your account and get started.
                </p>

                {error && <div className={styles.errorAlert}>{error}</div>}
                {message && <div className={styles.successAlert}>{message}</div>}

                <div className={styles.actions}>
                    <button 
                        className={styles.primaryBtn} 
                        onClick={handleRefresh}
                    >
                        I've verified my email
                    </button>
                    <button 
                        className={styles.secondaryBtn} 
                        onClick={handleResend}
                        disabled={sending}
                    >
                        {sending ? 'Sending...' : 'Resend Email'}
                    </button>
                </div>
            </div>
        </div>
    );
}
