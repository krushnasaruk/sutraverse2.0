'use client';

import styles from '../page.module.css';

export default function OnboardingPopup({
    showOnboarding,
    setShowOnboarding
}) {
    if (!showOnboarding) return null;

    const completeOnboarding = () => {
        setShowOnboarding(false);
        localStorage.setItem('dashboard_onboarding_seen', 'true');
    };

    return (
        <div className={styles.onboardingOverlay} onClick={completeOnboarding}>
            <div className={styles.onboardingCard} onClick={(e) => e.stopPropagation()}>
                <div className={styles.onboardingHeader}>
                    <span className={styles.onboardingEmoji}>👋</span>
                    <h3 className={styles.onboardingTitle}>Welcome to Your Dashboard!</h3>
                    <p className={styles.onboardingSubtitle}>Here&apos;s how to navigate</p>
                </div>
                <div className={styles.onboardingTips}>
                    <div className={styles.onboardingTip}>
                        <div className={styles.onboardingTipIcon}>⚡</div>
                        <div className={styles.onboardingTipText}>
                            <span className={styles.onboardingTipTitle}>Quick Access Dock</span>
                            <span className={styles.onboardingTipDesc}>Tap &quot;Quick Access&quot; to jump to any page instantly</span>
                        </div>
                    </div>
                    <div className={styles.onboardingTip}>
                        <div className={styles.onboardingTipIcon}>🧭</div>
                        <div className={styles.onboardingTipText}>
                            <span className={styles.onboardingTipTitle}>Bottom Navigation</span>
                            <span className={styles.onboardingTipDesc}>Use the bottom bar for Home, Subjects, Upload, AI &amp; Community</span>
                        </div>
                    </div>
                    <div className={styles.onboardingTip}>
                        <div className={styles.onboardingTipIcon}>🏠</div>
                        <div className={styles.onboardingTipText}>
                            <span className={styles.onboardingTipTitle}>Your Hub Lives Here</span>
                            <span className={styles.onboardingTipDesc}>Profile, class data, grades &amp; attendance — all in one place</span>
                        </div>
                    </div>
                </div>
                <button
                    className={styles.onboardingBtn}
                    onClick={completeOnboarding}
                >
                    Got it! 🚀
                </button>
            </div>
        </div>
    );
}
