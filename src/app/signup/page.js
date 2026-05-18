'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function SignupPage() {
    // Step 1: Account
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');



    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Bot protection
    const [mathA, setMathA] = useState(0);
    const [mathB, setMathB] = useState(0);
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [honeypot, setHoneypot] = useState('');

    useEffect(() => {
        setMathA(Math.floor(Math.random() * 10) + 1);
        setMathB(Math.floor(Math.random() * 10) + 1);
    }, []);

    const { signUpWithEmail, loginWithGoogle } = useAuth();
    const router = useRouter();



    const handleStep1 = async (e) => {
        e.preventDefault();
        setError('');
        
        if (honeypot) {
            setError('Spam detected.');
            return;
        }

        if (parseInt(captchaAnswer) !== mathA + mathB) {
            setError('Incorrect security question answer.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            await signUpWithEmail(email, password, name, {});
            // AuthContext will automatically redirect to /onboarding
        } catch (err) {
            setError(getFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    const getFriendlyError = (err) => {
        const code = err?.code || '';
        if (code.includes('email-already-in-use')) return 'This email is already registered. Try signing in instead.';
        if (code.includes('weak-password')) return 'Password is too weak. Use at least 6 characters.';
        if (code.includes('invalid-email')) return 'Please enter a valid email address.';
        if (code.includes('network-request-failed')) return 'Network error. Check your internet connection.';
        if (code.includes('too-many-requests')) return 'Too many attempts. Please wait a moment and try again.';
        return err.message || 'Failed to create account. Please try again.';
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            await loginWithGoogle();
            // AuthContext will handle redirect
        } catch (err) {
            setError('Google sign-up failed. Please try again.');
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.authContainer}>
                <div className={styles.authHeader}>
                    <h1 className={styles.title}>Create Account</h1>
                    <p className={styles.subtitle}>Join Sutras to share and access notes.</p>
                </div>

                        {error && <div className={styles.errorAlert}>{error}</div>}

                        <form className={styles.form} onSubmit={handleStep1}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Full Name</label>
                                <input type="text" className={styles.input} placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Email Address</label>
                                <input type="email" className={styles.input} placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Password</label>
                                <input type="password" className={styles.input} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
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

                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>

                        <div className={styles.divider}><span>OR</span></div>
                        <button className={styles.googleBtn} onClick={handleGoogleLogin}>
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className={styles.googleIcon} />
                            Sign up with Google
                        </button>
                        <p className={styles.bottomText}>Already have an account? <Link href="/login" className={styles.link}>Sign In</Link></p>
            </div>
        </div>
    );
}
