'use client';

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/database/config/firebase';
import styles from '../page.module.css';
import { IconCheck, IconX } from '@/frontend/components/ui/Icons';

export default function CustomizeAdmin({ customForm, setCustomForm, FEATURE_DESCRIPTIONS }) {
    const [saving, setSaving] = useState(false);

    const handleSaveCustom = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'customization'), customForm);
            alert('Customization saved successfully!');
        } catch (e) {
            console.error('Error saving customization:', e);
            alert('Failed to save.');
        }
        setSaving(false);
    };

    return (
        <div className={styles.brandingContainer}>
            <div className={styles.brandingHeader}>
                <h2>🔧 Customize Site Features & Alerts</h2>
                <p>Control feature availability and publish urgent announcements sitewide.</p>
            </div>

            <div className={styles.brandingGrid}>
                <div className={styles.brandingCard}>
                    <h3>Feature Toggles</h3>
                    <div className={styles.toggleGrid}>
                        {Object.entries(FEATURE_DESCRIPTIONS).map(([key, info]) => (
                            <div key={key} className={styles.toggleCard}>
                                <div className={styles.toggleInfo}>
                                    <div className={styles.toggleLabel}>{info.label}</div>
                                    <div className={styles.toggleDesc}>{info.desc}</div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={customForm.featureToggles[key] ?? true}
                                        onChange={e => {
                                            const newVal = e.target.checked;
                                            setCustomForm(prev => ({
                                                ...prev,
                                                featureToggles: {
                                                    ...prev.featureToggles,
                                                    [key]: newVal
                                                }
                                            }));
                                        }}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.brandingCard}>
                    <h3>Site-wide Announcement</h3>
                    <div className={styles.formGroup}>
                        <label>Enabled</label>
                        <input
                            type="checkbox"
                            checked={customForm.announcement?.enabled}
                            onChange={e => setCustomForm({...customForm, announcement: {...customForm.announcement, enabled: e.target.checked}})}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Message Text</label>
                        <input
                            type="text"
                            className={styles.modalInput}
                            value={customForm.announcement?.text}
                            onChange={e => setCustomForm({...customForm, announcement: {...customForm.announcement, text: e.target.value}})}
                        />
                    </div>
                    {/* ... other fields ... */}
                </div>
            </div>

            <div className={styles.brandingFooter}>
                <button
                    className={styles.saveBrandingBtn}
                    onClick={handleSaveCustom}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : <><IconCheck size={20} /> Save Configuration</>}
                </button>
            </div>
        </div>
    );
}
