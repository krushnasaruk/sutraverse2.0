'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/frontend/context/AuthContext';
import styles from './page.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Bot protection
    const [mathA, setMathA] = useState(0);
    const [mathB, setMathB] = useState(0);
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [honeypot, setHoneypot] = useState('');
    const [lockedOut, setLockedOut] = useState(false);
    


    useEffect(() => {
        setMathA(Math.floor(Math.random() * 10) + 1);
        setMathB(Math.floor(Math.random() * 10) + 1);

        const failedAttempts = parseInt(localStorage.getItem('loginAttempts') || '0');
        const lockTime = parseInt(localStorage.getItem('loginLockTime') || '0');
        
        if (lockTime > Date.now()) {
            setLockedOut(true);
        } else if (lockTime > 0) {
            localStorage.setItem('loginAttempts', '0');
            localStorage.setItem('loginLockTime', '0');
            setLockedOut(false);
        }
    }, []);

    const { loginWithEmail, loginWithGoogle } = useAuth();
    const router = useRouter();

    const getFriendlyError = (err) => {
        const code = err?.code || '';
        if (code.includes('user-not-found') || code.includes('invalid-credential')) return 'No account found with this email. Please sign up first.';
        if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'Incorrect password. Please try again.';
        if (code.includes('invalid-email')) return 'Please enter a valid email address.';
        if (code.includes('too-many-requests')) return 'Too many failed attempts. Please wait a moment and try again.';
        if (code.includes('network-request-failed')) return 'Network error. Check your internet connection.';
        if (code.includes('user-disabled')) return 'This account has been disabled. Contact support.';
        return 'Failed to sign in. Please check your credentials and try again.';
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        if (lockedOut) {
            setError('Too many failed attempts. Please try again later.');
            return;
        }

        if (honeypot) {
            setError('Spam detected.');
            return;
        }

        if (parseInt(captchaAnswer) !== mathA + mathB) {
            setError('Incorrect security question answer.');
            return;
        }

        setLoading(true);
        try {
            await loginWithEmail(email, password);
            localStorage.setItem('loginAttempts', '0');
            router.push('/');
        } catch (err) {
            const attempts = parseInt(localStorage.getItem('loginAttempts') || '0') + 1;
            localStorage.setItem('loginAttempts', attempts.toString());
            
            if (attempts >= 5) {
                const lockTime = Date.now() + 3 * 60 * 1000; // 3 mins
                localStorage.setItem('loginLockTime', lockTime.toString());
                setLockedOut(true);
                setError('Account locked for 3 minutes due to too many failed attempts.');
            } else {
                setError(getFriendlyError(err));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            await loginWithGoogle();
            router.push('/');
        } catch (err) {
            setError('Google sign-in failed. Please try again.');
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.authContainer}>
                <div className={styles.authHeader}>
                    <h1 className={styles.title}>Welcome Back</h1>
                    <p className={styles.subtitle}>Sign in to your Sutras account</p>
                </div>

                {error && <div className={styles.errorAlert}>{error}</div>}

                <form className={styles.form} onSubmit={handleEmailLogin}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input
                            type="email"
                            className={styles.input}
                            placeholder="you@college.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            className={styles.input}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* Honeypot Field */}
                    <input 
                        type="text" 
                        style={{ display: 'none' }} 
                        value={honeypot} 
                        onChange={e => setHoneypot(e.target.value)} 
                        tabIndex="-1" 
                        autoComplete="off" 
                    />

                    {/* Math Captcha */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Security Question: What is {mathA} + {mathB}?</label>
                        <input
                            type="number"
                            className={styles.input}
                            placeholder="Answer"
                            value={captchaAnswer}
                            onChange={(e) => setCaptchaAnswer(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading || lockedOut}>
                        {lockedOut ? 'Locked Out' : loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className={styles.divider}>
                    <span>OR</span>
                </div>

                <button className={styles.googleBtn} onClick={handleGoogleLogin}>
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className={styles.googleIcon} />
                    Continue with Google
                </button>

                <p className={styles.bottomText}>
                    Don't have an account? <Link href="/signup" className={styles.link}>Sign Up</Link>
                </p>
            </div>
        </div>
    );
}
