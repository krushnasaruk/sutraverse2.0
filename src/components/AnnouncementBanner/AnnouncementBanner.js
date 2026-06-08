'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCollege } from '@/context/CollegeContext';
import styles from './AnnouncementBanner.module.css';

export default function AnnouncementBanner() {
    const { announcement } = useCollege();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!announcement || !announcement.enabled || !announcement.text) {
            setVisible(false);
            return;
        }

        // Check auto-expiry
        if (announcement.expiresAt) {
            const expiry = new Date(announcement.expiresAt);
            if (new Date() > expiry) {
                setVisible(false);
                return;
            }
        }

        // Check if dismissed
        const dismissedText = localStorage.getItem('sutra_dismissed_announcement');
        if (dismissedText === announcement.text) {
            setVisible(false);
            return;
        }

        setVisible(true);
    }, [announcement]);

    const handleDismiss = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (announcement?.text) {
            localStorage.setItem('sutra_dismissed_announcement', announcement.text);
        }
        setVisible(false);
    };

    if (!visible || !announcement) return null;

    const bannerStyle = {
        backgroundColor: announcement.color || '#3b82f6',
    };

    const isExternal = announcement.link && (announcement.link.startsWith('http://') || announcement.link.startsWith('https://'));

    const bannerContent = (
        <div className={styles.banner} style={bannerStyle}>
            <div className={styles.container}>
                <span className={styles.text}>{announcement.text}</span>
                {announcement.link && (
                    <span className={styles.cta}>
                        Learn more <span className={styles.arrow}>→</span>
                    </span>
                )}
            </div>
            <button 
                type="button" 
                className={styles.dismissBtn} 
                onClick={handleDismiss}
                aria-label="Dismiss announcement"
            >
                ✕
            </button>
        </div>
    );

    if (announcement.link) {
        if (isExternal) {
            return (
                <a href={announcement.link} target="_blank" rel="noopener noreferrer" className={styles.linkWrapper}>
                    {bannerContent}
                </a>
            );
        }
        return (
            <Link href={announcement.link} className={styles.linkWrapper}>
                {bannerContent}
            </Link>
        );
    }

    return bannerContent;
}
