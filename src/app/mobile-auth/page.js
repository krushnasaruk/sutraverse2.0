'use client';

import React, { useEffect, useState } from 'react';
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export default function MobileAuth() {
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [error, setError] = useState('');
    const [appDeepLink, setAppDeepLink] = useState('');
    const [token, setToken] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        let uri = params.get('redirect_uri');
        if (uri) {
            sessionStorage.setItem('auth_redirect_uri', uri);
        } else {
            uri = sessionStorage.getItem('auth_redirect_uri');
        }

        if (!uri) {
            setStatus('error');
            setError('Missing redirect_uri parameter. Cannot return to the mobile app.');
            return;
        }

        const redirectInitiated = sessionStorage.getItem('auth_redirect_initiated');

        // Set up the listener for successful authentication
        let authTimeout = null;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                console.log('onAuthStateChanged: User is signed in:', firebaseUser.email);
                sessionStorage.removeItem('auth_redirect_initiated');
                if (authTimeout) clearTimeout(authTimeout);
                try {
                    const idToken = await firebaseUser.getIdToken(true);
                    setToken(idToken);
                    const targetUrl = `${uri}${uri.includes('?') ? '&' : '?'}idToken=${encodeURIComponent(idToken)}`;
                    setAppDeepLink(targetUrl);
                    setStatus('success');
                    window.location.replace(targetUrl);
                } catch (tokenErr) {
                    console.error('Failed to get user ID token:', tokenErr);
                    setStatus('error');
                    setError('Failed to retrieve authentication token.');
                }
            }
        });

        if (redirectInitiated === 'true') {
            console.log('Returning from Google redirect. Processing result...');
            getRedirectResult(auth)
                .then((result) => {
                    console.log('getRedirectResult resolved:', result ? 'user found' : 'null');
                    if (!result && !auth.currentUser) {
                        // Fallback: wait up to 5 seconds for onAuthStateChanged to fire before showing error
                        authTimeout = setTimeout(() => {
                            if (!auth.currentUser) {
                                sessionStorage.removeItem('auth_redirect_initiated');
                                setStatus('error');
                                setError('Could not retrieve credentials from Google. Please try again.');
                            }
                        }, 5000);
                    }
                })
                .catch((err) => {
                    console.error('getRedirectResult error:', err);
                    sessionStorage.removeItem('auth_redirect_initiated');
                    setStatus('error');
                    setError(err.message || 'Failed to complete Google authentication.');
                });
        } else {
            // Fresh login request: trigger redirect to Google after a short delay
            const delay = setTimeout(() => {
                if (!auth.currentUser) {
                    console.log('Triggering signInWithRedirect...');
                    sessionStorage.setItem('auth_redirect_initiated', 'true');
                    signInWithRedirect(auth, googleProvider).catch((err) => {
                        console.error('Redirect failed:', err);
                        sessionStorage.removeItem('auth_redirect_initiated');
                        setStatus('error');
                        setError(err.message || 'Failed to redirect to Google.');
                    });
                }
            }, 500);
            return () => {
                unsubscribe();
                clearTimeout(delay);
                if (authTimeout) clearTimeout(authTimeout);
            };
        }

        return () => {
            unsubscribe();
            if (authTimeout) clearTimeout(authTimeout);
        };
    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.glow} />
            
            {status === 'loading' && (
                <div style={styles.loaderContainer}>
                    <div style={styles.spinner} />
                </div>
            )}

            {status === 'success' && (
                <div style={styles.card}>
                    <div style={styles.successIcon}>✓</div>
                    <h2 style={styles.successTitle}>Signed In</h2>
                    <p style={styles.statusText}>Your account is connected.</p>
                    <a 
                        href={appDeepLink} 
                        style={styles.openAppButton}
                        onClick={(e) => {
                            window.location.replace(appDeepLink);
                        }}
                    >
                        Open Sutraverse App
                    </a>
                    
                    <div style={styles.tokenContainer}>
                        <label style={styles.tokenLabel}>Authorization Token</label>
                        <div style={styles.tokenInputWrapper}>
                            <input 
                                type="text" 
                                readOnly 
                                value={token} 
                                style={styles.tokenInput} 
                                onClick={(e) => {
                                    e.target.select();
                                }}
                            />
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(token);
                                    alert('Token copied to clipboard!');
                                }}
                                style={styles.copyButton}
                            >
                                Copy Token
                            </button>
                        </div>
                        <p style={styles.tokenHint}>If the app didn't open automatically, copy this code and paste it inside the app to complete login.</p>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div style={styles.card}>
                    <div style={styles.errorIcon}>✕</div>
                    <h2 style={styles.errorTitle}>Auth Error</h2>
                    <p style={styles.errorText}>{error}</p>
                    <button 
                        style={styles.retryButton} 
                        onClick={() => {
                            sessionStorage.removeItem('auth_redirect_initiated');
                            window.location.reload();
                        }}
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#030712',
        color: '#f9fafb',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
    },
    glow: {
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, rgba(0, 0, 0, 0) 70%)',
        top: '20%',
        left: 'calc(50% - 200px)',
        zIndex: 0,
    },
    card: {
        width: '100%',
        maxWidth: '360px',
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '32px 24px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(16px)',
        textAlign: 'center',
        zIndex: 1,
    },
    loaderContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinner: {
        width: '32px',
        height: '32px',
        border: '3px solid rgba(59, 130, 246, 0.1)',
        borderTop: '3px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    statusText: {
        fontSize: '13px',
        color: '#9ca3af',
        margin: '0 0 20px 0',
        lineHeight: '1.5',
    },
    successIcon: {
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        color: '#10b981',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px',
        fontWeight: 'bold',
        margin: '0 auto 16px auto',
    },
    successTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#f9fafb',
        margin: '0 0 8px 0',
    },
    openAppButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '44px',
        borderRadius: '22px',
        backgroundColor: '#2563eb',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '700',
        textDecoration: 'none',
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
        cursor: 'pointer',
    },
    errorIcon: {
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px',
        fontWeight: 'bold',
        margin: '0 auto 16px auto',
    },
    errorTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#f9fafb',
        margin: '0 0 8px 0',
    },
    errorText: {
        fontSize: '14px',
        color: '#ef4444',
        margin: '0 0 16px 0',
        lineHeight: '1.5',
    },
    retryButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        color: '#f9fafb',
        padding: '10px 24px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '16px',
    },
    // Premium Token Copy Box styles
    tokenContainer: {
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'left',
    },
    tokenLabel: {
        display: 'block',
        fontSize: '11px',
        fontWeight: '600',
        color: '#6366f1',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '6px',
    },
    tokenInputWrapper: {
        display: 'flex',
        gap: '8px',
    },
    tokenInput: {
        flex: 1,
        height: '36px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '0 12px',
        color: '#a5b4fc',
        fontSize: '13px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    copyButton: {
        height: '36px',
        padding: '0 14px',
        backgroundColor: '#4f46e5',
        border: 'none',
        borderRadius: '8px',
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
    },
    tokenHint: {
        fontSize: '11px',
        color: '#6b7280',
        marginTop: '8px',
        lineHeight: '1.4',
    },
};

// Add standard keyframe animation for spinner
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.innerText = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(styleSheet);
}
